import logging
import time

from backend.app.config import get_settings
from fastapi import BackgroundTasks

logger = logging.getLogger("mahasetu.sms")


def send_sms_sync(to_phone: str, message_body: str, max_retries: int = 3) -> bool:
    """
    Dispatches SMS alerts to citizens via Twilio with retry and backoff.
    Supports DEMO_MODE fallback for local evaluation and automated testing.
    """
    settings = get_settings()
    demo_mode = settings.DEMO_MODE
    account_sid = (settings.TWILIO_ACCOUNT_SID or "").strip()
    auth_token = (settings.TWILIO_AUTH_TOKEN or "").strip()
    from_number = (settings.TWILIO_PHONE_NUMBER or "").strip()

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

    for attempt in range(1, max_retries + 1):
        try:
            from twilio.rest import Client

            client = Client(account_sid, auth_token)
            formatted_phone = to_phone
            if not formatted_phone.startswith("+"):
                formatted_phone = f"+91{formatted_phone}"

            message = client.messages.create(
                body=message_body, from_=from_number, to=formatted_phone
            )
            logger.info(
                f"SMS dispatched via Twilio to {formatted_phone}: SID {message.sid}"
            )
            return True
        except Exception as exc:
            logger.warning(
                f"Twilio SMS attempt {attempt}/{max_retries} failed for {to_phone}: {exc}"
            )
            if attempt == max_retries:
                if demo_mode:
                    print(f"[DEMO SMS FALLBACK] To: {to_phone} | Msg: {message_body}")
                    return True
                logger.error(f"Exhausted retries sending SMS to {to_phone}")
                raise
            time.sleep(
                0.5 * (2 ** (attempt - 1))
            )  # Exponential backoff: 0.5s, 1s, etc.
    return False


def send_sms(to_phone: str, message_body: str) -> bool:
    """Backward-compatible synchronous send wrapper."""
    return send_sms_sync(to_phone, message_body)


def dispatch_background_sms(
    background_tasks: BackgroundTasks | None, to_phone: str, message_body: str
):
    """Enqueues SMS dispatch into FastAPI BackgroundTasks to keep request path sub-50ms."""
    if background_tasks:
        background_tasks.add_task(send_sms_sync, to_phone, message_body)
    else:
        send_sms_sync(to_phone, message_body)
