#!/usr/bin/env python
"""
MAHASETU Automated Benchmark & Concurrency Load Tester
Tests platform throughput, concurrency, latency percentiles, and error rate across key endpoints.
Can execute in-process via httpx AsyncClient (for CI/CD without running uvicorn) or against a live URL.

Usage:
  python backend/scripts/load_test.py [--url http://127.0.0.1:8000] [--concurrency 25] [--requests 200]
"""

import os
import sys
import time
import asyncio
import argparse
from typing import List, Dict, Any

# Ensure backend path is available
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
os.environ.setdefault("JWT_SECRET", "test-secret-key-only-for-automated-pytest-execution-94821")
os.environ.setdefault("DEMO_MODE", "true")

import httpx

ENDPOINTS = [
    {"name": "Liveness Probe", "path": "/healthz", "auth": False},
    {"name": "Services Catalog (GZip)", "path": "/api/v1/services", "auth": True},
    {"name": "Services Stats (Cached)", "path": "/api/v1/services/stats", "auth": True},
    {"name": "Passport Verification", "path": "/api/v1/passport/verify/MSP-BENCHMARK-001", "auth": False},
    {"name": "Citizen Summary", "path": "/api/v1/applications/citizen-summary", "auth": True},
    {"name": "Live Feed (SSE Tick)", "path": "/api/v1/applications/live-feed?max_events=1", "auth": True, "sse": True},
]


async def run_benchmark(base_url: str, concurrency: int, total_requests: int):
    print(f"\n=================================================================")
    print(f"       MAHASETU HIGH-CONCURRENCY PERFORMANCE BENCHMARK           ")
    print(f"=================================================================")
    print(f"Target:       {base_url or 'In-Process ASGI app'}")
    print(f"Concurrency:  {concurrency} concurrent workers")
    print(f"Total Reqs:   {total_requests} requests")
    print(f"=================================================================\n")

    # If running in-process, load FastAPI app
    app = None
    if not base_url:
        from backend.app.main import app as fastapi_app
        app = fastapi_app

    # Create dummy citizen token
    from backend.app.database import SessionLocal
    from backend.app.models.user import User
    from backend.app.auth import create_access_token

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "CITIZEN").first()
        if not user:
            token = create_access_token({"sub": "CITIZEN-BENCHMARK-1", "role": "CITIZEN"})
        else:
            token = create_access_token({"sub": user.id, "role": user.role})
    finally:
        db.close()

    headers_auth = {
        "Authorization": f"Bearer {token}",
        "Accept-Encoding": "gzip",
    }
    headers_public = {
        "Accept-Encoding": "gzip",
    }

    results: List[Dict[str, Any]] = []
    latencies: List[float] = []

    queue = asyncio.Queue()
    for i in range(total_requests):
        ep = ENDPOINTS[i % len(ENDPOINTS)]
        queue.put_nowait(ep)

    start_global = time.perf_counter()

    async def worker(worker_id: int, client: httpx.AsyncClient):
        while not queue.empty():
            try:
                ep = queue.get_nowait()
            except asyncio.QueueEmpty:
                break

            url = ep["path"]
            headers = headers_auth if ep["auth"] else headers_public
            req_start = time.perf_counter()
            status_code = 0
            err = None

            try:
                # Include query token for SSE endpoint
                if ep.get("sse"):
                    url = f"{url}&token={token}"
                resp = await client.get(url, headers=headers, timeout=10.0)
                status_code = resp.status_code
            except Exception as exc:
                err = str(exc)
            finally:
                req_elapsed = (time.perf_counter() - req_start) * 1000.0  # ms
                latencies.append(req_elapsed)
                results.append({
                    "endpoint": ep["name"],
                    "status": status_code,
                    "elapsed_ms": req_elapsed,
                    "error": err,
                })
                queue.task_done()

    # Launch client
    transport = httpx.ASGITransport(app=app) if app else None
    client_args = {"transport": transport, "base_url": base_url or "http://testserver"}

    async with httpx.AsyncClient(**client_args) as client:
        tasks = [asyncio.create_task(worker(i, client)) for i in range(concurrency)]
        await asyncio.gather(*tasks)

    total_duration = time.perf_counter() - start_global

    # Compute metrics
    total_completed = len(results)
    success_count = sum(1 for r in results if 200 <= r["status"] < 400)
    failed_count = total_completed - success_count
    latencies.sort()

    p50 = latencies[int(len(latencies) * 0.50)] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    rps = total_completed / total_duration if total_duration > 0 else 0

    print(f"BENCHMARK RESULTS SUMMARY:")
    print(f"-----------------------------------------------------------------")
    print(f"Total Requests:       {total_completed}")
    print(f"Success Count:        {success_count} ({round(success_count / total_completed * 100, 2)}%)")
    print(f"Failed Count:         {failed_count}")
    print(f"Total Duration:       {total_duration:.2f} seconds")
    print(f"Throughput:           {rps:.1f} req/sec")
    print(f"Avg Latency:          {avg_latency:.2f} ms")
    print(f"p50 Latency:          {p50:.2f} ms")
    print(f"p95 Latency:          {p95:.2f} ms")
    print(f"p99 Latency:          {p99:.2f} ms")
    print(f"-----------------------------------------------------------------")

    # Endpoint breakdown
    print(f"\nENDPOINT BREAKDOWN:")
    for ep in ENDPOINTS:
        ep_res = [r for r in results if r["endpoint"] == ep["name"]]
        if ep_res:
            ep_lats = [r["elapsed_ms"] for r in ep_res]
            ep_avg = sum(ep_lats) / len(ep_lats)
            ep_succ = sum(1 for r in ep_res if 200 <= r["status"] < 400)
            print(f"  * {ep['name']:<26} {len(ep_res):>3} reqs | {ep_succ}/{len(ep_res)} ok | avg {ep_avg:.1f}ms")

    print(f"=================================================================\n")
    if failed_count > 0:
        print(f"[!] Warning: Encountered {failed_count} errors during benchmark.")
        for r in [r for r in results if r["error"] or r["status"] >= 400][:5]:
            print(f"   Sample Failure: {r['endpoint']} -> {r['status']} ({r['error']})")
        sys.exit(1)
    else:
        print("[OK] Benchmark PASSED with 0 errors.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MahaSetu Performance Benchmark")
    parser.add_argument("--url", default="", help="Base server URL (leave empty for in-process ASGI benchmark)")
    parser.add_argument("--concurrency", type=int, default=25, help="Concurrent workers (default: 25)")
    parser.add_argument("--requests", type=int, default=150, help="Total requests (default: 150)")
    args = parser.parse_args()

    asyncio.run(run_benchmark(args.url, args.concurrency, args.requests))
