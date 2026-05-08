"""PDF generation via fpdf2 — Lab2Launch v1.1 (pure Python, no system deps)"""
from fpdf import FPDF, XPos, YPos

# ── Colour palette ─────────────────────────────────────────────────────────
ACCENT   = (124, 92, 255)
TURQ     = (6, 182, 212)
GREEN    = (16, 185, 129)
AMBER    = (245, 158, 11)
RED      = (239, 68, 68)
DARK     = (15, 20, 25)
CARD_BG  = (21, 27, 38)
MUTED    = (176, 184, 198)
MUTED2   = (122, 133, 152)
WHITE    = (255, 255, 255)
BORDER   = (42, 56, 73)
INP_BG   = (26, 35, 50)

PRIORITY_COLORS = {"High": RED, "Medium": AMBER, "Low": GREEN}
ACTION_COLORS   = [ACCENT, TURQ, GREEN]

DIM_LABELS = {
    "problem_clarity":      "Problem Clarity",
    "market_evidence":      "Market Evidence",
    "competitive_position": "Competitive Position",
    "team_execution":       "Team & Execution",
    "risk_awareness":       "Risk Awareness",
}


def _safe(s) -> str:
    """Strip characters fpdf2 can't handle in basic Latin mode."""
    if not s:
        return ""
    return str(s).encode("latin-1", errors="replace").decode("latin-1")


