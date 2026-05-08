export const landing = {
  meta: {
    version: 'v0.3',
    status: 'Private beta',
    tagline: 'Bench → Balance sheet',
  },

  ticker: {
    speed: 60,
    items: [
      { variant: 'signal' as const, dot: true, text: 'Σ Live' },
      { variant: 'muted' as const, text: 'Avg readiness this week · 14.2 / 25' },
      { variant: 'teal' as const, dot: true, text: 'POPIT · People · 2.4 / 5' },
      { variant: 'amber' as const, dot: true, text: 'Most-cited gap · Market evidence' },
      { variant: 'muted' as const, text: 'Reports generated · 247' },
      { variant: 'coral' as const, dot: true, text: 'Top risk flagged · GMP scaling' },
      { variant: 'teal' as const, dot: true, text: 'Median time to first report · 22 min' },
      { variant: 'signal' as const, dot: true, text: 'Spinouts onboarded · 14 unis' },
      { variant: 'amber' as const, dot: true, text: 'Avg gap count · 3.2 dimensions' },
      { variant: 'muted' as const, text: 'v0.3 · Now in private beta' },
    ],
  },

  hero: {
    eyebrow: { tag: 'v0.3 · Private beta', variant: 'signal' as const },
    titlePre: 'The readiness instrument ',
    titleEm: 'for deep-tech ',
    titlePost: 'researchers.',
    lede: "Lab²Launch translates your science into investor-ready language and gives you a structured gap analysis on what's missing — across people, process, evidence, and execution.",
    primaryCta: { label: 'Run a free analysis', href: '/analyse' },
    secondaryCta: { label: 'See a sample report', href: '#sample' },
    meta: [
      { label: 'Built for', value: "Imperial · UCL · King's spinouts" },
      { label: 'Frameworks', value: 'POPIT · SWOT · Stakeholder' },
      { label: 'Output', value: 'One-page consultant brief' },
    ],
    sampleScore: {
      total: 15,
      outOf: 25,
      summary: 'Early-stage · investable with prep',
      scores: [
        { label: 'PROBLEM', value: 3, outOf: 5 },
        { label: 'MARKET', value: 3, outOf: 5 },
        { label: 'COMPETITION', value: 3, outOf: 5 },
        { label: 'TEAM', value: 4, outOf: 5 },
        { label: 'RISK', value: 3, outOf: 5 },
        { label: 'EVIDENCE', value: 2, outOf: 5 },
      ],
    },
  },

  marquee: {
    label: 'Calibrated against',
    institutions: [
      'Imperial College London', 'UCL', "King's College London",
      'University of Oxford', 'University of Cambridge',
      'EPFL', 'ETH Zürich', 'TU Delft',
    ],
  },

  problem: {
    number: '01',
    label: 'The problem',
    titlePre: 'You can read the paper. ',
    titleEm: "You can't write the deck.",
    description: "Most deep-tech founders are exceptional scientists and inexperienced operators. The investor pitch isn't a science problem — it's a translation problem. And every accelerator deadline punishes you for it.",
    cells: [
      {
        title: 'What investors hear',
        quote: "This is interesting science but I can't tell what they're selling, to whom, or why now.",
        attribution: '— Composite, 12 deep-tech VCs',
      },
      {
        title: 'What founders feel',
        quote: "I've spent six years on this. Why is the panel asking about TAM and pricing tiers?",
        attribution: '— Composite, 18 spinout founders',
      },
    ],
  },

  threeActs: {
    number: '02',
    label: 'How it works',
    titlePre: 'Three acts. ',
    titleEm: 'One clear picture.',
    description: 'Lab²Launch runs your inputs through BA frameworks — POPIT, SWOT, Stakeholder — and surfaces the gaps investors will find before they do.',
    acts: [
      {
        letter: '1',
        number: 'Act 1 · Stress test',
        title: 'Five adversarial questions',
        body: "You answer the questions every investor will ask. No softening, no scaffolding. We score your answers across five POPIT dimensions.",
        bullets: [
          { pop: 'P', text: 'Who is the buyer and what pain are you solving?' },
          { pop: 'O', text: 'What is your route to market?' },
          { pop: 'P', text: 'What does your team bring that others cannot replicate?' },
          { pop: 'I', text: 'What evidence exists that customers will pay?' },
          { pop: 'T', text: 'What risks have you not yet named?' },
        ],
      },
      {
        letter: '2',
        number: 'Act 2 · Analysis',
        title: 'Claude scores the gaps',
        body: "Our Claude-powered analysis engine scores your readiness across five dimensions. It identifies your strongest assets and names the specific gaps investors will press on.",
        bullets: [
          { pop: 'P', text: 'Problem clarity · Is the pain economic or safety-critical?' },
          { pop: 'M', text: 'Market evidence · Bottom-up TAM with customer discovery' },
          { pop: 'C', text: 'Competitive position · Genuine moat vs feature parity' },
          { pop: 'T', text: 'Team & execution · Right skills, governance, advisors' },
          { pop: 'R', text: 'Risk awareness · Sector-specific risks named and mitigated' },
        ],
        featured: true,
      },
      {
        letter: '3',
        number: 'Act 3 · Execution',
        title: 'Three sequenced actions',
        body: "You leave with a prioritised action list. Not generic advice — specific, testable steps ranked by investor impact, with a first action for this week.",
        bullets: [
          { pop: '1', text: 'Customer discovery: 10 conversations in 3 weeks' },
          { pop: '2', text: 'Competitive mapping: file the landscape before the pitch' },
          { pop: '3', text: "Governance: confirm IP assignment before the term sheet" },
        ],
      },
    ],
  },

  anatomyOfGap: {
    number: '03',
    label: 'The output',
    titlePre: 'Every gap has ',
    titleEm: 'a name and a fix.',
    description: 'The gap analysis is structured, not narrative. Each dimension shows where you are, where you need to be, and what to do first.',
    caption: "Sample · NovaCore Bioscaffold · v0.3",
    rows: [
      { dimension: 'P · Problem Clarity', pop: 'P', current: 'Pain described technically', target: 'Economic driver named, buyer identified', priority: 'high' as const },
      { dimension: 'M · Market Evidence', pop: 'M', current: 'Top-down TAM cited', target: 'Bottom-up build + 5 customer conversations', priority: 'high' as const },
      { dimension: 'C · Competition', pop: 'C', current: 'Incumbent products listed', target: 'Switching cost and moat articulated', priority: 'med' as const },
      { dimension: 'T · Team', pop: 'T', current: 'Academic pedigree strong', target: 'Commercial lead hired or committed', priority: 'med' as const },
      { dimension: 'R · Risk', pop: 'R', current: 'Regulatory pathway noted', target: 'GMP scaling risk named + mitigation plan', priority: 'low' as const },
    ],
  },

  liveReport: {
    number: '04',
    label: 'Sample report',
    title: 'Lab²Launch · NovaCore',
    generatedDate: '2026-05-07',
    stages: [
      {
        num: '01',
        title: 'Plain English summary',
        description: "A one-paragraph summary written for a school governor — no jargon, no acronyms. The kind of summary your PI's spouse should be able to understand.",
      },
      {
        num: '02',
        title: 'Your strongest assets',
        description: 'Three to five specific, defensible things your project has that matter to investors. Patent status, clinical data, regulatory designation, anchor customer.',
      },
      {
        num: '03',
        title: 'Five-dimension gap analysis',
        description: 'Scored /10 across Problem Clarity, Market Evidence, Competitive Position, Team & Execution, Risk Awareness. Each score comes with now/target/gap bullets.',
      },
      {
        num: '04',
        title: 'Top 3 sequenced actions',
        description: 'Ranked by investor impact. Each action has a deliverable, a timeline, and a specific first step for this week — no vague advice.',
      },
    ],
    scores: [
      { label: 'Problem', value: 7, outOf: 10 },
      { label: 'Market', value: 5, outOf: 10 },
      { label: 'Competition', value: 6, outOf: 10 },
      { label: 'Team', value: 8, outOf: 10 },
      { label: 'Risk', value: 4, outOf: 10 },
    ],
    overall: { value: 30, outOf: 50, label: 'Early-stage · investable with prep' },
    actions: [
      { text: 'Run 10 customer discovery calls in 3 weeks', priority: 'high' as const },
      { text: 'Build bottom-up TAM from hospital procurement data', priority: 'high' as const },
      { text: 'Name a commercial co-founder or fractional CCO', priority: 'med' as const },
    ],
    plainEnglish: "NovaCore has developed a bioscaffold material that helps bone heal faster after surgery. The science is strong — two published papers, a UK provisional patent, and early data from a sheep model. The gap is commercial: there is no clear buyer story, no evidence of what hospitals would pay, and the team has no one who has sold into an NHS procurement pathway before.",
  },

  popit: {
    number: '05',
    label: 'The methodology',
    titlePre: 'Five lenses. ',
    titleEm: 'One framework.',
    description: 'POPIT (People, Organisation, Process, Information, Technology) is the BA standard for change readiness. We run it invisibly inside every analysis.',
    dimensions: [
      { letter: 'P', name: 'People', description: 'Skills, knowledge, roles, culture, and the human capacity to execute on the commercial plan.' },
      { letter: 'O', name: 'Organisation', description: 'Structure, governance, legal entities, IP ownership, and the organisational readiness for investment.' },
      { letter: 'P', name: 'Process', description: 'Go-to-market routes, regulatory pathways, sales processes, and operational scalability.' },
      { letter: 'I', name: 'Information', description: 'Market data, customer evidence, competitive intelligence, and the factual basis for claims made to investors.' },
      { letter: 'T', name: 'Technology', description: 'IP position, technical differentiation, defensibility, and the link between science and commercial value.' },
    ],
  },

  who: {
    number: '06',
    label: 'Who it\'s for',
    titlePre: 'Built for the people ',
    titleEm: 'doing the work.',
    audiences: [
      {
        role: 'Academic researcher / PI',
        tag: 'Researcher',
        tagVariant: 'teal' as const,
        description: "You've published the paper. You have a provisional patent. You're about to apply to an accelerator and you've never written a pitch deck. Lab²Launch gives you the investor vocabulary for your science — without requiring you to learn a new discipline.",
        features: ['Gap analysis in 22 minutes', 'Plain English summary of your science', 'Actionable steps ranked by investor impact'],
      },
      {
        role: 'Deep-tech founder / CTO',
        tag: 'Founder',
        tagVariant: 'signal' as const,
        description: "You know the product. You're less sure about the narrative. Lab²Launch runs your inputs through the same BA frameworks a senior advisor would use — POPIT, SWOT, Stakeholder — and tells you exactly what's missing before you walk into the room.",
        features: ['Five-dimension investor readiness score', 'Identified assets and named gaps', 'Three sequenced actions with first-week steps'],
      },
    ],
  },

  cta: {
    titlePre: 'Stop guessing ',
    titleEm: 'what investors want.',
    body: "Run a free analysis in 22 minutes. Get a structured gap analysis, a plain-English summary of your science, and three specific actions ranked by investor impact.",
    primaryCta: { label: 'Run a free analysis', href: '/analyse' },
    secondaryCta: { label: 'See a sample report', href: '#sample' },
    meta: 'No account. No credit card. Results in under 30 minutes.',
  },
}

export type LandingContent = typeof landing
