import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Sparkles, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  organizationName?: string;
}

export function WelcomeStep({ onNext, organizationName }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ocean-blue/10 mb-4">
          <Sparkles className="w-8 h-8 text-ocean-blue" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Bem-vindo ao AuZap{organizationName && `, ${organizationName}`}!
        </h2>
        <p className="text-muted-foreground">
          Vamos configurar sua IA em poucos minutos
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Tempo estimado: 10-15 minutos</p>
            <p className="text-sm text-muted-foreground">
              Você pode pausar e voltar depois a qualquer momento
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">O que vamos configurar:</p>
            <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
              <li>Informações básicas do seu negócio</li>
              <li>O que torna seu petshop único</li>
              <li>Produtos e serviços oferecidos</li>
              <li>Personalidade da IA de atendimento</li>
              <li>Sistema BIPE de emergências</li>
              <li>Aurora Assistant (sua parceira de negócios)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-ocean-blue/5 border border-ocean-blue/20 rounded-lg p-4">
        <p className="text-sm">
          <span className="font-semibold text-ocean-blue">💡 Dica:</span> Quanto mais detalhes você fornecer,
          melhor a IA poderá atender seus clientes de forma personalizada!
        </p>
      </div>

      <OnboardingButton
        onClick={onNext}
        variant="primary"
        size="xl"
        icon={ArrowRight}
        iconPosition="right"
        fullWidth
      >
        Começar Configuração
      </OnboardingButton>
    </div>
  );
}
