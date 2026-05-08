import { useEffect, useRef } from 'react'

export function useScrollFill(threshold = 0.3) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let triggered = false

    const trigger = () => {
      if (triggered) return
      triggered = true
      el.classList.add('in-view')
    }

    const fallback = setTimeout(trigger, 1500)

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) trigger() },
      { threshold },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [threshold])

  return ref
}
