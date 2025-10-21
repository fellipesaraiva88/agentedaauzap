import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, Edit2 } from 'lucide-react';
import { onboardingService } from '@/services/onboarding.service';
import { toast } from '@/lib/toast-config';
import { Textarea } from '@/components/ui/textarea';

interface AIEnrichButtonProps {
  fieldName: 'value_proposition' | 'differentiation' | 'personality_description' | 'target_audience' | 'brand_voice';
  originalText: string;
  context?: string;
  onAccept: (enrichedText: string) => void;
  disabled?: boolean;
}

export function AIEnrichButton({
  fieldName,
  originalText,
  context,
  onAccept,
  disabled
}: AIEnrichButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [enrichedText, setEnrichedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [meta, setMeta] = useState<{ tokensUsed: number; costCents: number } | null>(null);

  const handleEnrich = async () => {
    if (originalText.trim().length < 10) {
      toast.error('Texto muito curto', 'Digite pelo menos 10 caracteres antes de enriquecer');
      return;
    }

    setIsLoading(true);

    try {
      const result = await onboardingService.enrichText(fieldName, originalText, context);

      setEnrichedText(result.enrichedText);
      setEditedText(result.enrichedText);
      setMeta(result.meta);
      setShowModal(true);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 429) {
        toast.error(
          'Limite de enriquecimentos atingido',
          'Você atingiu o máximo de 20 enriquecimentos por hora. Tente novamente mais tarde.'
        );
      } else {
        toast.error('Erro ao enriquecer texto', 'Tente novamente em alguns instantes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    const finalText = isEditing ? editedText : enrichedText;

    // Update backend with acceptance status
    await onboardingService.updateEnrichmentAcceptance(enrichedText, !isEditing);

    onAccept(finalText);
    setShowModal(false);
    setIsEditing(false);

    toast.success('Texto atualizado!', 'Sua resposta foi enriquecida com sucesso ✨');
  };

  const handleReject = async () => {
    await onboardingService.updateEnrichmentAcceptance(enrichedText, false);
    setShowModal(false);
    setIsEditing(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleEnrich}
        disabled={disabled || isLoading || !originalText.trim()}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enriquecendo...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Enriquecer com IA
          </>
        )}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>✨ Texto Enriquecido pela IA</DialogTitle>
            <DialogDescription>
              A IA aprimorou seu texto. Você pode aceitar, editar ou manter o original.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Original */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Original:</p>
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                {originalText}
              </div>
            </div>

            {/* Enriched */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ocean-blue">Enriquecido:</p>
                {meta && (
                  <span className="text-xs text-muted-foreground">
                    {meta.tokensUsed} tokens • R$ {(meta.costCents / 100).toFixed(3)}
                  </span>
                )}
              </div>

              {isEditing ? (
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={5}
                  className="font-medium"
                />
              ) : (
                <div className="p-3 bg-ocean-blue/10 border-2 border-ocean-blue/20 rounded-md text-sm font-medium">
                  {enrichedText}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={handleReject}
              className="gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              Manter Original
            </Button>

            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Button>
            )}

            <Button
              onClick={handleAccept}
              className="gap-2 bg-ocean-blue hover:bg-ocean-blue/90"
            >
              <ThumbsUp className="w-4 h-4" />
              {isEditing ? 'Salvar Edição' : 'Aceitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
