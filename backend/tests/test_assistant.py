import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.resident_profile import ResidentProfile
from backend.app.models.assistant import AssistantConversation, AssistantMessage
from backend.app.auth import create_access_token
from backend.app.services.assistant import generate_assistant_response

@pytest.fixture
def asst_env():
    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_db.close()

    engine = create_engine(f"sqlite:///{temp_db.name}", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    session = TestingSession()

    u1 = User(
        id="U-ASST-1",
        name="Ramesh Shinde",
        email="ramesh@mahasetu.gov.in",
        mobile="9823111111",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    u2 = User(
        id="U-ASST-2",
        name="Sunita Patil",
        email="sunita@mahasetu.gov.in",
        mobile="9823222222",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )

    # Seed an application for u1
    app1 = Application(
        id="APP-ASST-1",
        application_number="MH-ASST-2026-001",
        citizen_id="U-ASST-1",
        service_id="employment-support",
        status="REWORK",
        current_department="ADMIN",
        rejection_reason="Income certificate scan is unreadable"
    )

    prof1 = ResidentProfile(
        id="PROF-ASST-1",
        user_id="U-ASST-1",
        legal_name="Ramesh Shinde",
        district="Pune",
        aadhaar_last_four="9012"
    )

    session.add_all([u1, u2, app1, prof1])
    session.commit()

    client = TestClient(app)

    yield {
        "session": session,
        "client": client,
        "token1": create_access_token({"sub": u1.id, "role": u1.role}),
        "token2": create_access_token({"sub": u2.id, "role": u2.role}),
        "db_path": temp_db.name,
        "u1": u1,
        "u2": u2,
        "app1": app1
    }

    app.dependency_overrides.clear()
    session.close()
    if os.path.exists(temp_db.name):
        try:
            os.remove(temp_db.name)
        except Exception:
            pass

def test_assistant_chat_flow_and_grounding(asst_env):
    client = asst_env["client"]
    t1 = asst_env["token1"]

    # 1. Ask about application status
    r1 = client.post(
        "/api/assistant/chat",
        headers={"Authorization": f"Bearer {t1}"},
        json={"message": "What is the status of my application?"}
    )
    assert r1.status_code == 200
    data1 = r1.json()
    conv_id = data1["conversation_id"]
    msg1 = data1["message"]["content"]
    assert conv_id is not None
    assert "MH-ASST-2026-001" in msg1
    assert "Income certificate scan is unreadable" in msg1

    # 2. Ask follow-up question using the same conversation_id
    r2 = client.post(
        "/api/assistant/chat",
        headers={"Authorization": f"Bearer {t1}"},
        json={"message": "How do I fix the rework?", "conversation_id": conv_id}
    )
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["conversation_id"] == conv_id
    msg2 = data2["message"]["content"]
    assert "Tracking" in msg2 or "rework" in msg2.lower()

    # 3. List conversations
    r_list = client.get("/api/assistant/conversations", headers={"Authorization": f"Bearer {t1}"})
    assert r_list.status_code == 200
    convs = r_list.json()
    assert len(convs) == 1
    assert convs[0]["id"] == conv_id
    assert convs[0]["message_count"] == 4 # 2 user + 2 assistant

    # 4. Get conversation detail
    r_detail = client.get(f"/api/assistant/conversations/{conv_id}", headers={"Authorization": f"Bearer {t1}"})
    assert r_detail.status_code == 200
    detail = r_detail.json()
    assert len(detail["messages"]) == 4
    assert detail["messages"][0]["sender"] == "user"
    assert detail["messages"][1]["sender"] == "assistant"

def test_assistant_conversation_isolation(asst_env):
    client = asst_env["client"]
    t1 = asst_env["token1"]
    t2 = asst_env["token2"]

    # User 1 starts a conversation
    r1 = client.post(
        "/api/assistant/chat",
        headers={"Authorization": f"Bearer {t1}"},
        json={"message": "Hello Mitra, what schemes are available?"}
    )
    conv_id = r1.json()["conversation_id"]

    # User 2 tries to access User 1's conversation -> 404
    r_sec = client.get(f"/api/assistant/conversations/{conv_id}", headers={"Authorization": f"Bearer {t2}"})
    assert r_sec.status_code == 404

    # User 2's conversation list is empty
    r2_list = client.get("/api/assistant/conversations", headers={"Authorization": f"Bearer {t2}"})
    assert len(r2_list.json()) == 0

def test_assistant_live_mode_fails_loudly_without_key():
    # When DEMO_MODE=false and GEMINI_API_KEY is empty, it must raise RuntimeError
    os.environ["DEMO_MODE"] = "false"
    os.environ["GEMINI_API_KEY"] = ""

    with pytest.raises(RuntimeError) as exc_info:
        generate_assistant_response(
            user_message="Hello",
            conversation_history=[],
            system_context="Context",
            applications=[],
            services=[]
        )
    assert "Gemini API key missing in live mode" in str(exc_info.value)

    # Restore DEMO_MODE
    os.environ["DEMO_MODE"] = "true"
