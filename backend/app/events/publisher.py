import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Callable, Optional

# In-memory event subscribers
_SUBSCRIBERS: List[Callable[[Dict[str, Any]], Any]] = []
_EVENT_HISTORY: List[Dict[str, Any]] = []

def subscribe_event(handler: Callable[[Dict[str, Any]], Any]):
    """Registers an asynchronous or synchronous event handler."""
    _SUBSCRIBERS.append(handler)

def publish_event(
    event_type: str,
    application_id: str,
    department_id: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Publishes an event to all registered listeners and logs in-memory event stream.
    """
    event_payload = {
        "eventType": event_type,
        "applicationId": application_id,
        "departmentId": department_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {}
    }

    _EVENT_HISTORY.append(event_payload)
    # Keep last 200 events in memory
    if len(_EVENT_HISTORY) > 200:
        _EVENT_HISTORY.pop(0)

    # Dispatch to handlers
    for handler in _SUBSCRIBERS:
        try:
            handler(event_payload)
        except Exception as err:
            print(f"[EventBus Error in handler {handler}]: {err}")

    return event_payload

def get_recent_events(limit: int = 50) -> List[Dict[str, Any]]:
    return list(reversed(_EVENT_HISTORY[-limit:]))
