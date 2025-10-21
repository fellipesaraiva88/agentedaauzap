'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent } from './card'
import { Body, Heading } from './typography'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  isLoading?: boolean
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

const variantStyles = {
  default: 'border-border bg-card',
  primary: 'border-primary/20 bg-primary/5',
  success: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
  warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950',
  error: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
}

const iconColors = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      change,
      changeLabel,
      icon: Icon,
      variant = 'default',
      isLoading = false,
      prefix = '',
      suffix = '',
      decimals = 0,
      className,
    },
    ref
  ) => {
    const isNumeric = typeof value === 'number'

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className={cn('h-full', className)}
      >
        <Card
          className={cn(
            'h-full transition-all duration-200',
            variantStyles[variant],
            'hover:shadow-lg'
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Body variant="muted" size="sm" className="mb-2">
                  {title}
                </Body>
                <div className="flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-9 w-24 animate-pulse rounded bg-muted" />
                  ) : (
                    <>
                      {isNumeric ? (
                        <Heading size="lg" className="font-bold">
                          {prefix}
                          <CountUp
                            end={value as number}
                            decimals={decimals}
                            duration={1.5}
                            separator=","
                          />
                          {suffix}
                        </Heading>
                      ) : (
                        <Heading size="lg" className="font-bold">
                          {value}
                        </Heading>
                      )}
                    </>
                  )}
                </div>
                {(change !== undefined || changeLabel) && (
                  <div className="mt-2 flex items-center gap-2">
                    {change !== undefined && (
                      <Body
                        size="sm"
                        variant={change > 0 ? 'success' : change < 0 ? 'error' : 'muted'}
                        weight="medium"
                      >
                        {change > 0 ? '+' : ''}
                        {change}%
                      </Body>
                    )}
                    {changeLabel && (
                      <Body size="sm" variant="muted">
                        {changeLabel}
                      </Body>
                    )}
                  </div>
                )}
              </div>
              {Icon && (
                <div
                  className={cn(
                    'rounded-lg bg-background/50 p-3',
                    iconColors[variant]
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
)
MetricCard.displayName = 'MetricCard'

export interface MetricGridProps {
  children: React.ReactNode
  className?: string
}

export const MetricGrid = React.forwardRef<HTMLDivElement, MetricGridProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
          className
        )}
      >
        {children}
      </div>
    )
  }
)
MetricGrid.displayName = 'MetricGrid'
