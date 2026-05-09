"""In-memory metrics collector for the admin dashboard.

Captures every Claude API call (token usage, latency, errors) and every
completed analysis. State is process-local and resets on server restart —
intentional, since the V1 service runs single-worker and the admin
dashboard is a live monitor, not a permanent record.

Pricing constants are hardcoded; verify against
https://www.anthropic.com/pricing before reading the dashboard.
"""
from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Deque, Dict, List, Optional

# USD per million tokens. Update if Anthropic pricing changes.
# Source: https://www.anthropic.com/pricing
_PRICE_PER_MTOK: Dict[str, Dict[str, float]] = {
    "claude-haiku-4-5-20251001": {"input": 1.00, "output": 5.00},
    "claude-haiku-4-5":          {"input": 1.00, "output": 5.00},
    "claude-sonnet-4-6":         {"input": 3.00, "output": 15.00},
    "claude-sonnet-4-5":         {"input": 3.00, "output": 15.00},
    "claude-opus-4-7":           {"input": 15.00, "output": 75.00},
}


def _cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    p = _PRICE_PER_MTOK.get(model)
    if not p:
        return 0.0
    return (input_tokens / 1_000_000) * p["input"] + (output_tokens / 1_000_000) * p["output"]


@dataclass
class CallRecord:
    ts: float                 # epoch seconds
    route: str                # "/first-pass" or "/final-analysis"
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cost_usd: float
    error: Optional[str] = None


@dataclass
class AnalysisRecord:
    ts: float
    project_name: str
    total_score: Optional[int]
    model: str


@dataclass
class MetricsCollector:
    started_at: float = field(default_factory=time.time)
    calls: Deque[CallRecord] = field(default_factory=lambda: deque(maxlen=500))
    analyses: Deque[AnalysisRecord] = field(default_factory=lambda: deque(maxlen=200))
    errors: Deque[CallRecord] = field(default_factory=lambda: deque(maxlen=20))

    def record_call(
        self,
        route: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: float,
        error: Optional[str] = None,
    ) -> None:
        rec = CallRecord(
            ts=time.time(),
            route=route,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost_usd=_cost_usd(model, input_tokens, output_tokens),
            error=error,
        )
        self.calls.append(rec)
        if error:
            self.errors.append(rec)

    def record_analysis(self, project_name: str, total_score: Optional[int], model: str) -> None:
        self.analyses.append(AnalysisRecord(
            ts=time.time(),
            project_name=project_name or "Untitled",
            total_score=total_score,
            model=model,
        ))

    # ----------- aggregations consumed by the admin dashboard -----------

    def _filter(self, since: float) -> List[CallRecord]:
        return [c for c in self.calls if c.ts >= since]

    def _spend(self, calls: List[CallRecord]) -> float:
        return sum(c.cost_usd for c in calls)

    def spend_breakdown(self) -> Dict[str, float]:
        now = time.time()
        day_ago = now - 86400
        week_ago = now - 86400 * 7
        month_ago = now - 86400 * 30
        return {
            "today":   self._spend(self._filter(day_ago)),
            "week":    self._spend(self._filter(week_ago)),
            "month":   self._spend(self._filter(month_ago)),
            "session": self._spend(list(self.calls)),
        }

    def volume_breakdown(self) -> Dict[str, int]:
        now = time.time()
        day_ago = now - 86400
        week_ago = now - 86400 * 7
        return {
            "today":   sum(1 for a in self.analyses if a.ts >= day_ago),
            "week":    sum(1 for a in self.analyses if a.ts >= week_ago),
            "session": len(self.analyses),
        }

    def latency_summary(self) -> Dict[str, Dict[str, Optional[float]]]:
        out: Dict[str, Dict[str, Optional[float]]] = {}
        for route in ("/first-pass", "/final-analysis"):
            samples = sorted(c.latency_ms for c in self.calls if c.route == route and not c.error)
            if not samples:
                out[route] = {"avg_ms": None, "p95_ms": None, "n": 0}
                continue
            avg = sum(samples) / len(samples)
            p95_idx = max(0, int(round(len(samples) * 0.95)) - 1)
            out[route] = {"avg_ms": avg, "p95_ms": samples[p95_idx], "n": len(samples)}
        return out

    def error_summary(self) -> Dict[str, object]:
        now = time.time()
        day_ago = now - 86400
        recent = [e for e in self.errors if e.ts >= day_ago]
        return {
            "count_24h": len(recent),
            "last_5": [
                {
                    "when": datetime.fromtimestamp(e.ts, tz=timezone.utc).isoformat(timespec="seconds"),
                    "route": e.route,
                    "model": e.model,
                    "error": (e.error or "")[:200],
                }
                for e in list(self.errors)[-5:][::-1]
            ],
        }

    def recent_activity(self, n: int = 20) -> List[Dict[str, object]]:
        rows = list(self.analyses)[-n:][::-1]
        return [
            {
                "when": datetime.fromtimestamp(a.ts, tz=timezone.utc).isoformat(timespec="seconds"),
                "project_name": a.project_name,
                "total_score": a.total_score,
                "model": a.model,
            }
            for a in rows
        ]


# Module-level singleton — imported by prompts.py and admin.py.
metrics = MetricsCollector()
