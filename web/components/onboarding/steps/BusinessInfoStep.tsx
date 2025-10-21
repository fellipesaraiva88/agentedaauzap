import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/PhoneInput';
import { useViaCep } from '@/hooks/useViaCep';
import { toast } from '@/lib/toast-config';
import { ArrowRight, ArrowLeft, Building, MapPin, Phone, Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cep: z.string().min(8, 'CEP inválido').optional(),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  phone: z.string().min(10, 'Telefone inválido')
});

type FormData = z.infer<typeof schema>;

interface BusinessInfoStepProps {
  initialData?: Partial<FormData>;
  onSave: (data: FormData) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

export function BusinessInfoStep({ initialData, onSave, onNext, onBack }: BusinessInfoStepProps) {
  const [saving, setSaving] = useState(false);
  const { fetchAddress, loading: cepLoading, error: cepError } = useViaCep();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
  });

  const cep = watch('cep', '');

  const handleCepBlur = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;

    const address = await fetchAddress(cep);

    if (address) {
      // Auto-preencher endereço com dados do ViaCEP
      const fullAddress = [
        address.street,
        address.neighborhood,
        `${address.city}/${address.state}`
      ].filter(Boolean).join(', ');

      setValue('address', fullAddress);
      toast.success('Endereço preenchido automaticamente!');
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const success = await onSave(data);
    setSaving(false);

    if (success) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Informações do Negócio</h2>
        <p className="text-muted-foreground">
          Conte-nos sobre seu petshop para personalizar a experiência
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building className="w-4 h-4 text-ocean-blue" />
            Nome do Petshop
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ex: Pet Love"
            errorText={errors.name?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ocean-blue" />
            CEP
          </Label>
          <div className="relative">
            <Input
              id="cep"
              {...register('cep')}
              placeholder="00000-000"
              maxLength={9}
              onBlur={handleCepBlur}
              errorText={errors.cep?.message || cepError || undefined}
            />
            {cepLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-ocean-blue" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Digite seu CEP para preencher o endereço automaticamente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ocean-blue" />
            Endereço Completo
          </Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="Rua Exemplo, 123 - Centro, São Paulo/SP"
            errorText={errors.address?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-ocean-blue" />
            Telefone/WhatsApp
          </Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                className="h-12"
              />
            )}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
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
