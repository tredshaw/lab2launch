import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import database
import models
import pdf_generator
import prompts

# Create tables on startup (idempotent; safe to call every run)
models  # ensure Analysis is registered with Base.metadata
database.Base.metadata.create_all(bind=database.engine)

_VERSION = Path(__file__).parent.joinpath("VERSION").read_text().strip()

app = FastAPI(title="Lab2Launch", version=_VERSION)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory session store — keyed by UUID, expires after 30 minutes
# ---------------------------------------------------------------------------
_sessions: dict = {}
_SESSION_TTL = 30 * 60


def _cleanup_sessions() -> None:
    now = time.time()
    expired = [k for k, v in _sessions.items() if now - v["created_at"] > _SESSION_TTL]
    for k in expired:
        del _sessions[k]


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class FirstPassRequest(BaseModel):
    project_name: str = Field(default="Untitled", max_length=256)
    research_area: str = Field(..., min_length=10)
    stage_value: int = Field(..., ge=1, le=6)
    stage_label: str = Field(..., min_length=2)
    goal_type: str = Field(..., min_length=2)
    goal_quantification: str = Field(..., min_length=5)
    goal_rationale: str = Field(..., min_length=10)
    team_size: int = Field(..., ge=1, le=500)
    q1_answer: str = Field(..., min_length=5)
    q2_answer: str = Field(..., min_length=5)
    q3_answer: str = Field(..., min_length=5)
    q4_answer: str = Field(..., min_length=5)
    q5_answer: str = Field(..., min_length=5)


class FollowUpAnswer(BaseModel):
    question: str
    answer: str


class FinalAnalysisRequest(BaseModel):
    session_id: str
    follow_up_answers: List[FollowUpAnswer]


class PdfRequest(BaseModel):
    analysis: dict
    project_name: str = "Research Project"


class RenameRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/first-pass")
def first_pass(req: FirstPassRequest, db: Session = Depends(database.get_db)):
    _cleanup_sessions()
    user_inputs_block = prompts._build_user_inputs_block(
        research_area=req.research_area,
        stage_value=req.stage_value,
        stage_label=req.stage_label,
        goal_type=req.goal_type,
        goal_quantification=req.goal_quantification,
        goal_rationale=req.goal_rationale,
        team_size=req.team_size,
        q1=req.q1_answer,
        q2=req.q2_answer,
        q3=req.q3_answer,
        q4=req.q4_answer,
        q5=req.q5_answer,
    )
    try:
        result = prompts.run_first_pass(user_inputs_block)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    row = models.Analysis(
        project_name=req.project_name or "Untitled",
        status="pending",
        research_area=req.research_area,
        stage_value=req.stage_value,
        stage_label=req.stage_label,
        goal_type=req.goal_type,
        goal_quantification=req.goal_quantification,
        goal_rationale=req.goal_rationale,
        team_size=req.team_size,
        q1_answer=req.q1_answer,
        q2_answer=req.q2_answer,
        q3_answer=req.q3_answer,
        q4_answer=req.q4_answer,
        q5_answer=req.q5_answer,
        follow_up_questions=result.get("follow_up_questions", []),
        preliminary_assessment=result.get("preliminary_assessment", ""),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "analysis_id": row.id,
        "user_inputs_block": user_inputs_block,
        "preliminary_assessment": result.get("preliminary_assessment", ""),
        "created_at": time.time(),
    }
    return {
        "session_id": session_id,
        "analysis_id": row.id,
        "follow_up_questions": result.get("follow_up_questions", []),
    }


@app.post("/final-analysis")
def final_analysis(req: FinalAnalysisRequest, db: Session = Depends(database.get_db)):
    _cleanup_sessions()
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired. Please start the analysis again."
        )

    follow_up_block = "\n\n".join(
        f"Q: {a.question}\nA: {a.answer}" for a in req.follow_up_answers
    ) or "No follow-up questions were answered."

    try:
        result = prompts.run_final_analysis(
            user_inputs_block=session["user_inputs_block"],
            follow_up_block=follow_up_block,
            preliminary_assessment=session["preliminary_assessment"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    analysis_id = session.get("analysis_id")
    if analysis_id:
        row = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
        if row:
            row.follow_up_answers = [a.model_dump() for a in req.follow_up_answers]
            row.analysis_result = result
            row.status = "complete"
            row.completed_at = datetime.utcnow()
            db.commit()

    del _sessions[req.session_id]
    return {**result, "analysis_id": analysis_id}


@app.post("/download-pdf")
def download_pdf(req: PdfRequest):
    try:
        pdf_bytes = pdf_generator.generate_pdf(req.analysis, req.project_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    safe_name = "".join(c if c.isalnum() or c in "-_ " else "" for c in req.project_name).strip()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name or "report"}.pdf"'},
    )


# ---------------------------------------------------------------------------
# Analysis history endpoints
# ---------------------------------------------------------------------------

@app.get("/analyses")
def list_analyses(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Analysis)
        .filter(models.Analysis.status == "complete")
        .order_by(models.Analysis.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "project_name": r.project_name,
            "created_at": r.created_at.isoformat(),
            "stage_label": (r.analysis_result or {}).get("stage_label", ""),
            "total_score": (r.analysis_result or {}).get("total_score"),
        }
        for r in rows
    ]


@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(database.get_db)):
    row = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    inputs = {
        "project_name":         row.project_name,
        "research_area":        row.research_area,
        "stage_value":          row.stage_value,
        "stage_label":          row.stage_label,
        "goal_type":            row.goal_type,
        "goal_quantification":  row.goal_quantification,
        "goal_rationale":       row.goal_rationale,
        "team_size":            row.team_size,
        "q1_answer":            row.q1_answer,
        "q2_answer":            row.q2_answer,
        "q3_answer":            row.q3_answer,
        "q4_answer":            row.q4_answer,
        "q5_answer":            row.q5_answer,
    }
    return {
        "id":                  row.id,
        "project_name":        row.project_name,
        "created_at":          row.created_at.isoformat(),
        "inputs":              inputs,
        "follow_up_questions": row.follow_up_questions,
        "follow_up_answers":   row.follow_up_answers,
        "result":              row.analysis_result,
    }


@app.patch("/analyses/{analysis_id}/name")
def rename_analysis(analysis_id: int, req: RenameRequest, db: Session = Depends(database.get_db)):
    row = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    row.project_name = req.name
    db.commit()
    return {"ok": True}


@app.delete("/analyses/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(database.get_db)):
    row = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


@app.get("/version")
def get_version():
    return {"version": _VERSION}
