import data from './landing.json'

type TagVariant = '' | 'coral' | 'teal' | 'signal' | 'amber'
type Priority = 'high' | 'med' | 'low'

export interface LandingContent {
  meta: { version: string; status: string; tagline: string }
  ticker: { speed: number; items: { variant: TagVariant; dot?: boolean; text: string }[] }
  hero: {
    eyebrow: { tag: string; variant: TagVariant }
    titlePre: string; titleEm: string; titlePost: string; lede: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
    meta: { label: string; value: string }[]
    sampleScore: {
      total: number; outOf: number; summary: string
      scores: { label: string; value: number; outOf: number }[]
    }
  }
  marquee: { label: string; institutions: string[] }
  problem: {
    number: string; label: string; titlePre: string; titleEm: string; description: string
    cells: { title: string; quote: string; attribution: string }[]
  }
  threeActs: {
    number: string; label: string; titlePre: string; titleEm: string; description: string
    acts: {
      letter: string; number: string; title: string; body: string; featured?: boolean
      bullets: { pop: string; text: string }[]
    }[]
  }
  anatomyOfGap: {
    number: string; label: string; titlePre: string; titleEm: string; description: string; caption: string
    rows: { dimension: string; pop: string; current: string; target: string; priority: Priority }[]
  }
  liveReport: {
    number: string; label: string; title: string; generatedDate: string
    stages: { num: string; title: string; description: string }[]
    scores: { label: string; value: number; outOf: number }[]
    overall: { value: number; outOf: number; label: string }
    actions: { text: string; priority: Priority }[]
    plainEnglish: string
  }
  popit: {
    number: string; label: string; titlePre: string; titleEm: string; description: string
    dimensions: { letter: string; name: string; description: string }[]
  }
  who: {
    number: string; label: string; titlePre: string; titleEm: string
    audiences: {
      role: string; tag: string; tagVariant: TagVariant; description: string; features: string[]
    }[]
  }
  cta: {
    titlePre: string; titleEm: string; body: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
    meta: string
  }
}

export const landing = data as unknown as LandingContent
