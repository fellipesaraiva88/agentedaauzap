import { forwardRef } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  pulse?: boolean; // Novo: efeito de pulso para CTA principal
}

/**
 * ModernButton - Botões LINDOS para o onboarding
 *
 * Features:
 * - Design moderno com gradientes suaves
 * - Animações smooth e microinterações deliciosas
 * - Efeitos de brilho e hover incríveis
 * - Visual profissional que não parece "genérico"
 */
export const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(
  (
    {
      variant = 'primary',
      size = 'lg',
      loading = false,
      icon: Icon,
      iconPosition = 'right',
      fullWidth = false,
      disabled,
      pulse = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles - fundação sólida
          'relative inline-flex items-center justify-center gap-2.5',
          'font-semibold tracking-wide',
          'rounded-xl', // Mais arredondado que o padrão
          'overflow-hidden', // Para efeitos de brilho
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          'group', // Para animações de hover

          // Variant styles - MODERNOS E BONITOS
          variant === 'primary' && [
            'bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-700',
            'text-white font-bold',
            'shadow-2xl shadow-ocean-500/40',
            'hover:shadow-ocean-500/60 hover:scale-[1.02]',
            'active:scale-[0.98]',
            'focus-visible:ring-ocean-400',
            // Efeito de brilho animado
            'before:absolute before:inset-0',
            'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
            'before:-translate-x-full before:transition-transform before:duration-1000',
            'hover:before:translate-x-full',
          ],

          variant === 'secondary' && [
            'bg-gradient-to-br from-gray-50 to-gray-100',
            'text-gray-800 font-medium',
            'border-2 border-gray-200',
            'shadow-lg shadow-gray-200/50',
            'hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200',
            'hover:border-gray-300 hover:shadow-xl',
            'hover:scale-[1.01]',
            'active:scale-[0.99]',
            'focus-visible:ring-gray-300',
          ],

          variant === 'success' && [
            'bg-gradient-to-br from-green-500 via-green-600 to-emerald-600',
            'text-white font-bold',
            'shadow-2xl shadow-green-500/40',
            'hover:shadow-green-500/60 hover:scale-[1.02]',
            'active:scale-[0.98]',
            'focus-visible:ring-green-400',
            // Efeito de brilho
            'before:absolute before:inset-0',
            'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
            'before:-translate-x-full before:transition-transform before:duration-1000',
            'hover:before:translate-x-full',
          ],

          variant === 'danger' && [
            'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
            'text-white font-bold',
            'shadow-2xl shadow-red-500/40',
            'hover:shadow-red-500/60 hover:scale-[1.02]',
            'active:scale-[0.98]',
            'focus-visible:ring-red-400',
          ],

          variant === 'outline' && [
            'bg-white',
            'text-ocean-700 font-medium',
            'border-2 border-ocean-300',
            'shadow-md shadow-ocean-100',
            'hover:bg-ocean-50 hover:border-ocean-400',
            'hover:shadow-lg hover:shadow-ocean-200',
            'hover:scale-[1.01]',
            'active:scale-[0.99]',
            'focus-visible:ring-ocean-300',
          ],

          variant === 'ghost' && [
            'bg-transparent text-gray-600',
            'hover:bg-gray-100 hover:text-gray-900',
            'active:bg-gray-200',
            'focus-visible:ring-gray-200',
          ],

          // Size styles - responsivos e confortáveis
          size === 'sm' && 'px-4 py-2 text-sm h-9',
          size === 'md' && 'px-6 py-2.5 text-base h-11',
          size === 'lg' && 'px-8 py-3.5 text-lg h-13', // Maior que antes
          size === 'xl' && 'px-10 py-4 text-xl h-16', // Bem destacado

          // Width
          fullWidth && 'w-full',

          // Pulse animation para CTAs principais
          pulse && !isDisabled && 'animate-pulse-subtle',

          // Custom className
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Shine overlay on hover */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Left Icon */}
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className={cn(
            'relative z-10 flex-shrink-0 transition-transform duration-200',
            'group-hover:scale-110',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-5 h-5',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6',
          )} />
        )}

        {/* Loading Spinner */}
        {loading && (
          <Loader2 className={cn(
            'relative z-10 animate-spin flex-shrink-0',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-5 h-5',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6',
          )} />
        )}

        {/* Text */}
        <span className="relative z-10 truncate">{children}</span>

        {/* Right Icon */}
        {Icon && iconPosition === 'right' && !loading && (
          <Icon className={cn(
            'relative z-10 flex-shrink-0 transition-transform duration-200',
            'group-hover:translate-x-1 group-hover:scale-110', // Move e aumenta no hover
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-5 h-5',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6',
          )} />
        )}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';
