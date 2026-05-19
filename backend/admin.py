"""Admin dashboard at /admin — gated by magic-link email auth.

Single whitelisted recipient (toby@redshaw.me). On unauthenticated visit,
the user enters their email and receives a one-time signed token via
Resend. Clicking the link sets a 7-day signed session cookie.

State is in-memory: token consumption set + the metrics collector. Resets
on server restart, by design — see metrics.py.
"""
from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, Set

import httpx
from fastapi import APIRouter, Body, Cookie, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from jinja2 import Environment, FileSystemLoader, select_autoescape

from metrics import metrics

# ----- Config ---------------------------------------------------------------

ADMIN_EMAIL = "toby@redshaw.me"
SESSION_COOKIE = "lab2launch_admin"
SESSION_MAX_AGE = 7 * 24 * 60 * 60      # 7 days
TOKEN_MAX_AGE = 15 * 60                  # 15 minutes
_SECRET = os.getenv("SESSION_SECRET", "dev-only-not-secret")
_RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
_PUBLIC_URL = os.getenv("PUBLIC_URL", "http://127.0.0.1:8000")
_FROM_ADDRESS = os.getenv("ADMIN_FROM", "Lab2Launch <noreply@lab2launch.app>")
_GH_TOKEN = os.getenv("GITHUB_TOKEN", "")
_GH_REPO = os.getenv("GITHUB_REPO", "tredshaw/lab2launch")
_GH_BASE_BRANCH = os.getenv("GITHUB_BASE_BRANCH", "main")
_COPY_PATH = "frontend/src/content/landing.json"
_LOCAL_COPY_FILE = Path(__file__).parent.parent / _COPY_PATH

_token_serializer = URLSafeTimedSerializer(_SECRET, salt="lab2launch-magic")
_session_serializer = URLSafeTimedSerializer(_SECRET, salt="lab2launch-session")

# One-time-use tracking — tokens are consumed on first successful auth.
_consumed_tokens: Set[str] = set()

# ----- Template loader ------------------------------------------------------

_TEMPLATES_DIR = Path(__file__).parent / "templates"
_jinja = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


# ----- Helpers --------------------------------------------------------------

def _is_authed(cookie_value: Optional[str]) -> bool:
    if not cookie_value:
        return False
    try:
        email = _session_serializer.loads(cookie_value, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return False
    return email == ADMIN_EMAIL


def _send_magic_link(email: str, link: str) -> None:
    """Send the magic link via Resend. If RESEND_API_KEY is unset, just log
    it — useful for local dev without an outbound email account."""
    if not _RESEND_API_KEY:
        print(f"[admin] magic link for {email}: {link}")
        return
    try:
        import resend
        resend.api_key = _RESEND_API_KEY
        resend.Emails.send({
            "from": _FROM_ADDRESS,
            "to": [email],
            "subject": "Your Lab2Launch admin sign-in link",
            "html": (
                "<p>Click to sign in to the Lab2Launch admin dashboard.</p>"
                f'<p><a href="{link}">{link}</a></p>'
                "<p>The link expires in 15 minutes and can be used once.</p>"
            ),
        })
    except Exception as e:
        # Falling back to console keeps the system usable even if email breaks.
        print(f"[admin] resend failed ({e}); link for {email}: {link}")


def _format_currency(usd: float) -> str:
    return f"${usd:,.2f}" if usd >= 0.01 else f"${usd:.4f}"


def _format_ts(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return iso


# ----- Routes ---------------------------------------------------------------

router = APIRouter()


@router.get("/admin", response_class=HTMLResponse, include_in_schema=False)
def admin_index(
    request: Request,
    sent: int = 0,
    notice: Optional[str] = None,
    session: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE),
):
    if not _is_authed(session):
        tmpl = _jinja.get_template("admin_login.html")
        return HTMLResponse(tmpl.render(sent=bool(sent), notice=notice))

    tmpl = _jinja.get_template("admin_dashboard.html")
    spend = metrics.spend_breakdown()
    return HTMLResponse(tmpl.render(
        spend={k: _format_currency(v) for k, v in spend.items()},
        spend_raw=spend,
        volume=metrics.volume_breakdown(),
        latency=metrics.latency_summary(),
        errors=metrics.error_summary(),
        activity=[
            {**a, "when": _format_ts(a["when"])}
            for a in metrics.recent_activity(20)
        ],
        started_at=datetime.fromtimestamp(metrics.started_at, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        format_ts=_format_ts,
    ))


@router.post("/admin/login", include_in_schema=False)
def admin_login_send(email: str = Form(...)):
    target = email.strip().lower()
    if target == ADMIN_EMAIL:
        token = _token_serializer.dumps(target)
        link = f"{_PUBLIC_URL.rstrip('/')}/admin/auth?token={token}"
        _send_magic_link(target, link)
    # Always claim "sent" — never leak whether the email is whitelisted.
    return RedirectResponse(url="/admin?sent=1", status_code=303)


@router.get("/admin/auth", include_in_schema=False)
def admin_login_consume(token: str):
    try:
        email = _token_serializer.loads(token, max_age=TOKEN_MAX_AGE)
    except SignatureExpired:
        return RedirectResponse(url="/admin?notice=expired", status_code=303)
    except BadSignature:
        return RedirectResponse(url="/admin?notice=invalid", status_code=303)

    if email != ADMIN_EMAIL or token in _consumed_tokens:
        return RedirectResponse(url="/admin?notice=invalid", status_code=303)
    _consumed_tokens.add(token)

    cookie = _session_serializer.dumps(email)
    resp = RedirectResponse(url="/admin", status_code=303)
    resp.set_cookie(
        key=SESSION_COOKIE,
        value=cookie,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="lax",
    )
    return resp


@router.post("/admin/logout", include_in_schema=False)
def admin_logout():
    resp = RedirectResponse(url="/admin", status_code=303)
    resp.delete_cookie(SESSION_COOKIE)
    return resp


# ----- Copy editor ----------------------------------------------------------

@router.get("/admin/copy", response_class=HTMLResponse, include_in_schema=False)
def admin_copy_editor(
    session: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE),
):
    if not _is_authed(session):
        return RedirectResponse(url="/admin", status_code=303)
    try:
        current = json.loads(_LOCAL_COPY_FILE.read_text())
    except FileNotFoundError:
        current = {}
    tmpl = _jinja.get_template("admin_copy.html")
    return HTMLResponse(tmpl.render(
        data_json=json.dumps(current, indent=2, ensure_ascii=False),
        repo=_GH_REPO,
        github_configured=bool(_GH_TOKEN),
    ))


@router.post("/admin/copy", include_in_schema=False)
def admin_copy_save(
    payload: dict = Body(...),
    session: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE),
):
    if not _is_authed(session):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not _GH_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_TOKEN is not configured on the server. Set it to a fine-grained PAT with Contents (read/write) and Pull requests (write) scopes for the repo.",
        )

    new_content = payload.get("content")
    note = (payload.get("note") or "").strip()
    if not isinstance(new_content, dict):
        raise HTTPException(status_code=400, detail="`content` must be a JSON object")

    new_json = json.dumps(new_content, indent=2, ensure_ascii=False) + "\n"
    try:
        return JSONResponse(_open_copy_pr(new_json, note))
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500]
        raise HTTPException(status_code=502, detail=f"GitHub API error {e.response.status_code}: {body}")


