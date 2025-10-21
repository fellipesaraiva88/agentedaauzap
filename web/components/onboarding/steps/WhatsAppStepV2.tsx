import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Button } from '@/components/ui/button';
import { WahaSetupWizard } from '@/components/waha/WahaSetupWizard';
import { wahaService } from '@/services/waha.service';
import { ArrowRight, ArrowLeft, CheckCircle2, Smartphone, AlertCircle, Zap, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { onboardingEvents } from '@/lib/analytics';

interface WhatsAppStepProps {
  initialData?: {
    instanceId?: string;
    connected?: boolean;
  };
  onSave: (data: { instanceId: string; connected: boolean }) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

/**
 * WhatsApp Connection Step V2 - Simplified UX
 *
 * FILOSOFIA:
 * - "Ativar Atendimento Automático" (não "conectar instância")
 * - Usuário NÃO vê jargões técnicos (instância, sessão, WAHA)
 * - Foco em benefício: economia de tempo, atendimento 24/7
 *
 * FLUXO:
 * 1. Component monta → chama ensureInstance() automaticamente
 * 2. Se desconectado → mostra wizard de conexão
 * 3. Se conectado → mostra status + permite prosseguir
 * 4. Botão "Vou ativar depois" sempre disponível (não bloqueia onboarding)
 */
export function WhatsAppStepV2({ initialData, onSave, onNext, onBack }: WhatsAppStepProps) {
  const [saving, setSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [localInstanceId, setLocalInstanceId] = useState(initialData?.instanceId);

  // 1️⃣ Garantir que instância existe (idempotente)
  const { data: instanceData, refetch: refetchInstance } = useQuery({
    queryKey: ['whatsapp-ensure-instance'],
    queryFn: () => wahaService.ensureInstance(),
    staleTime: 0, // Sempre buscar status atualizado
    refetchInterval: 5000 // Poll a cada 5s para detectar conexão
  });

  const instance = instanceData?.instance;
  const isConnected = instance?.status === 'connected' || instance?.wahaStatus === 'WORKING';

  // Auto-set instanceId quando disponível
  useEffect(() => {
    if (instance && !localInstanceId) {
      setLocalInstanceId(instance.id);
    }
  }, [instance, localInstanceId]);

  // Auto-save quando conectar com sucesso
  useEffect(() => {
    if (isConnected && instance && !initialData?.connected) {
      handleAutoSave(instance.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleAutoSave = async (instanceId: string) => {
    setSaving(true);
    try {
      await onSave({
        instanceId,
        connected: true,
      });
      toast.success('🎉 Atendimento automático ativado com sucesso!');

      // Track WhatsApp connection success
      onboardingEvents.whatsappConnectSuccess('enhanced', 0);
    } catch (error) {
      logger.error('[WhatsAppStepV2] Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleWizardComplete = async (instanceId: string) => {
    setLocalInstanceId(instanceId);
    setShowWizard(false);

    // Track WhatsApp connection success
    onboardingEvents.whatsappConnectSuccess('enhanced', 0);

    // Save and auto-advance
    setSaving(true);
    const success = await onSave({
      instanceId,
      connected: true,
    });
    setSaving(false);

    if (success) {
      await refetchInstance();
      toast.success('🎉 Atendimento automático ativado! Avançando...');
      setTimeout(() => onNext(), 1500);
    }
  };

  const handleNext = async () => {
    if (!isConnected) {
      toast.error('Ative o atendimento automático ou clique em "Vou ativar depois"');
      return;
    }

    setSaving(true);
    const success = await onSave({
      instanceId: localInstanceId!,
      connected: true,
    });
    setSaving(false);

    if (success) {
      onNext();
    }
  };

  const handleSkipForNow = async () => {
    // Track WhatsApp skip (important metric!)
    onboardingEvents.whatsappSkipped('enhanced');

    setSaving(true);
    const success = await onSave({
      instanceId: instance?.id || '',
      connected: false,
    });
    setSaving(false);

    if (success) {
      toast.info('✅ Você pode ativar o atendimento automático a qualquer momento no painel');
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Foco em Benefício */}
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Zap className="w-7 h-7 text-amber-500" />
          Ative o Atendimento Automático
        </h2>
        <p className="text-muted-foreground text-lg">
          Seu WhatsApp vai responder clientes automaticamente, 24 horas por dia
        </p>
      </div>

      {/* Benefits Cards - Mostrar valor antes de pedir ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Clock className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-blue-900 mb-1">Economize 3+ horas por dia</h3>
          <p className="text-sm text-blue-700">
            IA responde perguntas frequentes automaticamente
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Users className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-purple-900 mb-1">Atendimento 24/7</h3>
          <p className="text-sm text-purple-700">
            Clientes atendidos mesmo fora do horário comercial
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-green-900 mb-1">Agendamentos automáticos</h3>
          <p className="text-sm text-green-700">
            IA cria agendamentos sem sua intervenção
          </p>
        </div>
      </div>

      {/* Connection Status Card */}
      {!showWizard && (
        <div className="space-y-4">
          {isConnected ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 text-xl mb-2 flex items-center gap-2">
                    ✅ Atendimento Automático ATIVO
                    <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-normal">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Online Agora
                    </span>
                  </h3>
                  <p className="text-green-700 mb-3">
                    Seu WhatsApp está respondendo clientes automaticamente. Você pode avançar para o próximo passo.
                  </p>
                  {instance?.phoneNumber && (
                    <div className="bg-white/50 rounded-lg p-3 space-y-1 text-sm">
                      <p>
                        <strong className="text-green-900">WhatsApp Conectado:</strong>{' '}
                        <span className="font-mono text-green-700">+{instance.phoneNumber}</span>
                      </p>
                      <p>
                        <strong className="text-green-900">Status:</strong>{' '}
                        <span className="text-green-700">Respondendo clientes automaticamente</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-amber-400 rounded-full p-3">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 text-xl mb-2">
                    Atendimento Ainda Não Ativo
                  </h3>
                  <p className="text-amber-700 mb-4">
                    Conecte seu WhatsApp comercial para a IA começar a responder seus clientes automaticamente
                  </p>
                  <Button
                    onClick={() => setShowWizard(true)}
                    className="bg-gradient-to-r from-ocean-blue to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 shadow-lg"
                    size="lg"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    Ativar Agora (2 minutos)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info Box - Como Funciona */}
          {!isConnected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Como funciona a conexão?
              </h4>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Você escolhe entre escanear QR Code (mais rápido) ou usar código de pareamento</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Abre o WhatsApp no seu celular e conecta em 30 segundos</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Pronto! A IA já está respondendo clientes automaticamente</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* WAHA Setup Wizard */}
      {showWizard && (
        <div className="border-2 border-ocean-blue rounded-xl p-6 bg-white shadow-lg">
          <WahaSetupWizard
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      {!showWizard && (
        <div className="space-y-3 pt-4 border-t">
          {/* Primary Actions */}
          <div className="flex gap-3">
            <OnboardingButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={onBack}
              icon={ArrowLeft}
              iconPosition="left"
            >
              Voltar
            </OnboardingButton>

            <OnboardingButton
              onClick={handleNext}
              variant="primary"
              size="lg"
              loading={saving}
              disabled={!isConnected || saving}
              icon={ArrowRight}
              iconPosition="right"
              fullWidth
            >
              {saving ? 'Salvando...' : 'Próximo: Revisar e Finalizar'}
            </OnboardingButton>
          </div>

          {/* Skip Option - SEMPRE visível (não bloqueia onboarding) */}
          {!isConnected && (
            <Button
              variant="ghost"
              onClick={handleSkipForNow}
              disabled={saving}
              className="w-full text-sm h-auto py-3 text-muted-foreground hover:text-foreground border border-dashed"
            >
              <div className="text-center">
                <div>Vou ativar depois, quero ver o sistema primeiro →</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  (você pode ativar a qualquer momento no painel - leva 2 minutos)
                </div>
              </div>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
