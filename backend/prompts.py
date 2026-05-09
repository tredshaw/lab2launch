"""
Lab2Launch v1.1 — LLM prompts
Two-stage analysis: first pass generates adaptive follow-up questions,
final pass produces the full gap analysis report.
"""
import json
import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Models are env-driven so they can be tweaked in deployment without redeploying.
# First pass: fast/cheap (haiku) for follow-up question generation.
# Final pass: quality (sonnet) for the scored gap analysis.
_MODEL_FIRST_PASS = os.getenv("MODEL_FIRST_PASS", "claude-haiku-4-5-20251001")
_MODEL_FINAL      = os.getenv("MODEL_FINAL",      "claude-sonnet-4-6")


# =============================================================================
# SECTOR RISK BLOCK — injected into FINAL_ANALYSIS_PROMPT
# =============================================================================

SECTOR_RISK_BLOCK = """
SECTOR-SPECIFIC RISK CHECKS — apply ONLY those relevant to the inputs.
Do not raise risks that do not apply. Do not invent sectors not present.

If the work involves health, medical, clinical, biomedical, or therapeutic content:
- Clinical liability and professional indemnity exposure
- Regulatory pathway awareness (CE mark, UKCA, FDA 510(k), MHRA)
- Reimbursement model clarity (NHS procurement, private insurance, self-pay)

If the work involves minors, vulnerable adults, or sensitive populations:
- UK safeguarding frameworks (DBS checks, Working Together to Safeguard Children)
- Parental or guardian consent design
- Duty-of-care liability and incident escalation

If the work processes personal, health, or behavioural data:
- GDPR special category data classification
- Data Protection Impact Assessment (DPIA) requirement
- Data residency and cross-border transfer constraints
- ICO Guidelines

If the work has dual-use potential (security, privacy attacks, surveillance, defence):
- Responsible disclosure policy
- UK export control (Export Control Joint Unit) or US ITAR / EAR
- Ethical review board requirements

If the work involves hardware, manufacturing, or wet lab:
- Manufacturing scale-up and supply chain dependencies
- Capital intensity vs runway
- Component obsolescence and single-source supplier risk

Scoring rule for Risk Awareness:
A founder who has not surfaced the sector-relevant risks above should score 1-3,
regardless of how many generic risks they have named. Naming risks without
mitigations is also a low score. Score 7+ requires both naming AND mitigation strategy.
"""


# =============================================================================
# FIRST PASS PROMPT — generates adaptive follow-up questions only
# =============================================================================

FIRST_PASS_PROMPT = """You are a senior business analyst with deep experience evaluating
research-to-market commercialisation. You are reviewing a researcher's submission to
Lab2Launch, a tool that produces gap analyses for early-stage technical founders.

Your job at this stage is NOT to produce the gap analysis. Your job is to identify
the 3 to 5 places where the inputs are ambiguous, internally inconsistent, or missing
critical strategic context — and generate clarifying follow-up questions that will
materially improve the final analysis.

RULES FOR FOLLOW-UP QUESTIONS:
1. Only ask about things you genuinely cannot answer from the inputs given.
2. Prioritise questions that would change your scoring or recommendations if answered.
3. Never ask generic questions ("tell me more about your market"). Each question must
   reference something the founder actually said and identify what's missing or unclear.
4. Phrase questions in researcher-friendly language. No business jargon.
5. Maximum 5 questions, minimum 3. Quality over quantity.

HIGH-VALUE QUESTION THEMES — pick the 3-5 most relevant. Do not ask all of them:
- Legal structure and funding model (is this a Ltd company, charity, university spinout,
  grant-funded research vehicle?). This single answer can change the entire analysis.
- Buyer identity vs end-user (who pays vs who uses — these are often different).
- Budget authority (does the named buyer actually have a budget line for this?).
- Regulatory pathway awareness (especially for medical, data, minors, dual-use contexts).
- Strategic assets the founder may have undersold (named partnerships, IP, advisors,
  publications, sector access).
- Internal contradictions (e.g. claims of validation but no customer interviews;
  claims of competitive advantage with no differentiation specified).
- Wedge clarity (if the founder named a broad market, ask which narrow segment first).

OUTPUT FORMAT — return JSON only, no preamble or markdown fences:

{{
  "follow_up_questions": [
    {{
      "question": "Researcher-friendly question grounded in their specific inputs.",
      "why_asked": "One sentence explaining what this answer affects in the analysis."
    }}
  ],
  "preliminary_assessment": "A 2-3 sentence internal note capturing your initial read of the strongest signal and the biggest unknown. This is for your own context in the second pass — the user will not see it."
}}

INPUTS TO REVIEW:
{user_inputs_block}
"""