def _gh_headers() -> dict:
    return {
        "Authorization": f"Bearer {_GH_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _open_copy_pr(new_json: str, note: str) -> dict:
    """Create a branch off main, commit the new landing.json, open a PR.

    Returns {"pr_url": str, "branch": str}.
    """
    api = "https://api.github.com"
    branch = f"admin/copy-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
    with httpx.Client(timeout=30.0, headers=_gh_headers()) as c:
        # 1. Get the SHA of main
        r = c.get(f"{api}/repos/{_GH_REPO}/git/ref/heads/{_GH_BASE_BRANCH}")
        r.raise_for_status()
        base_sha = r.json()["object"]["sha"]

        # 2. Create the new branch
        r = c.post(
            f"{api}/repos/{_GH_REPO}/git/refs",
            json={"ref": f"refs/heads/{branch}", "sha": base_sha},
        )
        r.raise_for_status()

        # 3. Look up the existing file SHA on the base branch (required to update)
        r = c.get(
            f"{api}/repos/{_GH_REPO}/contents/{_COPY_PATH}",
            params={"ref": _GH_BASE_BRANCH},
        )
        if r.status_code == 404:
            existing_sha = None
        else:
            r.raise_for_status()
            existing_sha = r.json().get("sha")

        # 4. Commit the new file content to the branch
        commit_msg = "admin: update landing copy" + (f"\n\n{note}" if note else "")
        put_body: dict[str, Any] = {
            "message": commit_msg,
            "content": base64.b64encode(new_json.encode("utf-8")).decode("ascii"),
            "branch": branch,
        }
        if existing_sha:
            put_body["sha"] = existing_sha
        r = c.put(f"{api}/repos/{_GH_REPO}/contents/{_COPY_PATH}", json=put_body)
        r.raise_for_status()

        # 5. Open the PR
        pr_title = "Update landing copy" + (f" — {note[:60]}" if note else "")
        pr_body = (
            "Generated from the /admin/copy editor."
            + (f"\n\n**Notes:** {note}" if note else "")
        )
        r = c.post(
            f"{api}/repos/{_GH_REPO}/pulls",
            json={
                "title": pr_title,
                "head": branch,
                "base": _GH_BASE_BRANCH,
                "body": pr_body,
            },
        )
        r.raise_for_status()
        pr = r.json()
        return {"pr_url": pr["html_url"], "branch": branch}
