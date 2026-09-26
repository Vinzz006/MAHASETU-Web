import threading
import time
from collections import defaultdict


class PrometheusMetrics:
    def __init__(self):
        self._lock = threading.Lock()
        self._start_time = time.time()
        # (method, path, status) -> count
        self._http_requests_total: dict[tuple[str, str, str], int] = defaultdict(int)
        # path -> (sum_duration, count)
        self._http_request_durations: dict[str, tuple[float, int]] = defaultdict(
            lambda: (0.0, 0)
        )
        # (department, status) -> count
        self._dept_tx_total: dict[tuple[str, str], int] = defaultdict(int)
        # Cache metrics
        self._cache_hits = 0
        self._cache_misses = 0

    def record_request(
        self, method: str, path: str, status_code: int, duration_seconds: float
    ):
        # Normalize paths to prevent cardinality explosion
        clean_path = path.split("?")[0]
        if "/api/v1/applications/" in clean_path and len(clean_path.split("/")) > 4:
            clean_path = "/api/v1/applications/{id}"
        elif "/api/v1/passport/" in clean_path and len(clean_path.split("/")) > 4:
            clean_path = "/api/v1/passport/{id}"

        status_str = str(status_code)
        with self._lock:
            self._http_requests_total[(method, clean_path, status_str)] += 1
            curr_sum, curr_count = self._http_request_durations[clean_path]
            self._http_request_durations[clean_path] = (
                curr_sum + duration_seconds,
                curr_count + 1,
            )

    def record_cache_hit(self):
        with self._lock:
            self._cache_hits += 1

    def record_cache_miss(self):
        with self._lock:
            self._cache_misses += 1

    def record_dept_transaction(self, department: str, status: str):
        with self._lock:
            self._dept_tx_total[(department, status)] += 1

    def generate_exposition(self) -> str:
        lines = []
        now = time.time()
        uptime = now - self._start_time

        lines.append(
            "# HELP mahasetu_uptime_seconds Total application uptime in seconds"
        )
        lines.append("# TYPE mahasetu_uptime_seconds gauge")
        lines.append(f"mahasetu_uptime_seconds {uptime:.2f}")

        # Cache metrics
        lines.append(
            "# HELP mahasetu_cache_hits_total Total count of Redis/in-memory cache hits"
        )
        lines.append("# TYPE mahasetu_cache_hits_total counter")
        lines.append(f"mahasetu_cache_hits_total {self._cache_hits}")

        lines.append(
            "# HELP mahasetu_cache_misses_total Total count of Redis/in-memory cache misses"
        )
        lines.append("# TYPE mahasetu_cache_misses_total counter")
        lines.append(f"mahasetu_cache_misses_total {self._cache_misses}")

        # HTTP Requests Total
        lines.append(
            "# HELP http_requests_total Total number of HTTP requests processed"
        )
        lines.append("# TYPE http_requests_total counter")
        with self._lock:
            for (method, path, status), count in sorted(
                self._http_requests_total.items()
            ):
                lines.append(
                    f'http_requests_total{{method="{method}",handler="{path}",status="{status}"}} {count}'
                )

            # HTTP Request Durations
            lines.append(
                "# HELP http_request_duration_seconds HTTP request latencies in seconds"
            )
            lines.append("# TYPE http_request_duration_seconds summary")
            for path, (sum_d, count) in sorted(self._http_request_durations.items()):
                lines.append(
                    f'http_request_duration_seconds_sum{{handler="{path}"}} {sum_d:.4f}'
                )
                lines.append(
                    f'http_request_duration_seconds_count{{handler="{path}"}} {count}'
                )

            # Department Transactions
            if self._dept_tx_total:
                lines.append(
                    "# HELP mahasetu_department_transactions_total Total cross-department transactions processed"
                )
                lines.append("# TYPE mahasetu_department_transactions_total counter")
                for (dept, status), count in sorted(self._dept_tx_total.items()):
                    lines.append(
                        f'mahasetu_department_transactions_total{{department="{dept}",status="{status}"}} {count}'
                    )

        lines.append("")  # Trailing newline required by Prometheus specification
        return "\n".join(lines)


metrics_service = PrometheusMetrics()