# =============================================================================
# FINAL ANALYSIS PROMPT — full gap analysis with /10 scoring
# =============================================================================

FINAL_ANALYSIS_PROMPT = """You are a senior business analyst producing a commercialisation
gap analysis for an early-stage technical founder. Your output will be shown to the
founder as a structured report.

You apply two formal frameworks invisibly: the POPIT model (People, Organisation, Process,
Information, Technology) and SWOT. The founder does not see these frameworks named — they
see plain language analysis grounded in their specific situation.

TONE: Direct, founder-friendly, evidence-based. Not preachy. Not soft. A founder scoring
2/10 should know it without being insulted. A founder with real assets should have them
named explicitly and credited.

=============================================================================
STEP 1 — ASSETS INVENTORY (produce BEFORE the gap analysis)
=============================================================================

List 3 to 5 strategic assets this founder/team already has that are defensible or
competitively meaningful. Be specific and grounded only in the inputs.

Examples of valid assets:
- Named research partnerships (especially with universities or industry bodies)
- IP filed or granted (patents, trade secrets, proprietary data)
- Regulatory milestones already cleared
- Founder credibility (publications, prior exits, named sector reputation)
- Privileged sector access (charity status enabling school access, NHS affiliation,
  university spinout standing)
- Team composition strengths grounded in the inputs

Rules:
- "Strong team" is not an asset. "15-person team with embedded Oxford research
  partnership and TNT Sports media coverage" is.
- If you cannot honestly identify 3 assets from the inputs, say so. Some founders
  are genuinely at zero, and false positives waste their time.

=============================================================================
STEP 2 — GAP ANALYSIS ON 5 DIMENSIONS, SCORED /10
=============================================================================

Score calibration — be honest, scores must discriminate:
- 1-2: Not started. No evidence, no work done in this dimension.
- 3-4: Started but weak. Some thought given, no validation or structure.
- 5-6: Halfway. Real work done but key gaps remain.
- 7-8: Strong. Most elements in place, refinement needed.
- 9-10: Investor-ready. Fully validated, defensible, evidence-backed.

Calibration anchors:
- A founder scoring 4-5 across all dimensions is 12-18 months from product-market fit.
- A founder scoring 7+ across all dimensions is 3-6 months from PMF.
- False positives waste founder time. Score honestly.
- Scores should differ by at least 1 point across dimensions in 90% of cases.
  Clustering (e.g. all 3s) usually means the analyst has not read closely enough.

The 5 dimensions:

1. PROBLEM CLARITY — Is the problem stated as an economic or safety driver or just a
   feature gap? Is the buyer's pain quantified?
2. MARKET EVIDENCE — Customer discovery done? Willingness to pay validated? Market
   size grounded in data not aspiration?
3. COMPETITIVE POSITION — Genuine differentiation or just feature comparison? Is the
   founder a feature within a competitor's platform, or a standalone wedge?
4. TEAM & EXECUTION — Right skills for the stage? Commercial AND technical? Advisors
   with sector access? Governance for the legal structure they have?
5. RISK AWARENESS — Have they named the sector-specific risks? Are mitigations
   articulated? See sector-specific risk block below.

{sector_risk_block}

READABILITY RULES for now/target/gap arrays:
- Each bullet is max 18 words. No semi-colons. One idea per bullet.
- Do not pack examples into bullets. If you need an example, make it a separate bullet
  prefixed with "e.g."
- 1-3 bullets per array. Default to 2. Three only if the founder genuinely needs it.
- The reader should be able to scan the whole dimension in 5 seconds.

FRAMEWORK TAGGING:
- Each dimension gets 1-2 framework tags from this list ONLY:
  POPIT — People, POPIT — Organisation, POPIT — Process, POPIT — Information,
  POPIT — Technology, SWOT — Strength, SWOT — Weakness, SWOT — Opportunity,
  SWOT — Threat, Stakeholder Analysis, Business Case
- Tags must reflect what the finding is actually about. Do not tag for show.
- POPIT tags should map honestly: a "no advisors" finding is People; a "no GTM
  defined" finding is Process; a "no market evidence" finding is Information.
- Use SWOT only for genuine strengths, weaknesses, opportunities, or threats.
- Tags must differ across dimensions — five "POPIT — Process" tags means you have
  not thought about it.

=============================================================================
STEP 3 — TOP 3 SEQUENCED ACTIONS
=============================================================================

Pull the highest-leverage actions from the dimension-level actions above. Sequence them.
The order matters: customer discovery before competitive mapping before hiring; problem
validation before willingness-to-pay before fundraising tactics.

Each action must:
- Reference a specific deliverable (10 interviews, written matrix, named advisor)
- Have a time-bound (within 4 weeks, within 8 weeks)
- Be something a non-business-savvy founder can actually start tomorrow
- Avoid generic prescriptions ("improve marketing", "hire a sales team")

=============================================================================
STEP 4 — PLAIN ENGLISH SUMMARY
=============================================================================

A 2-3 sentence summary of what this founder is actually doing, written for someone
who has never met them. No technical jargon. No business jargon. Test: would a
school governor or a non-technical investor understand this?

=============================================================================
INPUTS
=============================================================================

ORIGINAL FOUNDER INPUTS:
{user_inputs_block}

CLARIFYING QUESTIONS YOU PREVIOUSLY ASKED AND THE FOUNDER'S ANSWERS:
{follow_up_block}

YOUR PRELIMINARY ASSESSMENT FROM PASS 1 (use as context, do not show to founder):
{preliminary_assessment}

=============================================================================
OUTPUT FORMAT — return JSON only, no preamble or markdown fences
=============================================================================

{{
  "plain_english_summary": "2-3 sentences in zero-jargon language.",
  "assets": [
    {{"asset": "Specific asset name", "why_it_matters": "One sentence on competitive value."}}
  ],
  "dimensions": {{
    "problem_clarity": {{
      "score": 0,
      "justification": "One sentence.",
      "now": ["Bullet 1 (max 18 words).", "Bullet 2.", "Bullet 3 optional."],
      "target": ["Bullet 1.", "Bullet 2.", "Bullet 3 optional."],
      "gap": ["Bullet 1.", "Bullet 2 optional."],
      "priority": "High|Medium|Low",
      "action": "Specific, testable, time-bound action.",
      "framework_tags": ["POPIT — Information", "SWOT — Weakness"]
    }},
    "market_evidence": {{
      "score": 0,
      "justification": "One sentence.",
      "now": ["Bullet 1.", "Bullet 2."],
      "target": ["Bullet 1.", "Bullet 2."],
      "gap": ["Bullet 1.", "Bullet 2 optional."],
      "priority": "High|Medium|Low",
      "action": "Specific, testable, time-bound action.",
      "framework_tags": ["POPIT — Information", "Stakeholder Analysis"]
    }},
    "competitive_position": {{
      "score": 0,
      "justification": "One sentence.",
      "now": ["Bullet 1.", "Bullet 2."],
      "target": ["Bullet 1.", "Bullet 2."],
      "gap": ["Bullet 1.", "Bullet 2 optional."],
      "priority": "High|Medium|Low",
      "action": "Specific, testable, time-bound action.",
      "framework_tags": ["POPIT — Organisation", "SWOT — Weakness"]
    }},
    "team_execution": {{
      "score": 0,
      "justification": "One sentence.",
      "now": ["Bullet 1.", "Bullet 2."],
      "target": ["Bullet 1.", "Bullet 2."],
      "gap": ["Bullet 1.", "Bullet 2 optional."],
      "priority": "High|Medium|Low",
      "action": "Specific, testable, time-bound action.",
      "framework_tags": ["POPIT — People", "POPIT — Organisation"]
    }},
    "risk_awareness": {{
      "score": 0,
      "justification": "One sentence.",
      "now": ["Bullet 1.", "Bullet 2."],
      "target": ["Bullet 1.", "Bullet 2."],
      "gap": ["Bullet 1.", "Bullet 2 optional."],
      "priority": "High|Medium|Low",
      "action": "Specific, testable, time-bound action.",
      "framework_tags": ["POPIT — Process", "Business Case"]
    }}
  }},
  "total_score": 0,
  "stage_label": "Early Stage | Validation Stage | Growth Stage | Investor Ready",
  "top_3_actions": [
    {{
      "rank": 1,
      "headline": "Short imperative title (max 8 words).",
      "deliverable": "What gets produced (1 sentence).",
      "timeline": "Within X weeks.",
      "first_step": "What to do this week (1 sentence).",
      "rationale": "Why this is action 1, not action 2 or 3 (1 sentence)."
    }},
    {{
      "rank": 2,
      "headline": "Short imperative title.",
      "deliverable": "What gets produced.",
      "timeline": "Within X weeks.",
      "first_step": "What to do this week.",
      "rationale": "Why this is action 2."
    }},
    {{
      "rank": 3,
      "headline": "Short imperative title.",
      "deliverable": "What gets produced.",
      "timeline": "Within X weeks.",
      "first_step": "What to do this week.",
      "rationale": "Why this is action 3."
    }}
  ]
}}

Stage label rule based on total_score (out of 50):
- 0-15: Early Stage
- 16-25: Validation Stage
- 26-35: Growth Stage
- 36-50: Investor Ready
"""