def _wrap_text(pdf: FPDF, text: str, w: float) -> None:
    """Write multi-cell text, sanitised."""
    pdf.multi_cell(w, 5, _safe(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)


class ReportPDF(FPDF):
    def __init__(self, project_name: str):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.project_name = project_name
        self.set_margins(18, 20, 18)
        self.set_auto_page_break(auto=True, margin=20)
        self.add_page()

    # ── Thin utility methods ──────────────────────────────────────────────

    def set_rgb(self, rgb):
        self.set_fill_color(*rgb)
        self.set_text_color(*rgb)
        self.set_draw_color(*rgb)

    def rule(self, rgb=BORDER, h=0.3):
        self.set_draw_color(*rgb)
        self.line(self.get_x(), self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(h)

    def spacer(self, h=4):
        self.ln(h)

    def label(self, text, rgb=MUTED2, size=7):
        self.set_font("Helvetica", "B", size)
        self.set_text_color(*rgb)
        self.cell(0, 4, _safe(text.upper()), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def body(self, text, rgb=MUTED, size=9):
        self.set_font("Helvetica", "", size)
        self.set_text_color(*rgb)
        _wrap_text(self, text, self.epw)

    def bold(self, text, rgb=WHITE, size=10):
        self.set_font("Helvetica", "B", size)
        self.set_text_color(*rgb)
        _wrap_text(self, text, self.epw)

    def pill(self, text, fg, bg, size=7):
        self.set_font("Helvetica", "B", size)
        self.set_text_color(*fg)
        self.set_fill_color(*bg)
        w = self.get_string_width(_safe(text)) + 6
        self.cell(w, 5, _safe(text), fill=True, new_x=XPos.RIGHT, new_y=YPos.LAST)

    def bullet_list(self, items, rgb=MUTED, size=9):
        if not items:
            return
        if isinstance(items, str):
            items = [items]
        self.set_font("Helvetica", "", size)
        self.set_text_color(*rgb)
        for item in items:
            x = self.get_x()
            self.set_x(x + 3)
            self.cell(4, 5, chr(149), new_x=XPos.RIGHT, new_y=YPos.LAST)
            self.multi_cell(self.epw - 7, 5, _safe(str(item)),
                            new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def score_bars(self, score: int, color: tuple, w_each: float = 5.5, gap: float = 1):
        for i in range(10):
            self.set_fill_color(*(color if i < score else BORDER))
            self.rect(self.get_x() + i * (w_each + gap), self.get_y(),
                      w_each, 3, style="F")
        self.ln(6)

    def section_header(self, text):
        self.spacer(6)
        self.rule()
        self.spacer(1)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 5, _safe(text.upper()), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.spacer(3)


def generate_pdf(analysis: dict, project_name: str = "Research Project") -> bytes:
    pdf = ReportPDF(project_name)
    epw = pdf.epw

    # ── Report header ─────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 5, "LAB2LAUNCH REPORT", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.spacer(2)

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 10, _safe(project_name), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    summary = analysis.get("plain_english_summary", "")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*MUTED)
    _wrap_text(pdf, summary, epw)
    pdf.spacer(3)

    total  = analysis.get("total_score") or sum(
        d.get("score", 0) for d in analysis.get("dimensions", {}).values()
    )
    stage  = analysis.get("stage_label", "")
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*ACCENT)
    pdf.cell(20, 10, str(total), new_x=XPos.RIGHT, new_y=YPos.LAST)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*MUTED)
    pdf.cell(12, 10, "/ 50", new_x=XPos.RIGHT, new_y=YPos.LAST)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*ACCENT)
    pdf.set_fill_color(*ACCENT)
    fill_col = (40, 30, 80)
    pdf.set_fill_color(*fill_col)
    pdf.cell(0, 10, f"  {_safe(stage)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.rule()

    # ── Assets ────────────────────────────────────────────────────────────
    pdf.section_header("Your Assets")
    assets = analysis.get("assets", [])
    if not assets:
        pdf.body("No clear strategic assets identified from the inputs provided.")
    else:
        for a in assets:
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*GREEN)
            pdf.cell(6, 5, chr(252), new_x=XPos.RIGHT, new_y=YPos.LAST)
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*WHITE)
            pdf.multi_cell(epw - 6, 5, _safe(a.get("asset", "")),
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(*MUTED)
            pdf.set_x(pdf.l_margin + 6)
            pdf.multi_cell(epw - 6, 5, _safe(a.get("why_it_matters", "")),
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.spacer(2)

    # ── Top 3 Actions ─────────────────────────────────────────────────────
    pdf.section_header("Top 3 Actions")
    for idx, a in enumerate(analysis.get("top_3_actions", [])):
        bc = ACTION_COLORS[min(idx, 2)]
        rank = a.get("rank", idx + 1)
        headline = a.get("headline") or a.get("action", "")

        # Left border bar
        x0, y0 = pdf.get_x(), pdf.get_y()
        pdf.set_fill_color(*bc)
        pdf.rect(x0, y0, 2, 28, style="F")
        pdf.set_x(x0 + 5)

        # Rank circle
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*WHITE)
        pdf.set_fill_color(*bc)
        pdf.cell(6, 6, str(rank), fill=True, new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.set_x(pdf.get_x() + 3)

        # Headline
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*WHITE)
        pdf.multi_cell(epw - 16, 6, _safe(headline),
                       new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if a.get("deliverable"):
            pdf.set_x(x0 + 5)
            half = (epw - 5) / 2
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*MUTED2)
            pdf.cell(half, 4, "DELIVERABLE", new_x=XPos.RIGHT, new_y=YPos.LAST)
            pdf.cell(half, 4, "TIMELINE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            pdf.set_x(x0 + 5)
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(*MUTED)
            pdf.multi_cell(half, 4, _safe(a.get("deliverable", "")),
                           new_x=XPos.RIGHT, new_y=YPos.LAST)
            pdf.multi_cell(half, 4, _safe(a.get("timeline", "")),
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            pdf.set_x(x0 + 5)
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*TURQ)
            pdf.cell(0, 4, "FIRST STEP THIS WEEK", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_x(x0 + 5)
            pdf.set_font("Helvetica", "B", 8.5)
            pdf.set_text_color(*WHITE)
            pdf.multi_cell(epw - 5, 4, _safe(a.get("first_step", "")),
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.spacer(4)

    # ── Dimension cards ───────────────────────────────────────────────────
    pdf.section_header("Where You Are vs. Where You Need to Be")
    dims = analysis.get("dimensions", {})
    for key, label in DIM_LABELS.items():
        d = dims.get(key)
        if not d:
            continue

        score    = d.get("score", 0)
        priority = d.get("priority", "Low")
        color    = PRIORITY_COLORS.get(priority, MUTED)
        tags     = d.get("framework_tags", [])

        # Check if we have room for the card (approx 50mm)
        if pdf.get_y() > pdf.h - pdf.b_margin - 55:
            pdf.add_page()

        x0, y0 = pdf.get_x(), pdf.get_y()
        pdf.set_fill_color(*color)
        pdf.rect(x0, y0, 2, 5, style="F")
        pdf.set_x(x0 + 5)

        # Dimension label + score
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*WHITE)
        pdf.cell(epw - 20, 5, _safe(label), new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*color)
        pdf.cell(0, 5, f"{score}/10", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Framework tag pills
        if tags:
            pdf.spacer(1)
            for t in tags[:2]:
                pdf.set_font("Helvetica", "B", 6.5)
                pdf.set_text_color(99, 102, 241)
                pdf.set_fill_color(30, 30, 60)
                tw = pdf.get_string_width(_safe(t)) + 4
                pdf.cell(tw, 4, _safe(t), fill=True,
                         new_x=XPos.RIGHT, new_y=YPos.LAST)
                pdf.cell(2, 4, "", new_x=XPos.RIGHT, new_y=YPos.LAST)
            pdf.ln(4)

        # Progress bars
        pdf.spacer(1)
        pdf.score_bars(score, color)

        # NOW / TARGET / GAP
        for field_key, field_label in [("now", "NOW"), ("target", "TARGET"), ("gap", "GAP")]:
            val = d.get(field_key)
            if not val:
                continue
            pdf.label(field_label)
            pdf.bullet_list(val if isinstance(val, list) else [val])
            pdf.spacer(1)

        # Action
        action_text = d.get("action") or d.get("guidance", "")
        if action_text:
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*MUTED2)
            priority_bg = tuple(max(0, c - 200) for c in color)
            pdf.pill(priority, color, priority_bg)
            pdf.set_x(pdf.get_x() + 3)
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(*MUTED)
            pdf.multi_cell(epw - 30, 5, _safe(action_text),
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.spacer(3)
        pdf.set_draw_color(*BORDER)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.spacer(4)

    # ── Methodology footer ────────────────────────────────────────────────
    if pdf.get_y() > pdf.h - pdf.b_margin - 45:
        pdf.add_page()

    pdf.section_header("How This Report Was Built")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(epw, 5,
        "This analysis applies four formal Business Analysis frameworks:\n"
        "  * POPIT model - evaluates People, Organisation, Process, Information, and Technology readiness.\n"
        "  * SWOT - identifies internal strengths and weaknesses, external opportunities and threats.\n"
        "  * Stakeholder Analysis - maps buyers, users, influencers, and blockers in the target market.\n"
        "  * Business Case Structure - weighs costs, benefits, risks, and feasibility.\n\n"
        "Scoring is calibrated against typical research-to-market trajectories. A score of 4-5 across all "
        "dimensions indicates roughly 12-18 months from product-market fit; 7+ indicates 3-6 months.",
        new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.spacer(4)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_text_color(*MUTED2)
    pdf.cell(0, 4, "Generated by Lab2Launch v1.1 using Claude (Anthropic).",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    return bytes(pdf.output())
