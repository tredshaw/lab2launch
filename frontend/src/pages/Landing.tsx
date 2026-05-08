import TopNav from '../components/TopNav'
import Ticker from '../components/Ticker'
import Marquee from '../components/Marquee'
import Footer from '../components/Footer'
import Hero from '../sections/Hero'
import Problem from '../sections/Problem'
import ThreeActs from '../sections/ThreeActs'
import AnatomyOfGap from '../sections/AnatomyOfGap'
import LiveReportSection from '../sections/LiveReportSection'
import { landing } from '../content/landing'

// enabled: false removes a section silently — reorder array to reorder page
const SECTIONS = [
  { id: 'hero',         enabled: true, Component: Hero },
  { id: 'problem',      enabled: true, Component: Problem },
  { id: 'three-acts',   enabled: true, Component: ThreeActs },
  { id: 'anatomy',      enabled: true, Component: AnatomyOfGap },
  { id: 'live-report',  enabled: true, Component: LiveReportSection },
]

export default function Landing() {
  return (
    <>
      <TopNav />
      <Ticker items={landing.ticker.items} speed={landing.ticker.speed} />
      <main>
        {SECTIONS.filter(s => s.enabled).map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
      <Marquee label={landing.marquee.label} institutions={landing.marquee.institutions} />
      <Footer />
    </>
  )
}