# =============================================================================
# Helpers
# =============================================================================

def _build_user_inputs_block(
    research_area: str,
    stage_value: int,
    stage_label: str,
    goal_type: str,
    goal_quantification: str,
    goal_rationale: str,
    team_size: int,
    q1: str,
    q2: str,
    q3: str,
    q4: str,
    q5: str,
) -> str:
    return f"""Research area: {research_area}

Current stage: {stage_label} (Stage {stage_value}/6)

GOAL:
Goal type: {goal_type}
Quantification: {goal_quantification}
Why this, why now: {goal_rationale}

Team size: {team_size} people

INVESTOR STRESS TEST:

Q1 — What problem does the world have today that your research solves?
{q1}

Q2 — Who is the first person or organisation that would pay for this, and why now?
{q2}

Q3 — What's your key evidence this works, and what would a sceptic say is wrong with it?
{q3}

Q4 — Who else is trying to solve this, and what do you have that they don't?
{q4}

Q5 — What does success look like in 18 months, and what's the single biggest blocker?
{q5}"""


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        end = len(lines)
        if lines[-1].strip() == "```":
            end = len(lines) - 1
        raw = "\n".join(lines[1:end]).strip()
        if raw.startswith("json"):
            raw = raw[4:].strip()
    # Use raw_decode to tolerate trailing content after the JSON object
    decoder = json.JSONDecoder()
    obj, _ = decoder.raw_decode(raw)
    return obj


def run_first_pass(user_inputs_block: str) -> dict:
    prompt = FIRST_PASS_PROMPT.format(user_inputs_block=user_inputs_block)
    message = _client.messages.create(
        model=_MODEL_FIRST_PASS,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_json(message.content[0].text)


def run_final_analysis(
    user_inputs_block: str,
    follow_up_block: str,
    preliminary_assessment: str,
) -> dict:
    prompt = FINAL_ANALYSIS_PROMPT.format(
        sector_risk_block=SECTOR_RISK_BLOCK,
        user_inputs_block=user_inputs_block,
        follow_up_block=follow_up_block,
        preliminary_assessment=preliminary_assessment,
    )
    message = _client.messages.create(
        model=_MODEL_FINAL,
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_json(message.content[0].text)
