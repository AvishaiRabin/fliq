import { useState, useEffect } from 'react'

export function useCountUp(target: number, duration = 1200): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) return
    let startTime: number | null = null
    let frame: number

    function animate(ts: number) {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(parseFloat((eased * target).toFixed(1)))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return count
}
