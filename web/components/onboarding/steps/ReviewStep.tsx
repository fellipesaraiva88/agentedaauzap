import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Building, Star, Package, Bot, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import type { OnboardingProgress } from '@/services/onboarding.service';

interface ReviewStepProps {
  progress: OnboardingProgress | null;
  onComplete: () => void;
  onBack: () => void;
  saving: boolean;
}

export function ReviewStep({ progress, onComplete, onBack, saving }: ReviewStepProps) {
  const data = progress?.collectedData;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">🎉 Tudo Pronto!</h2>
        <p className="text-muted-foreground">
          Confira como sua IA ficou configurada
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Info */}
        {data?.businessInfo && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Informações do Negócio</h3>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Nome:</strong> {data.businessInfo.name}</p>
                  <p><strong>Endereço:</strong> {data.businessInfo.address}</p>
                  <p><strong>Telefone:</strong> {data.businessInfo.phone}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Differentiation */}
        {data?.differentiation && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Diferenciação</h3>
                <div className="text-sm space-y-2">
                  {data.differentiation.uniqueValueProposition && (
                    <p className="text-muted-foreground">
                      {data.differentiation.uniqueValueProposition}
                    </p>
                  )}
                  {data.differentiation.competitiveDifferentiators && (
                    <div className="flex flex-wrap gap-1">
                      {data.differentiation.competitiveDifferentiators.map((diff, i) => (
                        <Badge key={i} variant="secondary">{diff}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Products & Services */}
        {data?.productsServices && data.productsServices.length > 0 && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Produtos e Serviços</h3>
                <div className="flex flex-wrap gap-1">
                  {data.productsServices.map((service, i) => (
                    <Badge key={i} variant="outline">{service}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* AI Personality */}
        {data?.aiPersonality && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Personalidade da IA</h3>
                <div className="text-sm space-y-1">
                  <div className="flex gap-2">
                    <Badge variant="secondary">Tom: {data.aiPersonality.tone}</Badge>
                    <Badge variant="secondary">Emojis: {data.aiPersonality.emojiUsage}</Badge>
                    <Badge variant="secondary">
                      {data.aiPersonality.brazilianSlang ? 'Tom Brasileiro' : 'Tom Neutro'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* BIPE Config */}
        {data?.bipeConfig && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">BIPE - Emergências</h3>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Responsável:</strong> {data.bipeConfig.responsibleName}</p>
                  <p><strong>Telefone:</strong> +55 {data.bipeConfig.phoneNumber}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Aurora Config */}
        {data?.auroraConfig && data.auroraConfig.authorizedNumbers && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-ocean-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Aurora Assistant</h3>
                <div className="text-sm space-y-1">
                  {data.auroraConfig.authorizedNumbers.map((num, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {num.name} - +55 {num.phone}
                      </span>
                      {num.isPrimary && <Badge variant="secondary">Principal</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Call to Action Card */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-500/30">
        <div className="p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-green-900 mb-2">
              O que acontece agora?
            </h3>
            <div className="text-sm text-green-800 space-y-2 max-w-md mx-auto">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Sua IA vai começar a responder clientes automaticamente
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Você recebe notificação em caso de emergência
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Pode ajustar qualquer configuração depois
              </p>
            </div>
          </div>

          <OnboardingButton
            onClick={onComplete}
            variant="success"
            size="xl"
            loading={saving}
            disabled={saving}
            icon={Sparkles}
            iconPosition="left"
            fullWidth
          >
            {saving ? 'Ativando...' : 'Ativar Atendimento Automático'}
          </OnboardingButton>

          <OnboardingButton
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={saving}
            size="md"
            icon={ArrowLeft}
            iconPosition="left"
            fullWidth
          >
            Voltar e revisar
          </OnboardingButton>
        </div>
      </Card>
    </div>
  );
}
