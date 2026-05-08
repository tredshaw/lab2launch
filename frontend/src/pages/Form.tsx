import TopNav from '../components/TopNav'
import Button from '../components/Button'
import { useWizard } from '../hooks/useWizard'
import { FORM_STEPS, STAGES, GOAL_TYPES } from '../content/form'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ height: 2, background: 'var(--hairline)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      <div style={{
        height: '100%',
        background: 'var(--signal)',
        width: `${((step + 1) / total) * 100}%`,
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

function StepSidebar({ step, total }: { step: number; total: number }) {
  const labels = ['Project', 'Problem', 'Market', 'Competition', 'Team', 'Risk', 'Goal', 'Review']
  return (
    <div className="analyse-side">
      <span className="t-mono" style={{ display: 'block', marginBottom: 16 }}>
        Step {step + 1} of {total}
      </span>
      <div className="analyse-progress">
        {labels.map((label, i) => (
          <div key={i} className={`analyse-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
            <span className="analyse-step-num">{i < step ? '✓' : i + 1}</span>
            <span className="analyse-step-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Form() {
  const wizard = useWizard()
  const { step, phase, formData, setField, next, prev, update, totalSteps } = wizard

  const submitFirstPass = async () => {
    update({ phase: 'running', error: null })
    try {
      const res = await fetch('/first-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: formData.project_name || 'Untitled',
          research_area: formData.research_area,
          stage_value: formData.stage_value,
          stage_label: formData.stage_label,
          goal_type: formData.goal_type || 'other',
          goal_quantification: formData.goal_quantification || 'Not specified',
          goal_rationale: formData.goal_rationale || 'Not specified',
          team_size: parseInt(formData.team_size) || 1,
          q1_answer: formData.q1_answer,
          q2_answer: formData.q2_answer,
          q3_answer: formData.q3_answer,
          q4_answer: formData.q4_answer,
          q5_answer: formData.q5_answer,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      update({
        phase: 'followup',
        sessionId: data.session_id,
        analysisId: data.analysis_id,
        followUpQuestions: data.follow_up_questions || [],
        followUpAnswers: new Array(data.follow_up_questions?.length ?? 0).fill(''),
      })
    } catch (e) {
      update({ phase: 'review', error: (e as Error).message })
    }
  }

  const submitFinalAnalysis = async () => {
    update({ phase: 'running', error: null })
    try {
      const res = await fetch('/final-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: wizard.sessionId,
          follow_up_answers: wizard.followUpQuestions.map((q, i) => ({
            question: q.question,
            answer: wizard.followUpAnswers[i] || 'No answer provided',
          })),
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      update({ phase: 'done' })
    } catch (e) {
      update({ phase: 'followup', error: (e as Error).message })
    }
  }

  if (phase === 'running') {
    return (
      <>
        <TopNav />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, padding: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid var(--hairline)',
            borderTopColor: 'var(--signal)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p className="t-mono" style={{ color: 'var(--muted)' }}>
            {wizard.sessionId ? 'Running final analysis…' : 'Identifying follow-up questions…'}
          </p>
          <p className="t-small" style={{ maxWidth: 320, textAlign: 'center' }}>
            Claude is reading your inputs and applying POPIT + SWOT frameworks. This takes 20–40 seconds.
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    )
  }

  if (phase === 'done') {
    return (
      <>
        <TopNav />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, padding: 32, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>Σ</span>
          <h1 className="t-h2">Analysis complete</h1>
          <p className="t-body" style={{ maxWidth: 420 }}>
            Your gap analysis is ready. Results display is coming in the next version.
            For now, view your analysis in the legacy dashboard.
          </p>
          <Button variant="primary" size="lg" href="/static/index.html" arrow>
            View analysis dashboard
          </Button>
          <Button variant="ghost" href="/">Back to home</Button>
        </div>
      </>
    )
  }

  if (phase === 'followup') {
    return (
      <>
        <TopNav />
        <div className="analyse-shell">
          <div className="analyse-side" style={{ paddingTop: 64 }}>
            <span className="t-mono" style={{ display: 'block', marginBottom: 8 }}>Follow-up</span>
            <p className="t-small" style={{ maxWidth: 200 }}>
              Claude identified {wizard.followUpQuestions.length} areas where more context will sharpen the analysis.
            </p>
          </div>
          <div style={{ padding: '64px 0 96px' }}>
            <h1 className="t-h2" style={{ marginBottom: 8 }}>A few clarifying questions</h1>
            <p className="t-body" style={{ marginBottom: 48, maxWidth: 540 }}>
              These are specific to your inputs — not generic questions.
            </p>
            {wizard.followUpQuestions.map((q, i) => (
              <div key={i} className="form-section" style={{ paddingTop: 32, paddingBottom: 32, borderTop: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--signal)', color: 'var(--signal-ink)', padding: '3px 7px', borderRadius: 3, flexShrink: 0 }}>
                    Q{i + 1}
                  </span>
                  <p style={{ fontWeight: 500, lineHeight: 1.5 }}>{q.question}</p>
                </div>
                {q.why_asked && (
                  <p className="t-small" style={{ marginBottom: 12, paddingLeft: 42, fontStyle: 'italic' }}>{q.why_asked}</p>
                )}
                <div className="field" style={{ paddingLeft: 42 }}>
                  <textarea
                    className="textarea"
                    value={wizard.followUpAnswers[i] ?? ''}
                    onChange={e => wizard.setFollowUpAnswer(i, e.target.value)}
                    placeholder="Your answer…"
                    rows={4}
                  />
                </div>
              </div>
            ))}
            {wizard.error && (
              <p style={{ color: 'var(--coral)', marginBottom: 16, fontSize: 14 }}>{wizard.error}</p>
            )}
            <div className="form-nav">
              <span />
              <Button
                variant="primary"
                size="lg"
                arrow
                onClick={submitFinalAnalysis}
                disabled={wizard.followUpAnswers.some(a => !a || a.trim().length < 3)}
              >
                Run final analysis
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Main wizard steps 0–7
  const currentStepConfig = FORM_STEPS[Math.min(step, FORM_STEPS.length - 1)]

  return (
    <>
      <ProgressBar step={step} total={totalSteps} />
      <TopNav />
      <div className="analyse-shell">
        <StepSidebar step={step} total={totalSteps} />

        <div style={{ padding: '64px 0 96px' }}>
          {/* Step 0: Setup */}
          {step === 0 && (
            <div>
              <p className="t-mono" style={{ marginBottom: 8 }}>00 / Setup</p>
              <h1 className="t-h2" style={{ marginBottom: 8 }}>Tell us about your project</h1>
              <p className="t-body" style={{ marginBottom: 40, maxWidth: 540 }}>
                {currentStepConfig.hint}
              </p>
              <div className="form-grid" style={{ display: 'grid', gap: 24 }}>
                <div className="field">
                  <label>Working title <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
                  <input
                    className="input"
                    value={formData.project_name}
                    onChange={e => setField('project_name', e.target.value)}
                    placeholder="e.g. NovaCore Bioscaffold"
                  />
                </div>
                <div className="field">
                  <label>Describe your research / technology *</label>
                  <textarea
                    className="textarea"
                    value={formData.research_area}
                    onChange={e => setField('research_area', e.target.value)}
                    placeholder="What have you built or discovered? What does it do and for whom?"
                    rows={5}
                  />
                </div>
                <div className="field">
                  <label>Stage</label>
                  <div className="stage-track">
                    {STAGES.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        className={`stage-pill${formData.stage_value === s.value ? ' selected' : ''}`}
                        onClick={() => { setField('stage_value', s.value); setField('stage_label', s.vc) }}
                      >
                        <div className="stage-pill-l">{s.vc}</div>
                        <div className="stage-pill-v">{s.researcher}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Team size *</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={500}
                    value={formData.team_size}
                    onChange={e => setField('team_size', e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Steps 1–5: Act D questions */}
          {step >= 1 && step <= 5 && (
            <div>
              <p className="t-mono" style={{ marginBottom: 8 }}>0{step} / Stress test</p>
              <h1 className="t-h2" style={{ marginBottom: 8 }}>{currentStepConfig.title}</h1>
              <p className="t-body" style={{ marginBottom: 40, maxWidth: 540 }}>{currentStepConfig.hint}</p>
              <div className="field">
                <label>Your answer *</label>
                <textarea
                  className="textarea"
                  value={formData[`q${step}_answer` as keyof typeof formData] as string}
                  onChange={e => setField(`q${step}_answer` as keyof typeof formData, e.target.value)}
                  placeholder={currentStepConfig.fields[0].placeholder}
                  rows={7}
                />
                <span className="count">{(formData[`q${step}_answer` as keyof typeof formData] as string).length} chars</span>
              </div>
            </div>
          )}

          {/* Step 6: Goal */}
          {step === 6 && (
            <div>
              <p className="t-mono" style={{ marginBottom: 8 }}>06 / Goal</p>
              <h1 className="t-h2" style={{ marginBottom: 8 }}>What are you trying to achieve?</h1>
              <p className="t-body" style={{ marginBottom: 32, maxWidth: 540 }}>
                This helps the analysis focus on the most relevant gaps for your current objective.
              </p>
              <div className="goal-grid" style={{ marginBottom: 24 }}>
                {GOAL_TYPES.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    className={`goal-pill${formData.goal_type === g.value ? ' selected' : ''}`}
                    onClick={() => setField('goal_type', g.value)}
                  >
                    <div className="gp-l">{g.label}</div>
                    <div className="gp-t">{g.description}</div>
                  </button>
                ))}
              </div>
              {formData.goal_type && (
                <div className="form-grid" style={{ display: 'grid', gap: 24 }}>
                  <div className="field">
                    <label>What does success look like? *</label>
                    <textarea
                      className="textarea"
                      value={formData.goal_quantification}
                      onChange={e => setField('goal_quantification', e.target.value)}
                      placeholder="e.g. Raise £500k at a £3m valuation, or Get into ICL Venture Catalyst cohort"
                      rows={3}
                    />
                  </div>
                  <div className="field">
                    <label>Why now? *</label>
                    <textarea
                      className="textarea"
                      value={formData.goal_rationale}
                      onChange={e => setField('goal_rationale', e.target.value)}
                      placeholder="What has changed or what deadline are you working towards?"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <div>
              <p className="t-mono" style={{ marginBottom: 8 }}>07 / Review</p>
              <h1 className="t-h2" style={{ marginBottom: 8 }}>Ready to run your analysis</h1>
              <p className="t-body" style={{ marginBottom: 40, maxWidth: 540 }}>
                Claude will identify gaps across five investor-readiness dimensions and ask 3–5 follow-up questions to sharpen the analysis.
              </p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-3)', padding: 24, marginBottom: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Project', value: formData.project_name || 'Untitled' },
                    { label: 'Stage', value: formData.stage_label },
                    { label: 'Team', value: `${formData.team_size} people` },
                    { label: 'Goal', value: GOAL_TYPES.find(g => g.value === formData.goal_type)?.label || '—' },
                  ].map(r => (
                    <div key={r.label}>
                      <span className="t-mono" style={{ display: 'block', marginBottom: 4 }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {wizard.error && (
                <p style={{ color: 'var(--coral)', marginBottom: 16, fontSize: 14 }}>{wizard.error}</p>
              )}
            </div>
          )}

          <div className="form-nav">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>← Back</Button>
            {step < 7 ? (
              <Button variant="primary" size="lg" onClick={next} arrow>Continue</Button>
            ) : (
              <Button variant="primary" size="lg" onClick={submitFirstPass} arrow>Run analysis</Button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .analyse-shell {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 64px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 64px 32px 96px;
        }
        .analyse-side { position: sticky; top: 100px; align-self: start; }
        .analyse-progress { display: flex; flex-direction: column; gap: 0; border-left: 1px solid var(--hairline); margin-top: 16px; }
        .analyse-step {
          display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: start;
          padding: 12px 0 12px 16px;
          border-left: 2px solid transparent; margin-left: -1px;
        }
        .analyse-step.active { border-left-color: var(--ink); }
        [data-theme="dark"] .analyse-step.active { border-left-color: var(--signal); }
        .analyse-step-num {
          font-family: var(--mono); font-size: 11px;
          width: 24px; height: 24px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--bg-2); color: var(--muted); font-weight: 600;
        }
        .analyse-step.active .analyse-step-num { background: var(--ink); color: var(--bg); }
        [data-theme="dark"] .analyse-step.active .analyse-step-num { background: var(--signal); color: var(--signal-ink); }
        .analyse-step.done .analyse-step-num { background: var(--signal); color: var(--signal-ink); }
        .analyse-step-label { font-size: 13px; color: var(--muted); padding-top: 3px; }
        .analyse-step.active .analyse-step-label { color: var(--ink); font-weight: 500; }
        .form-nav { display: flex; justify-content: space-between; padding-top: 32px; border-top: 1px solid var(--hairline); margin-top: 32px; }
        .stage-track { display: flex; gap: 4px; }
        .stage-pill { flex: 1; padding: 10px 6px; border: 1px solid var(--hairline); border-radius: var(--r-1); background: var(--surface); cursor: pointer; transition: all 0.15s; text-align: center; }
        .stage-pill.selected { border-color: var(--ink); background: var(--bg-2); }
        [data-theme="dark"] .stage-pill.selected { border-color: var(--signal); }
        .stage-pill-l { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .stage-pill-v { font-size: 12px; color: var(--ink); margin-top: 4px; font-weight: 500; }
        .goal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .goal-pill { padding: 16px; border: 1px solid var(--hairline); border-radius: var(--r-2); background: var(--surface); cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 6px; transition: all 0.15s; }
        .goal-pill:hover { border-color: var(--ink); }
        .goal-pill.selected { border-color: var(--ink); background: var(--bg-2); }
        [data-theme="dark"] .goal-pill.selected { border-color: var(--signal); background: var(--signal-soft); }
        .gp-l { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .gp-t { font-size: 14px; color: var(--ink); font-weight: 500; }
        @media (max-width: 900px) {
          .analyse-shell { grid-template-columns: 1fr !important; }
          .analyse-side { position: static !important; display: none; }
          .stage-track { flex-wrap: wrap; }
          .goal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
