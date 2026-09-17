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
from backend.app.models.notification import Notification
from backend.app.auth import create_access_token
from backend.app.events.publisher import publish_event
import backend.app.events.handlers as handlers_mod

@pytest.fixture
def notif_env():
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

    # Seed 2 citizens
    c1 = User(
        id="C-NOTIF-1",
        name="Citizen One",
        email="citizen1@mahasetu.gov.in",
        mobile="9823000011",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    c2 = User(
        id="C-NOTIF-2",
        name="Citizen Two",
        email="citizen2@mahasetu.gov.in",
        mobile="9823000012",
        role="CITIZEN",
        hashed_password="mock",
        registration_status="APPROVED"
    )
    app1 = Application(
        id="APP-NOTIF-1",
        application_number="MH-NOTIF-101",
        citizen_id="C-NOTIF-1",
        service_id="caste-certificate",
        status="APPLICATION_CREATED",
        current_department="PORTAL"
    )

    session.add_all([c1, c2, app1])
    session.commit()

    # Also temporarily override SessionLocal in handlers so event handler uses this test DB
    orig_session_local = handlers_mod.SessionLocal
    handlers_mod.SessionLocal = TestingSession
    if handlers_mod.notification_and_sms_handler not in handlers_mod.subscribe_event.__globals__["_SUBSCRIBERS"]:
        handlers_mod.register_default_handlers()

    client = TestClient(app)

    yield {
        "session": session,
        "TestingSession": TestingSession,
        "client": client,
        "token1": create_access_token({"sub": c1.id, "role": c1.role}),
        "token2": create_access_token({"sub": c2.id, "role": c2.role}),
        "db_path": temp_db.name,
        "c1": c1,
        "c2": c2,
        "app1": app1
    }

    handlers_mod.SessionLocal = orig_session_local
    app.dependency_overrides.clear()
    session.close()
    if os.path.exists(temp_db.name):
        try:
            os.remove(temp_db.name)
        except Exception:
            pass

def test_notification_endpoints(notif_env):
    client = notif_env["client"]
    t1 = notif_env["token1"]
    t2 = notif_env["token2"]
    session = notif_env["session"]

    # Create 2 notifications for c1, 1 for c2
    n1 = Notification(
        id="N-1",
        user_id="C-NOTIF-1",
        title="App Registered",
        message="App MH-NOTIF-101 registered",
        notification_type="APPLICATION_CREATED",
        reference_id="MH-NOTIF-101",
        is_read=False
    )
    n2 = Notification(
        id="N-2",
        user_id="C-NOTIF-1",
        title="Admin Approved",
        message="App MH-NOTIF-101 admin approved",
        notification_type="ADMIN_APPROVED",
        reference_id="MH-NOTIF-101",
        is_read=False
    )
    n3 = Notification(
        id="N-3",
        user_id="C-NOTIF-2",
        title="Welcome",
        message="Welcome Citizen Two",
        notification_type="WELCOME",
        is_read=False
    )
    session.add_all([n1, n2, n3])
    session.commit()

    # User 1 fetches notifications
    r1 = client.get("/api/notifications", headers={"Authorization": f"Bearer {t1}"})
    assert r1.status_code == 200
    data1 = r1.json()
    assert len(data1) == 2
    assert all(notif["user_id"] == "C-NOTIF-1" for notif in data1)

    # User 2 fetches notifications (isolation check)
    r2 = client.get("/api/notifications", headers={"Authorization": f"Bearer {t2}"})
    assert r2.status_code == 200
    data2 = r2.json()
    assert len(data2) == 1
    assert data2[0]["id"] == "N-3"

    # User 2 tries to mark User 1's notification as read -> 404
    r_unauth = client.post("/api/notifications/N-1/read", headers={"Authorization": f"Bearer {t2}"})
    assert r_unauth.status_code == 404

    # User 1 marks N-1 as read
    r_read = client.post("/api/notifications/N-1/read", headers={"Authorization": f"Bearer {t1}"})
    assert r_read.status_code == 200
    assert r_read.json()["is_read"] is True

    # User 1 marks all as read
    r_all = client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {t1}"})
    assert r_all.status_code == 200

    # Verify both are now read
    r1_updated = client.get("/api/notifications", headers={"Authorization": f"Bearer {t1}"})
    for n in r1_updated.json():
        assert n["is_read"] is True

def test_event_handler_notification_and_sms(notif_env):
    client = notif_env["client"]
    t1 = notif_env["token1"]

    # Publish an event on MH-NOTIF-101
    publish_event("IDENTITY_VERIFIED", "MH-NOTIF-101", "DEPT_A")

    # Check that Citizen One received a notification
    r = client.get("/api/notifications", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    items = r.json()
    assert any(n["notification_type"] == "IDENTITY_VERIFIED" for n in items)
