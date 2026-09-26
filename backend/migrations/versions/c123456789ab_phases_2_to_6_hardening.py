"""phases_2_to_6_hardening

Revision ID: c123456789ab
Revises: 8cd3afe2734e
Create Date: 2026-09-26 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c123456789ab'
down_revision: Union[str, None] = '8cd3afe2734e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. department_registry
    op.create_table(
        'department_registry',
        sa.Column('department_id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('api_base_url', sa.String(length=255), nullable=False),
        sa.Column('protocol', sa.String(length=50), nullable=False),
        sa.Column('auth_method', sa.String(length=50), nullable=False),
        sa.Column('schema_version', sa.String(length=32), nullable=False),
        sa.Column('service_list', sa.JSON(), nullable=False),
        sa.Column('owner_contact', sa.JSON(), nullable=True),
        sa.Column('health_status', sa.String(length=50), nullable=False),
        sa.Column('last_sync_time', sa.DateTime(), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('department_id')
    )
    with op.batch_alter_table('department_registry', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_department_registry_code'), ['code'], unique=True)

    # 2. connector_registry
    op.create_table(
        'connector_registry',
        sa.Column('connector_id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('department_id', sa.String(length=50), nullable=False),
        sa.Column('connector_type', sa.String(length=50), nullable=False),
        sa.Column('connection_config', sa.JSON(), nullable=False),
        sa.Column('auth_config', sa.JSON(), nullable=False),
        sa.Column('request_mapping', sa.JSON(), nullable=False),
        sa.Column('response_mapping', sa.JSON(), nullable=False),
        sa.Column('schema_mapping', sa.JSON(), nullable=False),
        sa.Column('timeout_seconds', sa.Integer(), nullable=False),
        sa.Column('max_retries', sa.Integer(), nullable=False),
        sa.Column('retry_backoff_factor', sa.Float(), nullable=False),
        sa.Column('health_check_endpoint', sa.String(length=255), nullable=True),
        sa.Column('version', sa.String(length=32), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_sandbox', sa.Boolean(), nullable=False),
        sa.Column('last_health_status', sa.String(length=50), nullable=False),
        sa.Column('last_health_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['department_registry.department_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('connector_id')
    )
    with op.batch_alter_table('connector_registry', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_connector_registry_department_id'), ['department_id'], unique=False)

    # 3. citizen_master_records
    op.create_table(
        'citizen_master_records',
        sa.Column('master_id', sa.String(length=36), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('date_of_birth', sa.String(length=32), nullable=True),
        sa.Column('gender', sa.String(length=32), nullable=True),
        sa.Column('primary_mobile', sa.String(length=32), nullable=False),
        sa.Column('primary_email', sa.String(length=255), nullable=True),
        sa.Column('address_line', sa.Text(), nullable=True),
        sa.Column('district', sa.String(length=64), nullable=True),
        sa.Column('taluka', sa.String(length=64), nullable=True),
        sa.Column('state', sa.String(length=64), nullable=False),
        sa.Column('pincode', sa.String(length=16), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('source_of_truth', sa.String(length=64), nullable=False),
        sa.Column('record_version', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('merged_into_id', sa.String(length=36), nullable=True),
        sa.Column('attributes_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('master_id')
    )
    with op.batch_alter_table('citizen_master_records', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_citizen_master_records_district'), ['district'], unique=False)
        batch_op.create_index(batch_op.f('ix_citizen_master_records_full_name'), ['full_name'], unique=False)
        batch_op.create_index(batch_op.f('ix_citizen_master_records_primary_email'), ['primary_email'], unique=False)
        batch_op.create_index(batch_op.f('ix_citizen_master_records_primary_mobile'), ['primary_mobile'], unique=False)

    # 4. identifier_registry
    op.create_table(
        'identifier_registry',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('master_id', sa.String(length=36), nullable=False),
        sa.Column('source_system', sa.String(length=50), nullable=False),
        sa.Column('source_identifier', sa.String(length=100), nullable=False),
        sa.Column('identifier_type', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['master_id'], ['citizen_master_records.master_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('identifier_registry', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_identifier_registry_master_id'), ['master_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_identifier_registry_source_identifier'), ['source_identifier'], unique=False)
        batch_op.create_index(batch_op.f('ix_identifier_registry_source_system'), ['source_system'], unique=False)

    # 5. mdm_match_reviews
    op.create_table(
        'mdm_match_reviews',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('incoming_record', sa.JSON(), nullable=False),
        sa.Column('candidate_master_id', sa.String(length=36), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('matching_criteria', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('reviewed_by', sa.String(length=100), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['candidate_master_id'], ['citizen_master_records.master_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. data_sharing_logs
    op.create_table(
        'data_sharing_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('consent_id', sa.String(length=36), nullable=True),
        sa.Column('application_id', sa.String(length=36), nullable=True),
        sa.Column('citizen_id', sa.String(length=36), nullable=False),
        sa.Column('requesting_dept', sa.String(length=50), nullable=False),
        sa.Column('receiving_dept', sa.String(length=50), nullable=False),
        sa.Column('data_scope_accessed', sa.JSON(), nullable=False),
        sa.Column('purpose', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('correlation_id', sa.String(length=64), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['citizen_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['consent_id'], ['consents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('data_sharing_logs', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_data_sharing_logs_citizen_id'), ['citizen_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_data_sharing_logs_correlation_id'), ['correlation_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_data_sharing_logs_receiving_dept'), ['receiving_dept'], unique=False)
        batch_op.create_index(batch_op.f('ix_data_sharing_logs_requesting_dept'), ['requesting_dept'], unique=False)
        batch_op.create_index(batch_op.f('ix_data_sharing_logs_timestamp'), ['timestamp'], unique=False)

    # 7. workflow_definitions
    op.create_table(
        'workflow_definitions',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('service_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('version', sa.String(length=32), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('definition_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('workflow_definitions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_workflow_definitions_service_id'), ['service_id'], unique=True)

    # 8. alter consents table to add scope, requesting_department, receiving_department, revocation_at, consent_version
    with op.batch_alter_table('consents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('requesting_department', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('receiving_department', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('scope', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('revocation_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('consent_version', sa.String(length=32), nullable=False, server_default='v1.0'))


def downgrade() -> None:
    with op.batch_alter_table('consents', schema=None) as batch_op:
        batch_op.drop_column('consent_version')
        batch_op.drop_column('revocation_at')
        batch_op.drop_column('scope')
        batch_op.drop_column('receiving_department')
        batch_op.drop_column('requesting_department')

    op.drop_table('workflow_definitions')
    op.drop_table('data_sharing_logs')
    op.drop_table('mdm_match_reviews')
    op.drop_table('identifier_registry')
    op.drop_table('citizen_master_records')
    op.drop_table('connector_registry')
    op.drop_table('department_registry')
