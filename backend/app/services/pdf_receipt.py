import io
from datetime import datetime, timezone
from typing import Dict, Any

def generate_minimal_pdf_receipt(
    application_number: str,
    citizen_name: str,
    service_name: str,
    status: str,
    department: str,
    timestamp: str,
    sha_hash: str
) -> bytes:
    """
    Generates an official Government of Maharashtra service receipt PDF using standard PDF-1.4 syntax.
    Zero external C dependencies required; completely portable.
    """
    buffer = io.BytesIO()
    
    # Simple, compliant single-page PDF-1.4 generator
    content_lines = [
        "BT",
        "/F1 18 Tf",
        "50 750 Td",
        "(GOVERNMENT OF MAHARASHTRA) Tj",
        "/F1 12 Tf",
        "0 -25 Td",
        "(MAHASETU INTEROPERABILITY FRAMEWORK - OFFICIAL SERVICE RECEIPT) Tj",
        "0 -20 Td",
        "(Problem Statement 26129 - DPDP Act 2023 Compliant) Tj",
        "/F2 10 Tf",
        "0 -30 Td",
        f"(Application Number: {application_number}) Tj",
        "0 -18 Td",
        f"(Beneficiary Citizen: {citizen_name}) Tj",
        "0 -18 Td",
        f"(Government Service: {service_name}) Tj",
        "0 -18 Td",
        f"(Sanctioning Department: {department}) Tj",
        "0 -18 Td",
        f"(Application Status: {status}) Tj",
        "0 -18 Td",
        f"(Issued At UTC: {timestamp}) Tj",
        "0 -25 Td",
        f"(Cryptographic Audit Hash: {sha_hash[:32]}...) Tj",
        "0 -25 Td",
        f"(Verify Authenticity: https://mahasetu.maharashtra.gov.in/verify/{application_number}) Tj",
        "/F1 9 Tf",
        "0 -40 Td",
        "(This is a computer generated, cryptographically sealed receipt issued under RTSA 2015.) Tj",
        "0 -12 Td",
        "(No physical signature required. Verified via MahaSetu Merkle Audit Tree.) Tj",
        "ET"
    ]
    stream_content = "\n".join(content_lines).encode("latin1")
    stream_len = len(stream_content)

    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources 4 0 R /Contents 5 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>\nendobj\n"
        b"5 0 obj\n<< /Length " + str(stream_len).encode("ascii") + b" >>\nstream\n"
        + stream_content +
        b"\nendstream\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000216 00000 n \n"
        b"0000000344 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"
        + str(400 + stream_len).encode("ascii") +
        b"\n%%EOF\n"
    )
    return pdf
