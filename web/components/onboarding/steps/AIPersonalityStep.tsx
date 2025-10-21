import { useState } from 'react';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AIEnrichButton } from '@/components/onboarding/AIEnrichButton';
import { ArrowRight, ArrowLeft, Bot, Smile, MessageCircle } from 'lucide-react';

interface AIPersonalityData {
  tone?: string;
  emojiUsage?: string;
  brazilianSlang?: boolean;
  brandVoice?: string;
}

interface AIPersonalityStepProps {
  initialData?: AIPersonalityData;
  onSave: (data: AIPersonalityData) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

// Helper function to generate preview message based on settings
function generatePreviewMessage(tone: string, emojis: string, slang: boolean): string {
  const emojiMap = {
    frequent: '🐕✨💙',
    moderate: '😊',
    rare: ''
  };

  const selectedEmojis = emojiMap[emojis as keyof typeof emojiMap] || '';

  if (tone === 'casual' && slang) {
    return `E aí! Massa! ${selectedEmojis} Qual dia tu prefere pra trazer o pet?`;
  } else if (tone === 'casual' && !slang) {
    return `Oi! Tudo bem? ${selectedEmojis} Qual dia você prefere para trazer o pet?`;
  } else if (tone === 'friendly' && slang) {
    return `Olá! Claro, vou te ajudar! ${selectedEmojis} Beleza, qual dia é melhor pra você?`;
  } else if (tone === 'friendly' && !slang) {
    return `Olá! Com certeza posso ajudar. ${selectedEmojis} Qual dia e horário prefere?`;
  } else if (tone === 'professional' && slang) {
    return `Bom dia. Posso auxiliar sim. ${selectedEmojis} Qual seria a melhor data?`;
  } else {
    return `Bom dia. Certamente posso auxiliá-lo. Qual data e horário de sua preferência?`;
  }
}

export function AIPersonalityStep({ initialData, onSave, onNext, onBack }: AIPersonalityStepProps) {
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState(initialData?.tone || 'friendly');
  const [emojiUsage, setEmojiUsage] = useState(initialData?.emojiUsage || 'moderate');
  const [brazilianSlang, setBrazilianSlang] = useState(initialData?.brazilianSlang !== false);
  const [brandVoice, setBrandVoice] = useState(initialData?.brandVoice || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await onSave({
      tone,
      emojiUsage,
      brazilianSlang,
      brandVoice
    });

    setSaving(false);
    if (success) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Como sua IA vai conversar?</h2>
        <p className="text-muted-foreground">
          Escolha o jeito que sua IA vai falar com os clientes no WhatsApp
        </p>
      </div>

      <div className="space-y-6">
        {/* Tone */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-ocean-blue" />
            Jeito de Falar
          </Label>
          <RadioGroup value={tone} onValueChange={setTone}>
            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="casual" id="casual" />
              <Label htmlFor="casual" className="flex-1 cursor-pointer">
                <div className="font-medium">Casual</div>
                <div className="text-sm text-muted-foreground">
                  Descontraído e amigável (ex: "Oi! Tudo certo?")
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="friendly" id="friendly" />
              <Label htmlFor="friendly" className="flex-1 cursor-pointer">
                <div className="font-medium">Amigável</div>
                <div className="text-sm text-muted-foreground">
                  Simpático e acolhedor (ex: "Olá! Como posso ajudar?")
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="professional" id="professional" />
              <Label htmlFor="professional" className="flex-1 cursor-pointer">
                <div className="font-medium">Profissional</div>
                <div className="text-sm text-muted-foreground">
                  Formal e direto (ex: "Bom dia. Em que posso auxiliá-lo?")
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Emoji Usage */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-ocean-blue" />
            Uso de Emojis
          </Label>
          <RadioGroup value={emojiUsage} onValueChange={setEmojiUsage}>
            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="frequent" id="frequent" />
              <Label htmlFor="frequent" className="flex-1 cursor-pointer">
                Frequente 😊🐕✨
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="moderate" id="moderate" />
              <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                Moderado 😊
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="rare" id="rare" />
              <Label htmlFor="rare" className="flex-1 cursor-pointer">
                Raro
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Brazilian Slang */}
        <div className="space-y-3">
          <Label>Usar Gírias Brasileiras?</Label>
          <RadioGroup value={brazilianSlang ? 'yes' : 'no'} onValueChange={(v) => setBrazilianSlang(v === 'yes')}>
            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="yes" id="slang-yes" />
              <Label htmlFor="slang-yes" className="flex-1 cursor-pointer">
                <div className="font-medium">Sim</div>
                <div className="text-sm text-muted-foreground">
                  A IA usa "Massa!", "Beleza!", "Tá certo" (mais descontraído)
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md border">
              <RadioGroupItem value="no" id="slang-no" />
              <Label htmlFor="slang-no" className="flex-1 cursor-pointer">
                <div className="font-medium">Não</div>
                <div className="text-sm text-muted-foreground">
                  A IA usa linguagem mais formal e universal
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Brand Voice (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="brandVoice">
            Personalidade da Marca (Opcional)
          </Label>
          <p className="text-sm text-muted-foreground">
            Ex: "Acolhedora como família", "Energética e motivadora", "Séria e confiável"
          </p>
          <Textarea
            id="brandVoice"
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="Descreva em poucas palavras como você quer que a IA reflita sua marca..."
            rows={3}
          />
          {brandVoice.length >= 10 && (
            <AIEnrichButton
              fieldName="brand_voice"
              originalText={brandVoice}
              onAccept={setBrandVoice}
            />
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-ocean-blue" />
          <Label className="text-base font-semibold">Prévia em Tempo Real</Label>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Veja como sua IA vai conversar com os clientes:
        </p>

        <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-6 rounded-xl space-y-4 border">
          {/* Cliente Message */}
          <div className="flex justify-end">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[75%] shadow-sm border">
              <p className="text-sm">Oi, quero agendar banho pro meu cachorro</p>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex justify-start">
            <div className="bg-ocean-500 text-white px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%] shadow-md">
              <p className="text-sm leading-relaxed">
                {generatePreviewMessage(tone, emojiUsage, brazilianSlang)}
              </p>
            </div>
          </div>

          {/* Settings indicator */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full">
              <Bot className="w-3 h-3" />
              <span className="capitalize">{tone === 'casual' ? 'Casual' : tone === 'friendly' ? 'Amigável' : 'Profissional'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full">
              <Smile className="w-3 h-3" />
              <span>{emojiUsage === 'frequent' ? 'Emojis Frequentes' : emojiUsage === 'moderate' ? 'Emojis Moderados' : 'Emojis Raros'}</span>
            </div>
            {brazilianSlang && (
              <div className="text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full">
                🇧🇷 Gírias BR
              </div>
            )}
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
