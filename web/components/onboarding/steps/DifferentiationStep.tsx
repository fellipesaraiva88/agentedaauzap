import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AIEnrichButton } from '@/components/onboarding/AIEnrichButton';
import { ArrowRight, ArrowLeft, Star, Target, Users, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DifferentiationData {
  uniqueValueProposition?: string;
  competitiveDifferentiators?: string[];
  targetAudience?: string;
}

interface DifferentiationStepProps {
  initialData?: DifferentiationData;
  onSave: (data: DifferentiationData) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

export function DifferentiationStep({ initialData, onSave, onNext, onBack }: DifferentiationStepProps) {
  const [saving, setSaving] = useState(false);
  const [valueProposition, setValueProposition] = useState(initialData?.uniqueValueProposition || '');
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || '');
  const [differentiators, setDifferentiators] = useState<string[]>(initialData?.competitiveDifferentiators || []);
  const [newDifferentiator, setNewDifferentiator] = useState('');

  const addDifferentiator = () => {
    if (newDifferentiator.trim() && differentiators.length < 5) {
      setDifferentiators([...differentiators, newDifferentiator.trim()]);
      setNewDifferentiator('');
    }
  };

  const removeDifferentiator = (index: number) => {
    setDifferentiators(differentiators.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await onSave({
      uniqueValueProposition: valueProposition,
      competitiveDifferentiators: differentiators,
      targetAudience
    });

    setSaving(false);
    if (success) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">O que torna seu negócio único?</h2>
        <p className="text-muted-foreground">
          Quando clientes perguntarem "por que devo escolher vocês?", a IA vai saber responder
        </p>
      </div>

      <div className="space-y-6">
        {/* Value Proposition */}
        <div className="space-y-2">
          <Label htmlFor="valueProposition" className="flex items-center gap-2">
            <Star className="w-4 h-4 text-ocean-blue" />
            Por que clientes escolhem VOCÊ?
          </Label>
          <p className="text-sm text-muted-foreground">
            Ex: "Única clínica com veterinário 24h" ou "Produtos importados exclusivos"
          </p>
          <Textarea
            id="valueProposition"
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            placeholder="Digite aqui o que faz seu negócio ser especial..."
            rows={3}
          />
          <AIEnrichButton
            fieldName="value_proposition"
            originalText={valueProposition}
            onAccept={setValueProposition}
            disabled={valueProposition.trim().length < 10}
          />
        </div>

        {/* Differentiators */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="w-4 h-4 text-ocean-blue" />
            Seus Principais Diferenciais (até 5)
          </Label>
          <p className="text-sm text-muted-foreground">
            Ex: "Entrega em 2h", "Equipe com 10+ anos", "Melhor preço da região"
          </p>

          <div className="flex gap-2">
            <Input
              value={newDifferentiator}
              onChange={(e) => setNewDifferentiator(e.target.value)}
              placeholder="Digite um diferencial..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDifferentiator())}
            />
            <Button
              type="button"
              onClick={addDifferentiator}
              disabled={!newDifferentiator.trim() || differentiators.length >= 5}
              variant="outline"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {differentiators.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {differentiators.map((diff, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {diff}
                  <button
                    type="button"
                    onClick={() => removeDifferentiator(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="flex items-center gap-2">
            <Users className="w-4 h-4 text-ocean-blue" />
            Quem são seus clientes?
          </Label>
          <p className="text-sm text-muted-foreground">
            Ex: "Famílias com pets pequenos", "Criadores profissionais", "Tutores de primeira viagem"
          </p>
          <Textarea
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Descreva o perfil típico dos seus clientes..."
            rows={3}
          />
          <AIEnrichButton
            fieldName="target_audience"
            originalText={targetAudience}
            onAccept={setTargetAudience}
            disabled={targetAudience.trim().length < 10}
          />
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
          disabled={saving || !valueProposition.trim()}
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
