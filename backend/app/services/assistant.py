import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("mahasetu.assistant")

def get_gemini_metadata() -> Dict[str, Any]:
    """Returns the operational status and model metadata for Google Gemini."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    return {
        "gemini_active": bool(key),
        "model": model,
        "provider": "Google Gemini",
        "grounding_enabled": True
    }

def build_system_context(
    user_name: str,
    applications: List[Dict[str, Any]],
    profile_info: Optional[Dict[str, Any]],
    services: List[Dict[str, Any]]
) -> str:
    """Builds an authoritative system prompt grounding Gemini in live citizen state and state schemes."""
    apps_text = "\n".join([
        f"- Application Number: {a['application_number']} | Service: {a.get('service_name', a.get('service_id'))} | Status: {a['status']} | Current Dept: {a['current_department']}"
        + (f" | Rework/Rejection Note: {a['rejection_reason']}" if a.get('rejection_reason') else "")
        for a in applications
    ]) if applications else "No active applications submitted yet."

    services_text = "\n".join([
        f"- ID: {s['id']} | Title: {s['name']} | Dept: {s.get('department', 'General')} | SLA: {s.get('sla_days', 7)} days | Description: {s.get('description', '')}"
        for s in services
    ])

    profile_text = (
        f"Profile completed: {profile_info.get('profile_completion_percentage', 0)}%. "
        f"Aadhaar linked: {'Yes' if profile_info.get('aadhaar_number') else 'No'}. "
        f"District: {profile_info.get('district', 'Not specified')}."
    ) if profile_info else "Resident profile has not been filled yet."

    return f"""You are MahaSetu Mitra, the intelligent multilingual AI assistant powered by Google Gemini for Maharashtra State's MahaSetu Citizen Services Interoperability Platform (Problem Statement 26129).

Platform Mission & Architecture:
- MahaSetu connects Maharashtra state departments with zero citizen friction and 100% DPDP Act 2023 compliance.
- 8-Step Canonical Workflow:
  1. Citizen Applies (via Web Portal / Mobile)
  2. Consent Gateway (Digital Consent & Purpose-bound Authorization)
  3. Identity Verification (UIDAI / Dept A Master Identity Registry)
  4. Eligibility Evaluation (Dept B Automated Rules Engine)
  5. Benefit Sanction (Dept C Administrative Authority)
  6. Admin Sign-off (State Directorate Final Verification)
  7. Cryptographic Notarisation (SHA-256 Merkle RFC 6962 Audit Ledger)
  8. Direct Benefit Transfer (DBT Disbursal directly to verified Aadhaar-seeded bank account)

Citizen Live Database Context:
- Citizen Name: {user_name}
- Resident Profile: {profile_text}

Citizen Active Applications:
{apps_text}

Available Government Schemes Directory:
{services_text}

Guidelines for MahaSetu Mitra:
1. Multilingual Fluency:
   - Automatically detect the user's language.
   - If queried in Marathi (मराठी), answer fluently and respectfully in Marathi.
   - If queried in Hindi (हिंदी), answer fluently and respectfully in Hindi.
   - If queried in English, respond in clean, empathetic English.
2. Grounding & Factual Integrity:
   - Always reference the citizen's actual application numbers ({', '.join(a['application_number'] for a in applications) if applications else 'none'}) and exact recorded status.
   - NEVER invent or guess application numbers or fake approvals.
3. Actionable Remediation:
   - If an application is in 'REWORK' status, clearly explain the exact rework reason and guide the user: "Go to the Tracking page, address the note, and click Resubmit Application."
   - If an application is 'APPROVED' or 'COMPLETED', explain the next milestone or DBT disbarment.
4. Presentation:
   - Use clean Markdown with bullet points, bold key terms, and concise paragraphs.
