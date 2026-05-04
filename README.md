# Lab2Launch

**Research → Investor-Ready**

A web app that helps deep tech and biomedical researchers translate their science into investor-ready language — and get a structured gap analysis on exactly what's missing to bring their technology to market.

---

## What It Does

Most researchers can articulate the science. Almost none can articulate the business. Lab2Launch bridges that gap using formal Business Analysis frameworks (POPIT, SWOT, Business Case Structure) encoded into a Claude-powered prompt architecture — not visible to the user, but running underneath everything.

**Input:** A short intake form + 5 adversarial investor questions  
**Output:** A structured gap analysis report with readiness scores, current vs. target state, and prioritised actions

---

## Screenshots

### Landing Page (Dark Mode)

<img width="2539" height="1323" alt="Screenshot 2026-05-04 at 11 39 24" src="https://github.com/user-attachments/assets/32ddd847-cff8-4f9d-a75f-d7d60b15cdb5" />


### Landing Page (Light Mode)

<img width="2544" height="1325" alt="Screenshot 2026-05-04 at 11 39 32" src="https://github.com/user-attachments/assets/dead7e13-6435-49da-9e10-7a5d932aacc7" />


### Intake Form — Project Details

<img width="2539" height="1318" alt="Screenshot 2026-05-04 at 11 39 40" src="https://github.com/user-attachments/assets/295804d2-bf9b-4eb5-8a9e-4376a189fa1f" />


### Investor Stress Test

Five adversarial questions that mirror what every investor or accelerator panel will ask.

<img width="2545" height="1327" alt="Screenshot 2026-05-04 at 11 39 52" src="https://github.com/user-attachments/assets/d6c22f1d-50f7-4457-8776-5be9733ab040" />


### Full Report — Plain English Summary + Assets

<img width="2544" height="716" alt="Screenshot 2026-05-04 at 11 40 18" src="https://github.com/user-attachments/assets/f134ee0b-293d-4a88-980b-97a69f9b5803" />


### Analysis Output — Readiness Radar + Top 3 Actions

<img width="2542" height="1322" alt="Screenshot 2026-05-04 at 11 40 12" src="https://github.com/user-attachments/assets/899784c9-170f-40ca-9be3-f96e53d56f07" />



---

## The BA Framework Engine

The differentiation is not the LLM — it's the schema. The prompt architecture encodes:

- **POPIT Model** (People, Organisation, Process, Information, Technology) applied to commercialisation gaps
- **SWOT** for competitive positioning
- **Business Case Structure** (costs, benefits, risks, feasibility) applied to the commercialisation decision
- **Stakeholder Analysis** — buyers, users, influencers, and blockers in the target market

The researcher never sees these frameworks. They answer questions. The frameworks do the work underneath.

---

## Tech Stack

| Component | Choice |
|---|---|
| Backend | Python + FastAPI |
| Frontend | Single HTML file + Vanilla JS + Tailwind CSS (CDN) |
| LLM | Anthropic Claude claude-sonnet-4-6 |
| Deployment | Railway / Render |

---

## Product Structure

**Narrative Translation + Gap Analysis**  
Plain English research translation, 5-dimension gap analysis, top 3 prioritised actions.

**Investor Stress Test**  
5 adversarial questions that mirror investor/accelerator panels. Answers feed into the analysis.

---

## Target User

PhD/postdoc or university spinout founder (pre-seed or seeking first investment). Strong on science, weak on: problem framing, market sizing, GTM strategy, and investor narrative.

Primary ecosystem: Imperial College London, UCL, King's College London spinouts in medical devices, biomedical engineering, and deep tech.

---

## About

Built by Toby Redshaw — MEng Biomedical Engineering (Imperial, 1st Class), BCS Foundation Certificate in Business Analysis, Business Analyst at Podium Analytics, and solo founder of [Eddy](https://swimwitheddy.com).
