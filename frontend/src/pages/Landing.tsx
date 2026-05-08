import TopNav from '../components/TopNav'
import Ticker from '../components/Ticker'
import Footer from '../components/Footer'
import Hero from '../sections/Hero'
import { landing } from '../content/landing'

// Add sections here as they're built. enabled: false removes silently.
const SECTIONS = [
  { id: 'hero', enabled: true, Component: Hero },
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
      <Footer />
    </>
  )
}
