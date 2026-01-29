"""add missing indexes and constraints

Revision ID: 002_add_missing_indexes_constraints
Revises: 001_initial_schema
Create Date: 2024-01-01 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_missing_indexes_constraints'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands for missing indexes and constraints ###
    
    # Indexes for Users table
    op.create_index('ix_users_user_type', 'users', ['user_type'], unique=False)
    op.create_index('ix_users_created_at', 'users', ['created_at'], unique=False)
    
    # Indexes for Employers table
    op.create_index('ix_employers_user_id', 'employers', ['user_id'], unique=True)  # Already unique, but index helps
    op.create_index('ix_employers_created_at', 'employers', ['created_at'], unique=False)
    
    # Indexes for JobSeekerProfiles table
    op.create_index('ix_job_seeker_profiles_user_id', 'job_seeker_profiles', ['user_id'], unique=False)
    op.create_index('ix_job_seeker_profiles_profile_version', 'job_seeker_profiles', ['profile_version'], unique=False)
    op.create_index('ix_job_seeker_profiles_created_at', 'job_seeker_profiles', ['created_at'], unique=False)
    
    # Additional indexes for Jobs table
    op.create_index('ix_jobs_employer_id', 'jobs', ['employer_id'], unique=False)
    op.create_index('ix_jobs_created_at', 'jobs', ['created_at'], unique=False)
    op.create_index('ix_jobs_employment_type', 'jobs', ['employment_type'], unique=False)
    
    with op.batch_alter_table('jobs') as batch_op:
        batch_op.create_check_constraint(
            'ck_jobs_salary_range',
            sa.text('salary_max >= salary_min OR salary_max IS NULL OR salary_min IS NULL')
        )
    
    # Additional indexes for Applications table
    op.create_index('ix_applications_job_id', 'applications', ['job_id'], unique=False)
    op.create_index('ix_applications_profile_id', 'applications', ['profile_id'], unique=False)
    op.create_index('ix_applications_created_at', 'applications', ['created_at'], unique=False)
    op.create_index('ix_applications_last_state_change', 'applications', ['last_state_change'], unique=False)
    
    # Additional indexes for InterviewSessions table
    op.create_index('ix_interview_sessions_scheduled_at', 'interview_sessions', ['scheduled_at'], unique=False)
    op.create_index('ix_interview_sessions_created_at', 'interview_sessions', ['created_at'], unique=False)
    
    # Additional indexes for MatchRuns table
    op.create_index('ix_match_runs_created_at', 'match_runs', ['created_at'], unique=False)
    op.create_index('ix_match_runs_started_at', 'match_runs', ['started_at'], unique=False)
    op.create_index('ix_match_runs_completed_at', 'match_runs', ['completed_at'], unique=False)
    
    # Composite index for concurrency guard queries
    op.create_index(
        'ix_match_runs_profile_status',
        'match_runs',
        ['profile_id', 'profile_version', 'status'],
        unique=False
    )
    
    # Additional indexes for MatchLogs table
    op.create_index('ix_match_logs_match_score', 'match_logs', ['match_score'], unique=False)
    op.create_index('ix_match_logs_considered_at', 'match_logs', ['considered_at'], unique=False)
    
    with op.batch_alter_table('match_logs') as batch_op:
        batch_op.create_check_constraint(
            'ck_match_logs_score_range',
            sa.text('match_score >= 0.0 AND match_score <= 1.0')
        )
    
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands to remove added indexes and constraints ###
    op.drop_index('ix_match_logs_considered_at', table_name='match_logs')
    op.drop_index('ix_match_logs_match_score', table_name='match_logs')
    op.drop_constraint('ck_match_logs_score_range', 'match_logs', type_='check')
    
    op.drop_index('ix_match_runs_profile_status', table_name='match_runs')
    op.drop_index('ix_match_runs_completed_at', table_name='match_runs')
    op.drop_index('ix_match_runs_started_at', table_name='match_runs')
    op.drop_index('ix_match_runs_created_at', table_name='match_runs')
    
    op.drop_index('ix_interview_sessions_created_at', table_name='interview_sessions')
    op.drop_index('ix_interview_sessions_scheduled_at', table_name='interview_sessions')
    
    op.drop_index('ix_applications_last_state_change', table_name='applications')
    op.drop_index('ix_applications_created_at', table_name='applications')
    op.drop_index('ix_applications_profile_id', table_name='applications')
    op.drop_index('ix_applications_job_id', table_name='applications')
    
    op.drop_constraint('ck_jobs_salary_range', 'jobs', type_='check')
    
    op.drop_index('ix_jobs_employment_type', table_name='jobs')
    op.drop_index('ix_jobs_created_at', table_name='jobs')
    op.drop_index('ix_jobs_employer_id', table_name='jobs')
    
    op.drop_index('ix_job_seeker_profiles_created_at', table_name='job_seeker_profiles')
    op.drop_index('ix_job_seeker_profiles_profile_version', table_name='job_seeker_profiles')
    op.drop_index('ix_job_seeker_profiles_user_id', table_name='job_seeker_profiles')
    
    op.drop_index('ix_employers_created_at', table_name='employers')
    op.drop_index('ix_employers_user_id', table_name='employers')
    
    op.drop_index('ix_users_created_at', table_name='users')
    op.drop_index('ix_users_user_type', table_name='users')
    # ### end Alembic commands ###
