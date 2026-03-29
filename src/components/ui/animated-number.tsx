"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function AnimatedNumber({ value, duration = 1.5, className, suffix = "", prefix = "" }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, value, duration])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayValue.toLocaleString('fr-FR')}{suffix}
    </motion.span>
  )
}
