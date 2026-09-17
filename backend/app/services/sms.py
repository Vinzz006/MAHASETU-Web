import os
import logging
from typing import Optional

logger = logging.getLogger("mahasetu.sms")

def send_sms(to_phone: str, message_body: str) -> bool:
    """
    Dispatches SMS alerts to citizens via Twilio.
    Supports DEMO_MODE fallback for local evaluation and automated testing.
    Fails loudly if DEMO_MODE=false and Twilio credentials are missing.
    """
    demo_mode = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

    has_credentials = bool(account_sid and auth_token and from_number)

    if not has_credentials:
        if not demo_mode:
            raise RuntimeError(
                "Twilio SMS credentials missing in live mode. "
                "Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in backend/.env."
            )
        # Clean demo simulation
        print(f"[DEMO SMS] To: {to_phone} | Msg: {message_body}")
        return True

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        # Format Indian phone number if missing country code
        formatted_phone = to_phone
        if not formatted_phone.startswith("+"):
            formatted_phone = f"+91{formatted_phone}"

        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=formatted_phone
        )
        logger.info(f"SMS dispatched via Twilio to {formatted_phone}: SID {message.sid}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send SMS via Twilio to {to_phone}: {exc}")
        if demo_mode:
            print(f"[DEMO SMS FALLBACK] To: {to_phone} | Msg: {message_body}")
            return True
        raise exc
