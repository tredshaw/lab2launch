import React from 'react'
import TopNav from '../components/TopNav'
import Footer from '../components/Footer'

// Sections are imported here once built — enabled: false removes them safely
const SECTIONS: { id: string; enabled: boolean; Component: () => React.ReactElement }[] = []

export default function Landing() {
  return (
    <>
      <TopNav />
      <main>
        {SECTIONS.filter(s => s.enabled).map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
      <Footer />
    </>
  )
}
