import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ModernButton } from '@/components/onboarding/ModernButton';
import { wahaService } from '@/services/waha.service';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  AlertCircle,
  Zap,
  QrCode,
  Hash,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { onboardingEvents } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface WhatsAppStepModernProps {
  initialData?: {
    instanceId?: string;
    connected?: boolean;
  };
  onSave: (data: { instanceId: string; connected: boolean }) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

/**
 * WhatsApp Step MODERNO E NATIVO
 * Parece 100% parte do sistema AuZap, não um iframe externo!
 *
 * Features:
 * - Design nativo e integrado
 * - QR Code/Pairing Code estilizados
 * - Animações suaves
 * - Estado de conexão em tempo real
 * - Visual profissional
 */
export function WhatsAppStepModern({ initialData, onSave, onNext, onBack }: WhatsAppStepModernProps) {
  const [saving, setSaving] = useState(false);
  const [showConnectionFlow, setShowConnectionFlow] = useState(false);
  const [authMethod, setAuthMethod] = useState<'pairing_code' | 'qr_code'>('pairing_code');
  const [instanceId, setInstanceId] = useState(initialData?.instanceId);
  const [pairingCode, setPairingCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Check WhatsApp connection status
  const { data: instances, refetch: refetchInstances } = useQuery({
    queryKey: ['waha-instances'],
    queryFn: () => wahaService.listInstances(),
    refetchInterval: 5000, // Poll every 5s
  });

  const connectedInstance = instances?.instances?.find(
    (inst) => inst.status === 'WORKING' || inst.status === 'connected'
  );

  const isConnected = !!connectedInstance;

  useEffect(() => {
    if (connectedInstance && !instanceId) {
      setInstanceId(connectedInstance.id);
      handleAutoSave(connectedInstance.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedInstance]);

  const handleAutoSave = async (id: string) => {
    setSaving(true);
    try {
      await onSave({ instanceId: id, connected: true });
      toast.success('WhatsApp conectado com sucesso! 🎉');
      onboardingEvents.whatsappConnectSuccess('enhanced', 0);
    } catch (error) {
      logger.error('[WhatsApp] Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartConnection = async () => {
    setIsCreating(true);
    try {
      const response = await wahaService.createInstance({
        authMethod,
        phoneNumber: authMethod === 'pairing_code' ? undefined : undefined,
      });

      if (response.success) {
        // ✅ FIX: Validate instanceId before setting
        if (!response.instanceId || response.instanceId === 'undefined') {
          toast.error('Erro: ID de instância inválido');
          return;
        }

        setInstanceId(response.instanceId);
        setPairingCode(response.pairingCode || '');
        setQrCode(response.qrCode || '');
        setShowConnectionFlow(true);
        toast.success('Pronto! Agora conecte seu WhatsApp');
      } else {
        toast.error(response.error || 'Erro ao criar instância');
      }
    } catch (error) {
      toast.error('Erro ao iniciar conexão');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!instanceId) return;

    try {
      if (authMethod === 'qr_code') {
        const response = await wahaService.regenerateQRCode(instanceId);
        if (response.success && response.qrCode) {
          setQrCode(response.qrCode);
          toast.success('Novo QR Code gerado!');
        }
      } else {
        const response = await wahaService.regeneratePairingCode(instanceId);
        if (response.success && response.pairingCode) {
          setPairingCode(response.pairingCode);
          toast.success('Novo código gerado!');
        }
      }
    } catch (error) {
      toast.error('Erro ao gerar novo código');
    }
  };

  const handleNext = async () => {
    if (!isConnected) {
      toast.error('Vincule seu WhatsApp ou clique em "Vou vincular depois"');
      return;
    }

    setSaving(true);
    const success = await onSave({ instanceId: instanceId!, connected: true });
    setSaving(false);

    if (success) {
      onNext();
    }
  };

  const handleSkip = async () => {
    onboardingEvents.whatsappSkipped('enhanced');

    setSaving(true);
    const success = await onSave({ instanceId: '', connected: false });
    setSaving(false);

    if (success) {
      toast.info('Você pode ativar o WhatsApp a qualquer momento');
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Ativar Atendimento Automático
        </h2>
        <p className="text-gray-600 text-lg">
          Vincule seu WhatsApp e deixe a IA responder seus clientes automaticamente
        </p>
      </div>

      {/* Status Cards */}
      {!showConnectionFlow && !isConnected && (
        <div className="space-y-6">
          {/* Call to Action Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 shadow-xl">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900">
                Pronto para Automatizar?
              </h3>
              <p className="text-green-700 text-lg max-w-xl mx-auto">
                Conecte seu WhatsApp comercial e a IA Aurora vai começar a atender seus clientes 24/7
              </p>

              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                <button
                  onClick={() => setAuthMethod('pairing_code')}
                  className={cn(
                    'relative p-6 rounded-xl border-2 transition-all duration-200',
                    'hover:shadow-lg hover:scale-105',
                    authMethod === 'pairing_code'
                      ? 'border-green-500 bg-green-100 shadow-lg scale-105'
                      : 'border-gray-300 bg-white hover:border-green-300'
                  )}
                >
                  {/* Badge RECOMENDADO */}
                  <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    RECOMENDADO
                  </div>

                  <Hash className={cn(
                    'w-10 h-10 mx-auto mb-3',
                    authMethod === 'pairing_code' ? 'text-green-600' : 'text-gray-400'
                  )} />
                  <p className={cn(
                    'font-bold text-lg',
                    authMethod === 'pairing_code' ? 'text-green-900' : 'text-gray-600'
                  )}>
                    Código de Pareamento
                  </p>
                  <p className="text-xs text-gray-500 mt-1">✨ Mais rápido e confiável</p>
                </button>

                <button
                  onClick={() => setAuthMethod('qr_code')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all duration-200',
                    'hover:shadow-lg hover:scale-105',
                    authMethod === 'qr_code'
                      ? 'border-green-500 bg-green-100 shadow-lg scale-105'
                      : 'border-gray-300 bg-white hover:border-green-300'
                  )}
                >
                  <QrCode className={cn(
                    'w-8 h-8 mx-auto mb-3',
                    authMethod === 'qr_code' ? 'text-green-600' : 'text-gray-400'
                  )} />
                  <p className={cn(
                    'font-semibold',
                    authMethod === 'qr_code' ? 'text-green-900' : 'text-gray-600'
                  )}>
                    QR Code
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Alternativa</p>
                </button>
              </div>

              <ModernButton
                onClick={handleStartConnection}
                variant="success"
                size="xl"
                loading={isCreating}
                icon={Sparkles}
                iconPosition="left"
                pulse
                className="mt-6"
              >
                Conectar Agora
              </ModernButton>
            </div>
          </div>

          {/* Benefits Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              O que você ganha:
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: CheckCircle2, text: 'Atendimento 24/7' },
                { icon: CheckCircle2, text: 'Agendamentos automáticos' },
                { icon: CheckCircle2, text: 'Economize 3h+ por dia' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2 text-blue-800">
                  <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connection Flow - NATIVO */}
      {showConnectionFlow && !isConnected && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-green-300 rounded-2xl p-8 shadow-xl">
            <div className="text-center space-y-6">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse">
                <Smartphone className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                {authMethod === 'pairing_code' ? '📱 Digite o Código no WhatsApp' : '📷 Escaneie o QR Code'}
              </h3>

              {authMethod === 'pairing_code' && pairingCode && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    No seu WhatsApp: <strong>Configurações → Aparelhos Conectados → Conectar Aparelho</strong>
                  </p>

                  {/* Pairing Code Display - NATIVO */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-8 shadow-lg">
                    <p className="text-sm text-gray-600 mb-3">Digite este código:</p>
                    <div className="text-6xl font-mono font-bold text-green-600 tracking-widest">
                      {pairingCode}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">O código expira em 60 segundos</p>
                  </div>

                  <ModernButton
                    onClick={handleRegenerateCode}
                    variant="outline"
                    size="md"
                    icon={RefreshCw}
                  >
                    Gerar Novo Código
                  </ModernButton>
                </div>
              )}

              {authMethod === 'qr_code' && qrCode && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    No seu WhatsApp: <strong>Configurações → Aparelhos Conectados → Conectar Aparelho</strong>
                  </p>

                  {/* QR Code Display - NATIVO */}
                  <div className="bg-white border-2 border-green-400 rounded-xl p-8 shadow-xl inline-block">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-4">O QR Code expira em 60 segundos</p>
                  </div>

                  <ModernButton
                    onClick={handleRegenerateCode}
                    variant="outline"
                    size="md"
                    icon={RefreshCw}
                  >
                    Gerar Novo QR Code
                  </ModernButton>
                </div>
              )}

              {/* Loading State */}
              <div className="flex items-center justify-center gap-3 text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <p className="text-sm">Aguardando conexão...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected State */}
      {isConnected && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-green-900 mb-2">
                🎉 Atendimento Automático ATIVO!
              </h3>
              <p className="text-green-700 text-lg mb-4">
                Seu WhatsApp está conectado e a IA já está respondendo clientes automaticamente
              </p>
              {connectedInstance && (
                <div className="space-y-2 text-green-800">
                  <p className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    <strong>WhatsApp:</strong> {connectedInstance.phoneNumber || 'Detectando...'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <strong>Status:</strong> Respondendo clientes agora
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!showConnectionFlow && (
        <div className="flex gap-4 pt-6">
          <ModernButton
            onClick={onBack}
            variant="secondary"
            size="lg"
            icon={ArrowLeft}
            iconPosition="left"
          >
            Voltar
          </ModernButton>

          {isConnected ? (
            <ModernButton
              onClick={handleNext}
              variant="success"
              size="lg"
              loading={saving}
              icon={ArrowRight}
              fullWidth
            >
              Continuar
            </ModernButton>
          ) : (
            <ModernButton
              onClick={handleSkip}
              variant="ghost"
              size="lg"
              loading={saving}
              fullWidth
            >
              Vou vincular depois →
              <span className="block text-xs mt-1">
                (você pode ativar a qualquer momento)
              </span>
            </ModernButton>
          )}
        </div>
      )}
    </div>
  );
}
