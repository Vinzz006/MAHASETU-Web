import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("mahasetu.assistant")

def build_system_context(
    user_name: str,
    applications: List[Dict[str, Any]],
    profile_info: Optional[Dict[str, Any]],
    services: List[Dict[str, Any]]
) -> str:
    apps_text = "\n".join([
        f"- Application Number: {a['application_number']} | Service: {a.get('service_name', a.get('service_id'))} | Status: {a['status']} | Current Dept: {a['current_department']}"
        + (f" | Rework/Rejection: {a['rejection_reason']}" if a.get('rejection_reason') else "")
        for a in applications
    ]) if applications else "No active applications submitted yet."

    services_text = "\n".join([
        f"- {s['id']}: {s['name']} (Dept: {s.get('department', 'General')}, SLA: {s.get('sla_days', 7)} days) - {s.get('description', '')}"
        for s in services
    ])

    profile_text = (
        f"Profile completed: {profile_info.get('profile_completion_percentage', 0)}%. "
        f"Aadhaar linked: {'Yes' if profile_info.get('aadhaar_number') else 'No'}. "
        f"District: {profile_info.get('district', 'Not specified')}."
    ) if profile_info else "Resident profile has not been filled yet."

    return f"""You are MahaSetu Mitra, the intelligent digital assistant for Maharashtra State's MahaSetu Interoperability Platform.
Your core mission is to assist citizens with government services, application tracking, eligibility checks, and scheme applications.

Citizen Context:
- Name: {user_name}
- Profile Details: {profile_text}

Citizen Active Applications:
{apps_text}

Government Services Directory:
{services_text}

Guidelines:
1. Be polite, clear, empathetic, and concise. You support both English and Marathi (if prompted in Marathi).
2. Answer specifically with the citizen's actual application numbers and statuses when asked.
3. If an application requires rework, explain the exact reason recorded and how they can update and resubmit.
4. Keep answers focused on Maharashtra government services and the MahaSetu platform.
"""

def generate_assistant_response(
    user_message: str,
    conversation_history: List[Dict[str, str]],
    system_context: str,
    applications: List[Dict[str, Any]],
    services: List[Dict[str, Any]]
) -> str:
    demo_mode = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not gemini_api_key:
        if not demo_mode:
            raise RuntimeError(
                "Gemini API key missing in live mode. "
                "Please configure GEMINI_API_KEY in backend/.env."
            )
        return _mock_grounded_response(user_message, applications, services)

    # Live Gemini Call
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        
        # Build chat contents
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_context)
        
        chat_contents = []
        for msg in conversation_history[-6:]:
            role = "user" if msg["sender"] == "user" else "model"
            chat_contents.append({"role": role, "parts": [msg["content"]]})
        
        chat_contents.append({"role": "user", "parts": [user_message]})
        
        response = model.generate_content(chat_contents)
        if response and response.text:
            return response.text.strip()
        return "I am processing your request. Please check your application status or ask about our services."
    except Exception as exc:
        logger.error(f"Gemini API invocation failed: {exc}")
        if demo_mode:
            return _mock_grounded_response(user_message, applications, services)
        raise exc

def _mock_grounded_response(
    query: str,
    applications: List[Dict[str, Any]],
    services: List[Dict[str, Any]]
) -> str:
    q = query.lower()

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
