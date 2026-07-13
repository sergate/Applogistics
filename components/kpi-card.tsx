'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { useEffect, useState } from 'react'
import { formatNumber, formatPercent } from '@/lib/constants'

interface KpiCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  isPercent?: boolean
  subtitle?: string
}

export function KpiCard({ title, value, icon: Icon, color, isPercent = false, subtitle }: KpiCardProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const target = value ?? 0
    const duration = 800
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayValue(target)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <Card ref={ref} variant="interactive" className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10" style={{ backgroundColor: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title ?? ''}</p>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color }}>
              {isPercent ? formatPercent(displayValue) : formatNumber(Math.round(displayValue))}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon size={20} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
