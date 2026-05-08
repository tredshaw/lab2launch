"""ORM models for Lab2Launch."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, JSON, String, Text
from database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id                     = Column(Integer, primary_key=True, autoincrement=True)
    created_at             = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at           = Column(DateTime, nullable=True)
    project_name           = Column(String(256), nullable=False)
    status                 = Column(String(32), nullable=False, default="pending")

    # Initial form inputs
    research_area          = Column(Text, nullable=True)
    stage_value            = Column(Integer, nullable=True)
    stage_label            = Column(String(128), nullable=True)
    goal_type              = Column(String(128), nullable=True)
    goal_quantification    = Column(Text, nullable=True)
    goal_rationale         = Column(Text, nullable=True)
    team_size              = Column(Integer, nullable=True)
    q1_answer              = Column(Text, nullable=True)
    q2_answer              = Column(Text, nullable=True)
    q3_answer              = Column(Text, nullable=True)
    q4_answer              = Column(Text, nullable=True)
    q5_answer              = Column(Text, nullable=True)

    # First-pass outputs
    follow_up_questions    = Column(JSON, nullable=True)  # list[{question, why_asked}]
    preliminary_assessment = Column(Text, nullable=True)

    # Follow-up answers (populated on final analysis)
    follow_up_answers      = Column(JSON, nullable=True)  # list[{question, answer}]

    # Final Claude output
    analysis_result        = Column(JSON, nullable=True)
