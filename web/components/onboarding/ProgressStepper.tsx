import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  icon?: React.ReactNode;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function ProgressStepper({ steps, currentStep, onStepClick }: ProgressStepperProps) {
  return (
    <nav className="w-full py-6" aria-label="Progresso do onboarding">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div
          className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Passo ${currentStep} de ${steps.length}`}
        >
          <div
            className="h-full bg-ocean-blue transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <div
              key={step.number}
              role="button"
              tabIndex={isClickable ? 0 : -1}
              aria-label={`${step.title} - ${isCompleted ? 'Concluído' : isCurrent ? 'Atual' : 'Pendente'}`}
              aria-current={isCurrent ? 'step' : undefined}
              aria-disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-2',
                isClickable && 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 rounded-lg p-2'
              )}
              onClick={() => isClickable && onStepClick?.(step.number)}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onStepClick?.(step.number);
                }
              }}
            >
              {/* Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  'border-2',
                  isCompleted && 'bg-ocean-blue border-ocean-blue',
                  isCurrent && 'bg-white border-ocean-blue ring-4 ring-ocean-blue/20',
                  !isCompleted && !isCurrent && 'bg-muted border-muted-foreground/20'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : step.icon ? (
                  <div className={cn(
                    isCurrent ? 'text-ocean-blue' : 'text-muted-foreground'
                  )}>
                    {step.icon}
                  </div>
                ) : (
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent && 'text-ocean-blue',
                      isCompleted && 'text-white',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium text-center max-w-[80px]',
                  isCurrent && 'text-ocean-blue',
                  isCompleted && 'text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
