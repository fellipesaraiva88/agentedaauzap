import { forwardRef } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * OnboardingButton - Consistent button component for onboarding flows
 *
 * Features:
 * - 5 semantic variants (primary, secondary, success, danger, ghost)
 * - 4 responsive sizes with mobile optimization
 * - Rich visual states (hover, active, disabled, loading, focus)
 * - Accessibility built-in (aria-labels, focus rings, disabled states)
 * - Smooth animations and microinteractions
 */
export const OnboardingButton = forwardRef<HTMLButtonElement, OnboardingButtonProps>(
  (
    {
      variant = 'primary',
      size = 'lg',
      loading = false,
      icon: Icon,
      iconPosition = 'right',
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Microinteraction styles - subtle but delightful feedback
    const microInteractionStyles = cn(
      // Hover lift effect for primary actions
      (variant === 'primary' || variant === 'success') && 'hover:-translate-y-0.5',
      // Smooth transitions for all interactive states
      'transition-all duration-200 ease-out',
      // Scale on active press (already in variants but ensuring consistency)
      'active:transition-transform active:duration-75',
      // Focus ring with smooth transition
      'focus-visible:transition-all focus-visible:duration-150',
      // Icon animation on hover
      'group'
    );

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-semibold',
          'rounded-lg',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          'disabled:transform-none', // Prevent transform on disabled state

          // Microinteractions
          microInteractionStyles,

          // Variant styles
          variant === 'primary' && [
            'bg-gradient-to-r from-ocean-500 to-ocean-600',
            'text-white shadow-lg shadow-ocean-500/30',
            'hover:shadow-xl hover:shadow-ocean-500/40 hover:from-ocean-600 hover:to-ocean-700',
            'active:scale-[0.98] active:shadow-md',
            'focus-visible:ring-ocean-500/50',
          ],
          variant === 'secondary' && [
            'bg-white border-2 border-ocean-200',
            'text-ocean-700 shadow-sm',
            'hover:bg-ocean-50 hover:border-ocean-300 hover:shadow-md',
            'active:scale-[0.98] active:bg-ocean-100',
            'focus-visible:ring-ocean-500/30',
          ],
          variant === 'success' && [
            'bg-gradient-to-r from-green-500 to-green-600',
            'text-white shadow-lg shadow-green-500/30',
            'hover:shadow-xl hover:shadow-green-500/40 hover:from-green-600 hover:to-green-700',
            'active:scale-[0.98] active:shadow-md',
            'focus-visible:ring-green-500/50',
          ],
          variant === 'danger' && [
            'bg-gradient-to-r from-red-500 to-red-600',
            'text-white shadow-lg shadow-red-500/30',
            'hover:shadow-xl hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700',
            'active:scale-[0.98] active:shadow-md',
            'focus-visible:ring-red-500/50',
          ],
          variant === 'ghost' && [
            'bg-transparent text-muted-foreground',
            'hover:bg-muted hover:text-foreground',
            'active:bg-muted/80',
            'focus-visible:ring-muted-foreground/30',
          ],

          // Size styles - responsive
          size === 'sm' && 'px-4 py-2 text-sm h-9',
          size === 'md' && 'px-5 py-2.5 text-base h-10 md:h-11',
          size === 'lg' && 'px-6 py-3 text-base h-11 md:h-12 md:text-lg',
          size === 'xl' && 'px-8 py-4 text-lg h-13 md:h-14 md:text-xl',

          // Width
          fullWidth && 'w-full',

          // Custom className
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Left Icon */}
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className={cn(
            'flex-shrink-0 transition-transform',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-4 h-4 md:w-5 md:h-5',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6',
          )} />
        )}

        {/* Loading Spinner */}
        {loading && (
          <Loader2 className={cn(
            'animate-spin flex-shrink-0',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-4 h-4 md:w-5 md:h-5',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6',
          )} />
        )}

        {/* Text */}
        <span className="truncate">{children}</span>

        {/* Right Icon */}
        {Icon && iconPosition === 'right' && !loading && (
          <Icon className={cn(
            'flex-shrink-0 transition-transform duration-200',
            'group-hover:translate-x-1', // Subtle arrow movement
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-4 h-4 md:w-5 md:h-5',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6',
          )} />
        )}
      </button>
    );
  }
);

OnboardingButton.displayName = 'OnboardingButton';
