import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure workspace root and backend are on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.config import get_settings
from backend.app.database import Base

# Import all models to register them on Base.metadata
from backend.app.models.user import User
from backend.app.models.application import Application
from backend.app.models.consent import Consent, DataSharingLog
from backend.app.models.workflow import WorkflowStep, WorkflowDefinition
from backend.app.models.transaction import DepartmentTransaction
from backend.app.models.audit import AuditLog
from backend.app.models.grievance import Grievance
from backend.app.models.escalation import SLAEscalation
from backend.app.models.notification import Notification
from backend.app.models.resident_profile import ResidentProfile
from backend.app.models.service import Service
from backend.app.models.assistant import AssistantConversation, AssistantMessage
from backend.app.models.interoperability import DepartmentRegistryEntry, ConnectorRegistryEntry
from backend.app.models.mdm import CitizenMasterRecord, IdentifierRegistry, MDMMatchReview


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    return get_settings().DATABASE_URL

def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
