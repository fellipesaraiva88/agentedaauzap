import { motion } from "framer-motion";
import { Loader2, Wifi, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { WhatsAppStatus } from "@/hooks/useWhatsApp";

interface WhatsAppSyncGuardProps {
  status: WhatsAppStatus;
  showOverlay?: boolean;
  children?: React.ReactNode;
}

/**
 * Guard que bloqueia interações durante sincronização WhatsApp
 *
 * Estados:
 * - disconnected/failed: Overlay completo vermelho (crítico)
 * - connecting/qr_pending/pairing_pending: Overlay amarelo (aguardando)
 * - connected: Liberado (sem overlay)
 *
 * UX Pattern: Feedback progressivo sem bloquear visualização
 */
export function WhatsAppSyncGuard({ status, showOverlay = true, children }: WhatsAppSyncGuardProps) {
  const isBlocked = status !== 'connected';
  const isCritical = status === 'disconnected' || status === 'failed';

  if (!isBlocked) {
    return <>{children}</>;
  }

  const statusConfig = {
    connecting: {
      icon: Loader2,
      iconClass: "animate-spin text-yellow-500",
      title: "Conectando WhatsApp...",
      description: "Sincronizando histórico de conversas. Isso pode levar até 2 minutos.",
      progress: 30,
      variant: "warning" as const,
    },
    qr_pending: {
      icon: Wifi,
      iconClass: "animate-pulse text-blue-500",
      title: "Aguardando QR Code",
      description: "Escaneie o QR code nas Configurações para conectar",
      progress: 50,
      variant: "info" as const,
    },
    pairing_pending: {
      icon: Wifi,
      iconClass: "animate-pulse text-blue-500",
      title: "Aguardando Pareamento",
      description: "Digite o código de pareamento no WhatsApp do seu celular",
      progress: 70,
      variant: "info" as const,
    },
    disconnected: {
      icon: WifiOff,
      iconClass: "text-destructive",
      title: "WhatsApp Desconectado",
      description: "Conecte seu WhatsApp em Configurações para acessar conversas",
      progress: 0,
      variant: "destructive" as const,
    },
    failed: {
      icon: AlertCircle,
      iconClass: "text-destructive animate-pulse",
      title: "Falha na Conexão",
      description: "Erro ao conectar WhatsApp. Tente reconectar nas Configurações.",
      progress: 0,
      variant: "destructive" as const,
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;
  const Icon = config.icon;

  if (!showOverlay) {
    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className={`w-3 h-3 ${config.iconClass}`} />
        {config.title}
      </Badge>
    );
  }

  return (
    <div className="relative min-h-[400px]">
      {/* Children em background (blurred) */}
      <div className="filter blur-sm pointer-events-none opacity-30">
        {children}
      </div>

      {/* Overlay bloqueador */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-md"
      >
        <Card className={`max-w-md w-full mx-4 ${isCritical ? 'border-destructive/50' : 'border-yellow-500/50'}`}>
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon animado */}
            <motion.div
              animate={status === 'connecting' ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="flex justify-center"
            >
              <div className={`w-16 h-16 rounded-full ${isCritical ? 'bg-destructive/10' : 'bg-yellow-500/10'} flex items-center justify-center`}>
                <Icon className={`w-8 h-8 ${config.iconClass}`} />
              </div>
            </motion.div>

            {/* Título e descrição */}
            <div className="space-y-2">
              <h3 className="font-bold text-xl">{config.title}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>

            {/* Progress bar (apenas para estados em progresso) */}
            {!isCritical && (
              <div className="space-y-2">
                <Progress value={config.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {config.progress}% concluído
                </p>
              </div>
            )}

            {/* CTA */}
            {isCritical && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <a
                  href="/configuracoes"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ocean-blue text-white rounded-xl font-medium hover:bg-ocean-blue/90 transition-colors"
                >
                  Ir para Configurações
                </a>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Variante compacta para uso inline (ex: desabilitar botões)
 */
export function WhatsAppStatusBadge({ status }: { status: WhatsAppStatus }) {
  return <WhatsAppSyncGuard status={status} showOverlay={false} />;
}
