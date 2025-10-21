import { useState, useMemo, useEffect } from 'react';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  ArrowLeft,
  Package,
  Scissors,
  Stethoscope,
  Hotel,
  GraduationCap,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Service categories with icons
const SERVICE_CATEGORIES = {
  aesthetic: {
    title: 'Estética',
    icon: Scissors,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    services: ['Banho', 'Tosa', 'Banho e Tosa', 'Hidratação', 'Corte de Unha', 'Limpeza de Ouvido', 'Escovação de Dentes']
  },
  health: {
    title: 'Saúde',
    icon: Stethoscope,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    services: ['Consulta Veterinária', 'Vacinação', 'Vermifugação', 'Cirurgias', 'Exames Laboratoriais', 'Internação']
  },
  hospitality: {
    title: 'Hospedagem',
    icon: Hotel,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    services: ['Daycare', 'Hotel', 'Creche']
  },
  training: {
    title: 'Treinamento & Produtos',
    icon: GraduationCap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    services: ['Adestramento', 'Produtos (ração, brinquedos, etc.)']
  }
};

interface ProductsServicesStepProps {
  initialData?: string[];
  onSave: (data: string[]) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
}

export function ProductsServicesStep({ initialData, onSave, onNext, onBack }: ProductsServicesStepProps) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialData || []);
  const [customService, setCustomService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      ctrl: true,
      callback: () => {
        if (allSelected) {
          clearAll();
        } else {
          selectAll();
        }
      },
      description: 'Selecionar/Limpar tudo'
    },
    {
      key: '/',
      callback: () => {
        document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')?.focus();
      },
      description: 'Focar busca'
    },
    {
      key: '?',
      shift: true,
      callback: () => setShowShortcuts(!showShortcuts),
      description: 'Mostrar atalhos'
    }
  ], true);

  // Get all services for quick actions
  const allServices = useMemo(() =>
    Object.values(SERVICE_CATEGORIES).flatMap(cat => cat.services),
    []
  );

  // Filter services based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SERVICE_CATEGORIES;

    const query = searchQuery.toLowerCase();
    const filtered: typeof SERVICE_CATEGORIES = {} as any;

    Object.entries(SERVICE_CATEGORIES).forEach(([key, category]) => {
      const matchingServices = category.services.filter(service =>
        service.toLowerCase().includes(query)
      );

      if (matchingServices.length > 0) {
        filtered[key as keyof typeof SERVICE_CATEGORIES] = {
          ...category,
          services: matchingServices
        };
      }
    });

    return filtered;
  }, [searchQuery]);

  const toggleService = (service: string) => {
    setSelected(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const selectAll = () => {
    setSelected([...allServices]);
  };

  const clearAll = () => {
    setSelected([]);
  };

  const addCustomService = () => {
    if (customService.trim() && !selected.includes(customService.trim())) {
      setSelected([...selected, customService.trim()]);
      setCustomService('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await onSave(selected);
    setSaving(false);
    if (success) onNext();
  };

  // Check if all services are selected
  const allSelected = allServices.every(s => selected.includes(s));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Produtos e Serviços</h2>
        <p className="text-muted-foreground">
          Selecione os serviços que você oferece para personalizar a IA
        </p>
      </div>

      {/* Search + Quick Actions */}
      <div className="space-y-3">
        {/* Search Bar with keyboard hint */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar serviços... (pressione / para focar)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-24"
          />
          <button
            type="button"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted transition-colors"
            title="Mostrar atalhos (Shift + ?)"
          >
            <Keyboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={allSelected ? clearAll : selectAll}
            className="gap-2"
          >
            {allSelected ? (
              <>
                <Square className="h-4 w-4" />
                Limpar Tudo
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                Selecionar Tudo
              </>
            )}
          </Button>

          <div className="flex-1" />

          {/* Selected Counter */}
          <div className={cn(
            "px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300",
            selected.length > 0
              ? "bg-ocean-500/10 text-ocean-600"
              : "bg-muted text-muted-foreground"
          )}>
            {selected.length} selecionado{selected.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Services by Category */}
      <div className="space-y-6">
        {Object.keys(filteredCategories).length === 0 ? (
          // Empty State
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhum serviço encontrado para "{searchQuery}"
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="gap-2"
            >
              Limpar busca
            </Button>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([key, category]) => {
            const Icon = category.icon;
            const categoryServices = category.services;
            const categorySelected = categoryServices.filter(s => selected.includes(s)).length;

            return (
              <div key={key} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", category.bgColor)}>
                    <Icon className={cn("h-5 w-5", category.color)} />
                  </div>
                  <h3 className="font-semibold text-lg">{category.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    ({categorySelected}/{categoryServices.length})
                  </span>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryServices.map((service) => {
                    const isSelected = selected.includes(service);

                    return (
                      <button
                        type="button"
                        key={service}
                        className={cn(
                          "group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-left w-full",
                          "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
                          isSelected
                            ? "border-ocean-500 bg-ocean-500/5 shadow-md"
                            : "border-border bg-card hover:border-ocean-300"
                        )}
                        onClick={() => toggleService(service)}
                      >
                        {/* Custom Checkbox Visual (no Radix) */}
                        <div
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-ocean-500 border-ocean-500"
                              : "border-input bg-background"
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="flex-1 text-sm font-medium leading-tight">
                          {service}
                        </span>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 rounded-full bg-ocean-500 animate-pulse" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Service Input */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-ocean-500" />
          Serviço Personalizado
        </Label>
        <div className="flex gap-2">
          <Input
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            placeholder="Ex: Spa Canino, Fotografia Pet..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomService();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addCustomService}
            disabled={!customService.trim()}
            variant="outline"
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Custom Services List */}
        {selected.some(s => !allServices.includes(s)) && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Serviços personalizados:</p>
            <div className="flex flex-wrap gap-2">
              {selected
                .filter(s => !allServices.includes(s))
                .map(service => (
                  <div
                    key={service}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-ocean-500/10 text-ocean-600 text-sm"
                  >
                    <span>{service}</span>
                    <button
                      type="button"
                      onClick={() => toggleService(service)}
                      className="hover:text-ocean-800 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Validation Message */}
      {selected.length === 0 && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Selecione pelo menos 1 serviço para continuar
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="p-4 rounded-lg bg-muted/50 border space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Atalhos de Teclado
            </h4>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Selecionar/Limpar tudo</span>
              <kbd className="px-2 py-1 bg-background rounded border text-foreground font-mono">
                Ctrl + A
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Focar busca</span>
              <kbd className="px-2 py-1 bg-background rounded border text-foreground font-mono">
                /
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mostrar/Esconder atalhos</span>
              <kbd className="px-2 py-1 bg-background rounded border text-foreground font-mono">
                Shift + ?
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <OnboardingButton
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={saving}
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
          disabled={saving || selected.length === 0}
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