"""

def generate_assistant_response(
    user_message: str,
    conversation_history: List[Dict[str, str]],
    system_context: str,
    applications: List[Dict[str, Any]],
    services: List[Dict[str, Any]]
) -> str:
    """Generates an intelligent assistant response using Google Gemini (google-genai SDK), with automatic fallback."""
    demo_mode = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

    # Enforce API key requirement in live non-demo mode for compliance
    if not gemini_api_key:
        if not demo_mode:
            raise RuntimeError(
                "Gemini API key missing in live mode. "
                "Please configure GEMINI_API_KEY in backend/.env."
            )
        return _mock_grounded_response(user_message, applications, services)

    # Live Gemini Call via unified google-genai SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=gemini_api_key)

        # Build multi-turn chat contents adhering strictly to google-genai types
        # Basic prompt-injection hygiene: citizen's raw message is isolated in its own user Content object
        chat_contents = []
        for msg in conversation_history[-8:]:
            role = "user" if msg["sender"] == "user" else "model"
            chat_contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        chat_contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)]
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=system_context,
            temperature=0.3,
            max_output_tokens=1024,
        )

        response = client.models.generate_content(
            model=model_name,
            contents=chat_contents,
            config=config
        )

        if response and response.text:
            return response.text.strip()

        return "I am processing your inquiry with MahaSetu records. Please verify your application status on the Tracking page."

    except Exception as exc:
        logger.error("Google Gemini invocation failed: %s", exc)
        if demo_mode:
            return _mock_grounded_response(user_message, applications, services)
        return "MahaSetu Mitra AI assistant is temporarily unavailable. Please try again in a few moments or verify your application on the Tracking page."

def _mock_grounded_response(
    query: str,
    applications: List[Dict[str, Any]],
    services: List[Dict[str, Any]]
) -> str:
    q = query.lower()

    # Marathi queries (मराठी)
    if any(w in query for w in ["अर्जाची", "स्थिती", "योजना", "कागदपत्रे", "नमस्कार", "अर्ज"]):
        if any(w in query for w in ["स्थिती", "अर्ज"]):
            if not applications:
                return "तुमचा कोणताही सक्रिय अर्ज सध्या सादर केलेला नाही. तुम्ही **योजना (Services)** विभागात जाऊन नवीन अर्ज करू शकता."
            lines = ["तुमच्या अर्जांची सद्यस्थिती खालीलप्रमाणे आहे:"]
            for a in applications:
                lines.append(f"• **{a['application_number']}**: सद्यस्थिती **{a['status']}** ({a['current_department']}).")
                if a.get("rejection_reason"):
                    lines.append(f"  ⚠️ दुरुस्ती सूचना: {a['rejection_reason']}. कृपया ट्रॅकिंग पानावर जाऊन माहिती दुरुस्त करा.")
            return "\n".join(lines)
        return "नमस्कार! मी **महासेतू मित्र** (Google Gemini द्वारे समर्थित) आहे. मी तुम्हाला महाराष्ट्र शासनाच्या विविध योजना, अर्जांची स्थिती आणि थेट लाभ हस्तांतरण (DBT) विषयी मदत करू शकतो."

    # Hindi queries (हिंदी)
    if any(w in query for w in ["स्थिति", "आवेदन", "योजना", "दस्तावेज", "नमस्ते"]):
        if any(w in query for w in ["स्थिति", "आवेदन"]):
            if not applications:
                return "वर्तमान में आपका कोई सक्रिय आवेदन नहीं है। आप **सेवाएं (Services)** अनुभाग में जाकर योजनाओं के लिए आवेदन कर सकते हैं।"
            lines = ["आपके आवेदन की वर्तमान स्थिति:"]
            for a in applications:
                lines.append(f"• **{a['application_number']}**: स्थिति **{a['status']}** ({a['current_department']}).")
                if a.get("rejection_reason"):
                    lines.append(f"  ⚠️ सुधार अनुरोध: {a['rejection_reason']}. कृपया ट्रैकिंग पेज पर जाकर विवरण अपडेट करें।")
            return "\n".join(lines)
        return "नमस्ते! मैं **महासेतु मित्र** (Google Gemini द्वारा समर्थित) हूँ। मैं महाराष्ट्र सरकार की योजनाओं, आवेदन ट्रैकिंग और डीबीटी से संबंधित जानकारी में आपकी सहायता कर सकता हूँ।"

    # 1. Status query
    if any(w in q for w in ["status", "track", "application", "where is", "progress"]):
        if not applications:
            return (
                "You do not currently have any active applications submitted. "
                "You can browse available services under the **Services** section and apply with one-click digital consent!"
            )
        lines = ["Here is the current status of your application(s):"]
        for a in applications:
            line = f"• **{a['application_number']}** ({a.get('service_name', a.get('service_id'))}): Status is **{a['status'].replace('_', ' ')}** at **{a['current_department']}**."
            if a.get("rejection_reason"):
                line += f"\n  ⚠️ **Rework Note:** {a['rejection_reason']}. Please go to Tracking to update and resubmit."
            lines.append(line)
        lines.append("\nYou can view full step-by-step progress on your **Tracking** page.")
        return "\n".join(lines)

    # 2. Scheme query / What schemes
    if any(w in q for w in ["scheme", "pension", "farmer", "employment", "service", "available", "eligible"]):
        s_names = [f"• **{s['name']}** — SLA: {s.get('sla_days', 7)} days ({s.get('department', 'Dept')})" for s in services[:5]]
        return (
            "MahaSetu connects you directly with Maharashtra state schemes without paper visits:\n\n"
            + "\n".join(s_names)
            + "\n\nTo apply, ensure your **Resident Profile** is filled, then click **Apply** on the scheme card to grant digital consent."
        )

    # 3. Documents / Aadhaar / Requirements
    if any(w in q for w in ["document", "aadhaar", "proof", "passport", "upload", "required"]):
        return (
            "For most MahaSetu services, you do not need physical paper attestations! "
            "Once you enter your details in **Resident Profile**, MahaSetu securely federates your identity through UIDAI (Dept A) and Social Welfare (Dept B). "
            "For specialized services like International Mobility, you can upload your Passport bio-page (PDF up to 10 MB) in the Resident Profile section."
        )

    # 4. Rework / Resubmit
    if any(w in q for w in ["rework", "reject", "resubmit", "fix"]):
        rework_apps = [a for a in applications if a.get("status") == "REWORK"]
        if rework_apps:
            a = rework_apps[0]
            return (
                f"Your application **{a['application_number']}** has been marked for rework with the note: *\"{a.get('rejection_reason', 'Please verify details')}\"*.\n\n"
                "To fix this:\n"
                "1. Go to the **Tracking** page.\n"
                "2. Click **Address & Resubmit Application** on the yellow rework banner.\n"
                "3. Provide your clarification note and submit to return your file to the active verification queue."
            )
        return (
            "If an officer or administrator requests rework on your application, a yellow alert will appear on your Tracking page with the required correction. "
            "You can update your details and resubmit without starting over."
        )

    # Default friendly greeting / guidance
    return (
        "Namaste! I am **MahaSetu Mitra**, your AI assistant for Maharashtra Government services.\n\n"
        "I can help you:\n"
        "• **Track your applications** in real-time across departments\n"
        "• **Explore schemes & entitlements** (Pension, Employment, Farmers Aid)\n"
        "• **Guide you through document uploads** and consent authorization\n"
        "• **Assist with rework requests** and grievance resolution\n\n"
        "How may I assist you today?"
    )
