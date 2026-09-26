import uuid
from datetime import datetime, timezone

from backend.app.auth import get_current_user, get_current_user_optional
from backend.app.database import get_db
from backend.app.models.application import Application
from backend.app.models.assistant import AssistantConversation, AssistantMessage
from backend.app.models.resident_profile import ResidentProfile
from backend.app.models.user import User
from backend.app.schemas.assistant import (
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    ConversationDetail,
    ConversationSummary,
)
from backend.app.services.assistant import (
    build_system_context,
    generate_assistant_response,
    get_gemini_metadata,
)
from backend.app.services.rate_limiter import assistant_rate_limiter
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])


@router.get("/status")
def get_assistant_model_status():
    """Returns the operational status of Google Gemini AI and grounding engine."""
    return get_gemini_metadata()


# Reference default services list
DEFAULT_SERVICES = [
    {
        "id": "employment-support",
        "name": "Mahaswayam Employment Support Scheme",
        "department": "Skill Development & Employment",
        "sla_days": 7,
        "description": "Cross-departmental verification of age, residence, caste, and income.",
    },
    {
        "id": "senior-citizen-pension",
        "name": "Sanjay Gandhi Niradhar Pension Scheme",
        "department": "Social Justice & Special Assistance",
        "sla_days": 10,
        "description": "Monthly pension for destitute senior citizens and persons with disability.",
    },
    {
        "id": "farmers-crop-subsidy",
        "name": "Namo Shetkari Mahasanman Nidhi",
        "department": "Agriculture Department",
        "sla_days": 5,
        "description": "Direct benefit financial assistance for registered Maharashtra farmers.",
    },
    {
        "id": "ladki-bahin-yojana",
        "name": "Mukhyamantri Majhi Ladki Bahin Yojana",
        "department": "Women & Child Development",
        "sla_days": 7,
        "description": "Direct financial aid to eligible women with verified bank account linking.",
    },
]


@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    req_http: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Interacts with MahaSetu Mitra AI assistant with grounded citizen context and per-user rate limiting."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Per-user rate limiting (keyed by current_user.id or client IP)
    client_ip = req_http.client.host if req_http.client else "127.0.0.1"
    forwarded = req_http.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    rate_key = (
        f"AssistantUser:{current_user.id}"
        if current_user
        else f"AssistantGuest:{client_ip}"
    )
    if not assistant_rate_limiter.check(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: Maximum 15 assistant chat requests allowed per minute.",
            headers={"Retry-After": "60"},
        )

    # Handle unauthenticated visitor / guest query on landing page
    if not current_user:
        reply_text = generate_assistant_response(
            user_message=request.message.strip(),
            conversation_history=[],
            system_context=build_system_context(
                user_name="Guest Citizen",
                applications=[],
                profile_info=None,
                services=DEFAULT_SERVICES,
            ),
            applications=[],
            services=DEFAULT_SERVICES,
        )
        return ChatResponse(
            conversation_id="guest-session",
            message=ChatMessageResponse(
                id=str(uuid.uuid4()),
                sender="assistant",
                content=reply_text,
                timestamp=datetime.now(timezone.utc),
            ),
        )

    # 1. Retrieve or create conversation with strict isolation
    conv = None
    if request.conversation_id:
        conv = (
            db.query(AssistantConversation)
            .filter(
                AssistantConversation.id == request.conversation_id,
                AssistantConversation.user_id == current_user.id,
            )
            .first()
        )
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied.",
            )
    else:
        # Title is the first 40 chars of user query
        title = request.message[:40] + ("..." if len(request.message) > 40 else "")
        conv = AssistantConversation(user_id=current_user.id, title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Persist user message
    user_msg = AssistantMessage(
        conversation_id=conv.id, sender="user", content=request.message.strip()
    )
    db.add(user_msg)
    db.commit()

    # 3. Retrieve recent conversation history
    history_records = (
        db.query(AssistantMessage)
        .filter(AssistantMessage.conversation_id == conv.id)
        .order_by(AssistantMessage.timestamp.asc())
        .limit(10)
        .all()
    )
    history = [{"sender": m.sender, "content": m.content} for m in history_records]

    # 4. Gather grounded context
    apps = db.query(Application).filter(Application.citizen_id == current_user.id).all()
    apps_data = [
        {
            "application_number": a.application_number,
            "service_id": a.service_id,
            "service_name": a.service_id.replace("-", " ").title(),
            "status": a.status,
            "current_department": a.current_department,
            "rejection_reason": a.rejection_reason,
        }
        for a in apps
    ]

    profile = (
        db.query(ResidentProfile)
        .filter(ResidentProfile.user_id == current_user.id)
        .first()
    )
    profile_data = (
        {
            "profile_completion_percentage": 100 if profile else 0,
            "aadhaar_number": (
                f"XXXX-XXXX-{profile.aadhaar_last_four}"
                if profile and profile.aadhaar_last_four
                else None
            ),
            "district": profile.district if profile else None,
        }
        if profile
        else None
    )

    system_context = build_system_context(
        user_name=current_user.name,
        applications=apps_data,
        profile_info=profile_data,
        services=DEFAULT_SERVICES,
    )

    # 5. Generate AI response
    reply_text = generate_assistant_response(
        user_message=request.message.strip(),
        conversation_history=history,
        system_context=system_context,
        applications=apps_data,
        services=DEFAULT_SERVICES,
    )

    # 6. Persist assistant reply
    asst_msg = AssistantMessage(
        conversation_id=conv.id, sender="assistant", content=reply_text
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return ChatResponse(
        conversation_id=conv.id, message=ChatMessageResponse.model_validate(asst_msg)
    )


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Lists conversations for the authenticated user."""
    convs = (
        db.query(AssistantConversation)
        .filter(AssistantConversation.user_id == current_user.id)
        .order_by(AssistantConversation.updated_at.desc())
        .all()
    )
    conv_ids = [c.id for c in convs]
    message_counts = {}
    if conv_ids:
        counts = (
            db.query(AssistantMessage.conversation_id, func.count(AssistantMessage.id))
            .filter(AssistantMessage.conversation_id.in_(conv_ids))
            .group_by(AssistantMessage.conversation_id)
            .all()
        )
        message_counts = dict(counts)

    return [
        ConversationSummary(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=message_counts.get(c.id, 0),
        )
        for c in convs
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation_detail(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves full message history for a specific conversation."""
    conv = (
        db.query(AssistantConversation)
        .filter(
            AssistantConversation.id == conversation_id,
            AssistantConversation.user_id == current_user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(AssistantMessage)
        .filter(AssistantMessage.conversation_id == conv.id)
        .order_by(AssistantMessage.timestamp.asc())
        .all()
    )

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[ChatMessageResponse.model_validate(m) for m in messages],
    )
