import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ArrowLeft, AlertTriangle, Phone, Info } from 'lucide-react';

const schema = z.object({
  phoneNumber: z.string().regex(/^\d{10,11}$/, 'Formato: 11999999999 (sem símbolos)'),
  responsibleName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres')
});

type FormData = z.infer<typeof schema>;

interface BipeConfigStepProps {
  initialData?: FormData;
  onSave: (data: FormData) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

export function BipeConfigStep({ initialData, onSave, onNext, onBack }: BipeConfigStepProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const success = await onSave(data);
    setSaving(false);
    if (success) onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          🚨 Alertas de Emergência
        </h2>
        <p className="text-muted-foreground">
          Se um cliente mencionar emergência, você recebe alerta IMEDIATO no WhatsApp
        </p>
      </div>

      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Info className="w-4 h-4 text-amber-500" />
        <AlertDescription>
          <strong>Como funciona:</strong>
          <br />
          <span className="text-sm">
            Cliente diz: <em>"Meu cachorro está sangrando"</em> → Você recebe notificação instantânea no WhatsApp com o contato dele.
            A IA para de responder e espera você assumir.
          </span>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-ocean-blue" />
            Seu WhatsApp para Receber Alertas
          </Label>
          <p className="text-sm text-muted-foreground">
            Você recebe uma mensagem instantânea quando houver emergência
          </p>
          <Input
            id="phoneNumber"
            {...register('phoneNumber')}
            placeholder="11999999999"
            errorText={errors.phoneNumber?.message}
          />
          <p className="text-xs text-muted-foreground">
            Formato: DDD + número (apenas números, sem espaços ou símbolos)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleName">
            Nome do Responsável
          </Label>
          <Input
            id="responsibleName"
            {...register('responsibleName')}
            placeholder="Maria Silva"
            errorText={errors.responsibleName?.message}
          />
        </div>

        {/* Preview */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Exemplo de alerta que você vai receber:</p>
          <div className="bg-background rounded p-3 text-sm border-l-4 border-amber-500">
            <div className="flex items-center gap-2 font-semibold text-amber-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              EMERGÊNCIA DETECTADA
            </div>
            <div className="space-y-1 text-muted-foreground">
              <p>📱 Cliente: <span className="text-foreground">+55 11 98765-4321</span></p>
              <p>💬 Disse: <span className="text-foreground italic">"Meu cachorro está com dificuldade para respirar, preciso de ajuda urgente!"</span></p>
              <p className="mt-2 text-xs">→ <span className="text-foreground">Clique para responder imediatamente</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
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
          type="submit"
          variant="primary"
          size="lg"
          loading={saving}
          disabled={saving}
          icon={ArrowRight}
          iconPosition="right"
          fullWidth
        >
          {saving ? 'Salvando...' : 'Próximo'}
        </OnboardingButton>
      </div>
    </form>
  );
}
