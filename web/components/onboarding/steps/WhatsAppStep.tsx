import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Button } from '@/components/ui/button';
import { WahaSetupWizard } from '@/components/waha/WahaSetupWizard';
import { wahaService } from '@/services/waha.service';
import { ArrowRight, ArrowLeft, CheckCircle2, Smartphone, AlertCircle } from 'lucide-react';
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
 * WhatsApp Connection Step for Onboarding
 * Integrates WahaSetupWizard to guide user through WhatsApp connection
 *
 * Features:
 * - Check existing connection status
 * - Guide through WAHA setup wizard
 * - Validate connection before allowing next step
 * - Auto-save on connection success
 */
export function WhatsAppStep({ initialData, onSave, onNext, onBack }: WhatsAppStepProps) {
  const [saving, setSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [localInstanceId, setLocalInstanceId] = useState(initialData?.instanceId);

  // Check WhatsApp connection status
  const { data: instances, refetch: refetchInstances } = useQuery({
    queryKey: ['waha-instances'],
    queryFn: () => wahaService.listInstances(),
    refetchInterval: 5000, // Poll every 5s to detect connection
  });

  const connectedInstance = instances?.instances?.find(
    (inst) => inst.status === 'WORKING' || inst.status === 'connected'
  );

  const isConnected = !!connectedInstance;

  useEffect(() => {
    if (connectedInstance && !localInstanceId) {
      setLocalInstanceId(connectedInstance.id);
      handleAutoSave(connectedInstance.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedInstance]);

  const handleAutoSave = async (instanceId: string) => {
    setSaving(true);
    try {
      await onSave({
        instanceId,
        connected: true,
      });
      toast.success('WhatsApp conectado com sucesso!');
    } catch (error) {
      logger.error('[WhatsAppStep] Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleWizardComplete = async (instanceId: string) => {
    setLocalInstanceId(instanceId);
    setShowWizard(false);

    // Track WhatsApp connection success
    onboardingEvents.whatsappConnectSuccess('enhanced', 0); // timeToConnect can be tracked if needed

    // Save and auto-advance
    setSaving(true);
    const success = await onSave({
      instanceId,
      connected: true,
    });
    setSaving(false);

    if (success) {
      await refetchInstances();
      toast.success('WhatsApp configurado! Avançando para revisão...');
      setTimeout(() => onNext(), 1500);
    }
  };

  const handleNext = async () => {
    if (!isConnected) {
      toast.error('Vincule seu WhatsApp ou clique em "Vou vincular depois"');
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
      instanceId: '',
      connected: false,
    });
    setSaving(false);

    if (success) {
      toast.info('Você pode ativar o atendimento automático a qualquer momento no painel');
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Smartphone className="w-7 h-7 text-ocean-blue" />
          Ativar Atendimento Automático
        </h2>
        <p className="text-muted-foreground">
          Vincule seu WhatsApp comercial para a IA começar a responder seus clientes automaticamente
        </p>
      </div>

      {/* Connection Status Card */}
      {!showWizard && (
        <div className="space-y-4">
          {isConnected ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 text-lg mb-1">
                    ✅ Atendimento Automático ATIVO!
                  </h3>
                  <p className="text-green-700 text-sm mb-3">
                    Seu WhatsApp está pronto para responder clientes automaticamente
                  </p>
                  {connectedInstance && (
                    <div className="space-y-1 text-sm text-green-800">
                      <p>
                        <strong>WhatsApp:</strong>{' '}
                        {connectedInstance.phoneNumber || 'Detectando...'}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Respondendo clientes agora
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 text-lg mb-1">
                    Atendimento Ainda Não Ativo
                  </h3>
                  <p className="text-amber-700 text-sm mb-4">
                    Vincule seu WhatsApp comercial para a IA começar a atender
                  </p>
                  <Button
                    onClick={() => setShowWizard(true)}
                    className="bg-ocean-blue hover:bg-ocean-blue/90"
                    size="lg"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Vincular Agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              O que você ganha com isso:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Clientes atendidos automaticamente 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Agendamentos criados sem sua intervenção</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Você economiza 3+ horas por dia</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* WAHA Setup Wizard */}
      {showWizard && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <WahaSetupWizard
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      {!showWizard && (
        <div className="space-y-3 pt-4">
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
              {saving ? 'Salvando...' : 'Próximo'}
            </OnboardingButton>
          </div>

          {/* Skip Option - Only shown when NOT connected */}
          {!isConnected && (
            <Button
              variant="ghost"
              onClick={handleSkipForNow}
              disabled={saving}
              className="w-full text-sm h-auto py-2 text-muted-foreground hover:text-foreground"
            >
              Vou vincular depois, quero ver o sistema →
              <span className="block text-xs mt-0.5">
                (você pode ativar a qualquer momento)
              </span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
