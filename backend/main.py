import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.requests import Request

import pdf_generator
import prompts

_VERSION = Path(__file__).parent.joinpath("VERSION").read_text().strip()
_ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

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
# In-memory wizard session store — holds first-pass state between
# /first-pass and /final-analysis. Keyed by session UUID, 30-min TTL.
# ---------------------------------------------------------------------------
_sessions: dict = {}
_SESSION_TTL = 30 * 60


def _cleanup_sessions() -> None:
    now = time.time()
    expired = [k for k, v in _sessions.items() if now - v["created_at"] > _SESSION_TTL]
    for k in expired:
        del _sessions[k]


# ---------------------------------------------------------------------------
# In-memory completed-analysis cache — holds finished analyses so the
# Results page can fetch them via GET /analyses/{id}. Keyed by analysis UUID,
# 30-min TTL. Process-local: assumes single-worker uvicorn.
# ---------------------------------------------------------------------------
_completed: dict = {}
_COMPLETED_TTL = 30 * 60


def _cleanup_completed() -> None:
    now = time.time()
    expired = [k for k, v in _completed.items() if now - v["created_at"] > _COMPLETED_TTL]
    for k in expired:
        del _completed[k]


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


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/first-pass")
def first_pass(req: FirstPassRequest):
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

    analysis_id = str(uuid.uuid4())
    follow_up_questions = result.get("follow_up_questions", [])

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "analysis_id": analysis_id,
        "project_name": req.project_name or "Untitled",
        "user_inputs_block": user_inputs_block,
        "preliminary_assessment": result.get("preliminary_assessment", ""),
        "inputs": {
            "project_name":         req.project_name or "Untitled",
            "research_area":        req.research_area,
            "stage_value":          req.stage_value,
            "stage_label":          req.stage_label,
            "goal_type":            req.goal_type,
            "goal_quantification":  req.goal_quantification,
            "goal_rationale":       req.goal_rationale,
            "team_size":            req.team_size,
            "q1_answer":            req.q1_answer,
            "q2_answer":            req.q2_answer,
            "q3_answer":            req.q3_answer,
            "q4_answer":            req.q4_answer,
            "q5_answer":            req.q5_answer,
        },
        "follow_up_questions": follow_up_questions,
        "created_at": time.time(),
    }
    return {
        "session_id": session_id,
        "analysis_id": analysis_id,
        "follow_up_questions": follow_up_questions,
    }


@app.post("/final-analysis")
def final_analysis(req: FinalAnalysisRequest):
    _cleanup_sessions()
    _cleanup_completed()
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

    analysis_id = session["analysis_id"]
    _completed[analysis_id] = {
        "created_at": time.time(),
        "id": analysis_id,
        "project_name": session["project_name"],
        "created_at_iso": datetime.utcnow().isoformat(),
        "inputs": session["inputs"],
        "follow_up_questions": session["follow_up_questions"],
        "follow_up_answers": [a.model_dump() for a in req.follow_up_answers],
        "result": result,
    }

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


@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: str):
    _cleanup_completed()
    entry = _completed.get(analysis_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Analysis not found or expired")
    return {
        "id":                  entry["id"],
        "project_name":        entry["project_name"],
        "created_at":          entry["created_at_iso"],
        "inputs":              entry["inputs"],
        "follow_up_questions": entry["follow_up_questions"],
        "follow_up_answers":   entry["follow_up_answers"],
        "result":              entry["result"],
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/version")
def get_version():
    return {"version": _VERSION}


# ---------------------------------------------------------------------------
# SPA serving — in production, FastAPI serves the built React app from
# frontend/dist. In dev, Vite serves the frontend on :5173 and proxies API
# calls to this backend, so this mount is skipped.
# ---------------------------------------------------------------------------

_FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if _ENVIRONMENT == "production" and _FRONTEND_DIST.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=str(_FRONTEND_DIST / "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str, request: Request):
        # Any non-API path falls through here. If the dist contains the
        # exact file (favicon, etc.), serve it; otherwise serve index.html
        # so React Router can take over.
        candidate = _FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_DIST / "index.html")
