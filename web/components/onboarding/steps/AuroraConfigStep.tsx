import { useState } from 'react';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PhoneInput } from '@/components/PhoneInput';
import { ArrowRight, ArrowLeft, Sparkles, Phone, Star, Plus, X } from 'lucide-react';

interface AuthorizedNumber {
  phone: string;
  name: string;
  isPrimary: boolean;
}

interface AuroraConfigStepProps {
  initialData?: { authorizedNumbers?: AuthorizedNumber[] };
  onSave: (data: { authorizedNumbers: AuthorizedNumber[] }) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

export function AuroraConfigStep({ initialData, onSave, onNext, onBack }: AuroraConfigStepProps) {
  const [saving, setSaving] = useState(false);
  const [numbers, setNumbers] = useState<AuthorizedNumber[]>(initialData?.authorizedNumbers || []);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (phone: string): boolean => {
    // Phone is already in E.164 format from PhoneInput component
    if (!phone || phone.length < 10) {
      setPhoneError('Número de telefone inválido');
      return false;
    }
    if (numbers.some(n => n.phone === phone)) {
      setPhoneError('Este número já foi adicionado');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const addNumber = () => {
    if (!newPhone.trim() || !newName.trim()) return;
    if (!validatePhone(newPhone)) return;

    const newNumber: AuthorizedNumber = {
      phone: newPhone,
      name: newName,
      isPrimary: numbers.length === 0 // First number is primary
    };

    setNumbers([...numbers, newNumber]);
    setNewPhone('');
    setNewName('');
    setPhoneError('');
  };

  const removeNumber = (index: number) => {
    const removed = numbers[index];
    const updated = numbers.filter((_, i) => i !== index);

    // If removed was primary and there are others, make first one primary
    if (removed.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    setNumbers(updated);
  };

  const setPrimary = (index: number) => {
    setNumbers(numbers.map((n, i) => ({
      ...n,
      isPrimary: i === index
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numbers.length === 0) {
      setPhoneError('Adicione pelo menos um número autorizado');
      return;
    }

    setSaving(true);
    const success = await onSave({ authorizedNumbers: numbers });
    setSaving(false);
    if (success) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Aurora Assistant</h2>
        <p className="text-muted-foreground">
          Configure sua parceira de negócios via WhatsApp
        </p>
      </div>

      <Alert className="border-ocean-blue/50 bg-ocean-blue/10">
        <Sparkles className="w-4 h-4 text-ocean-blue" />
        <AlertDescription>
          <strong>O que é a Aurora?</strong>
          <br />
          Aurora é uma IA especializada que responde perguntas sobre seu negócio:
          faturamento, clientes ativos, agenda do dia, métricas, e muito mais. Ela tem
          acesso completo aos dados da sua empresa e só responde para números autorizados.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Add Number Form */}
        <div className="space-y-3 p-4 border rounded-lg">
          <Label className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-ocean-blue" />
            Adicionar Número Autorizado
          </Label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <PhoneInput
                value={newPhone}
                onChange={(value) => setNewPhone(value)}
                className="h-10"
              />
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={addNumber}
            disabled={!newPhone.trim() || !newName.trim()}
            variant="outline"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Número
          </Button>
        </div>

        {/* Numbers List */}
        {numbers.length > 0 && (
          <div className="space-y-2">
            <Label>Números Autorizados ({numbers.length})</Label>
            <div className="space-y-2">
              {numbers.map((number, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{number.name}</p>
                      {number.isPrimary && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      +55 {number.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!number.isPrimary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimary(index)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNumber(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
          disabled={saving || numbers.length === 0}
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
