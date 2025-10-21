import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const displayVariants = cva('font-bold tracking-tight', {
  variants: {
    variant: {
      default: 'text-foreground',
      gradient: 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
    },
    size: {
      sm: 'text-2xl md:text-3xl',
      default: 'text-3xl md:text-4xl lg:text-5xl',
      lg: 'text-4xl md:text-5xl lg:text-6xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface DisplayProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof displayVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
}

const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ className, variant, size, as: Comp = 'h1', ...props }, ref) => {
    return (
      <Comp
        className={cn(displayVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Display.displayName = 'Display'

const headingVariants = cva('font-semibold tracking-tight', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
    },
    size: {
      sm: 'text-lg md:text-xl',
      default: 'text-xl md:text-2xl lg:text-3xl',
      lg: 'text-2xl md:text-3xl lg:text-4xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, size, as: Comp = 'h2', ...props }, ref) => {
    return (
      <Comp
        className={cn(headingVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = 'Heading'

const bodyVariants = cva('', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
    },
    size: {
      sm: 'text-sm',
      default: 'text-base',
      lg: 'text-lg',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    weight: 'normal',
  },
})

export interface BodyProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof bodyVariants> {
  as?: 'p' | 'span' | 'div'
}

const Body = React.forwardRef<HTMLParagraphElement, BodyProps>(
  ({ className, variant, size, weight, as: Comp = 'p', ...props }, ref) => {
    return (
      <Comp
        className={cn(bodyVariants({ variant, size, weight, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Body.displayName = 'Body'

export { Display, Heading, Body, displayVariants, headingVariants, bodyVariants }
