export const STAGES = [
  { value: 1, vc: 'Pre-idea', researcher: 'Early concept' },
  { value: 2, vc: 'Pre-seed', researcher: 'Proof of concept' },
  { value: 3, vc: 'Seed', researcher: 'Early validation' },
  { value: 4, vc: 'Series A', researcher: 'Late validation' },
  { value: 5, vc: 'Series B', researcher: 'Early growth' },
  { value: 6, vc: 'Series C+', researcher: 'Scaling' },
]

export const GOAL_TYPES = [
  { value: 'seed_raise', label: 'Seed raise', description: 'Raise first external capital' },
  { value: 'accelerator', label: 'Accelerator application', description: 'Apply to Deeptech / ICL / UCL programmes' },
  { value: 'series_a', label: 'Series A readiness', description: 'Prepare for institutional round' },
  { value: 'grant', label: 'Grant / Innovate UK', description: 'Public funding application' },
  { value: 'spin_out', label: 'Spin-out formation', description: 'Create the company entity' },
  { value: 'partnership', label: 'Strategic partnership', description: 'Corporate or academic collaboration' },
  { value: 'other', label: 'Other', description: 'Something else' },
]

export const FORM_STEPS = [
  {
    step: 0,
    type: 'setup' as const,
    title: 'Tell us about your project',
    hint: "This gives the analysis engine context. The more specific you are, the more useful the output.",
    fields: [
      { id: 'project_name', label: 'Working title', type: 'text', placeholder: 'e.g. NovaCore Bioscaffold', required: false, hint: 'Optional — used to label your report' },
      { id: 'research_area', label: 'Describe your research / technology', type: 'textarea', placeholder: 'What have you built or discovered? What does it do and for whom?', required: true, minLength: 10 },
      { id: 'team_size', label: 'Team size', type: 'number', placeholder: '1', required: true },
    ],
  },
  {
    step: 1,
    type: 'question' as const,
    title: 'What problem does your science solve?',
    hint: "Investors fund solutions to specific, painful, measurable problems — not interesting science. Describe the pain, not the mechanism.",
    fields: [
      { id: 'q1_answer', label: 'Your answer', type: 'textarea', placeholder: "Who experiences this problem? How painful is it, in economic or safety terms? What happens to them if it isn't solved?", required: true, minLength: 5 },
    ],
  },
  {
    step: 2,
    type: 'question' as const,
    title: 'Who will pay, and how much?',
    hint: "A market isn't a number — it's a buyer. Name the specific organisation, person, or role that will write the cheque.",
    fields: [
      { id: 'q2_answer', label: 'Your answer', type: 'textarea', placeholder: "Who is the first buyer? What is their budget cycle? What is the realistic price point and why?", required: true, minLength: 5 },
    ],
  },
  {
    step: 3,
    type: 'question' as const,
    title: 'Why can\'t someone replicate this in 18 months?',
    hint: "Competitive moats in deep tech are usually: IP, data, regulatory exclusivity, or a physical process that takes years to develop. Which is yours?",
    fields: [
      { id: 'q3_answer', label: 'Your answer', type: 'textarea', placeholder: "What is genuinely hard to copy? Patents filed? Proprietary data? Regulatory exclusivity? A process that took 6 years?", required: true, minLength: 5 },
    ],
  },
  {
    step: 4,
    type: 'question' as const,
    title: 'What does your team bring that no one else has?',
    hint: "Domain expertise is table stakes. Investors want to know whether this team has the commercial skills to execute — not just the scientific skills to invent.",
    fields: [
      { id: 'q4_answer', label: 'Your answer', type: 'textarea', placeholder: "What's the team's commercial track record? Who is handling sales, operations, regulatory? What advisors are committed?", required: true, minLength: 5 },
    ],
  },
  {
    step: 5,
    type: 'question' as const,
    title: 'What is the most likely reason this fails?',
    hint: "Every investor has already thought of three ways your startup could fail. The ones who name the risks themselves get taken more seriously than the ones who avoid them.",
    fields: [
      { id: 'q5_answer', label: 'Your answer', type: 'textarea', placeholder: "What are the top 2-3 risks? Regulatory? GMP scaling? Key person dependency? What are you doing about each?", required: true, minLength: 5 },
    ],
  },
]

export interface FormData {
  project_name: string
  research_area: string
  team_size: string
  stage_value: number
  stage_label: string
  goal_type: string
  goal_quantification: string
  goal_rationale: string
  q1_answer: string
  q2_answer: string
  q3_answer: string
  q4_answer: string
  q5_answer: string
}

export const INITIAL_FORM_DATA: FormData = {
  project_name: '',
  research_area: '',
  team_size: '1',
  stage_value: 2,
  stage_label: 'Pre-seed',
  goal_type: '',
  goal_quantification: '',
  goal_rationale: '',
  q1_answer: '',
  q2_answer: '',
  q3_answer: '',
  q4_answer: '',
  q5_answer: '',
}
