'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';

interface CompanySelectorProps {
  className?: string;
  variant?: 'default' | 'compact' | 'badge';
}

export function CompanySelector({
  className,
  variant = 'default'
}: CompanySelectorProps) {
  const { currentCompany, companies, loading, setCurrentCompany } = useCompany();

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando empresas...</span>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Nenhuma empresa encontrada</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Select
        value={currentCompany?.id}
        onValueChange={setCurrentCompany}
      >
        <SelectTrigger className={cn('w-auto gap-2', className)}>
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Selecione uma empresa">
            <span className="font-medium">{currentCompany?.name}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex flex-col">
                <span className="font-medium">{company.name}</span>
                {company.slug && (
                  <span className="text-xs text-muted-foreground">
                    {company.slug}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5" />
          <span className="font-medium">{currentCompany?.name || 'Selecione'}</span>
        </Badge>
        <Select
          value={currentCompany?.id}
          onValueChange={setCurrentCompany}
        >
          <SelectTrigger className="w-auto border-0 p-0 h-auto hover:bg-transparent focus:ring-0">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{company.name}</span>
                    {company.slug && (
                      <span className="text-xs text-muted-foreground">
                        {company.slug}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Empresa:</span>
      </div>
      <Select
        value={currentCompany?.id}
        onValueChange={setCurrentCompany}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Selecione uma empresa">
            <div className="flex items-center gap-2">
              <span className="font-medium">{currentCompany?.name}</span>
              {currentCompany?.slug && (
                <Badge variant="outline" className="text-xs">
                  {currentCompany.slug}
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Empresas disponíveis
          </div>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex flex-col">
                  <span className="font-medium">{company.name}</span>
                  {company.slug && (
                    <span className="text-xs text-muted-foreground">
                      {company.slug}
                    </span>
                  )}
                </div>
                {currentCompany?.id === company.id && (
                  <Badge variant="default" className="text-xs">
                    Atual
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Export a compact version for use in constrained spaces
export function CompanySelectorCompact({ className }: { className?: string }) {
  return <CompanySelector variant="compact" className={className} />;
}

// Export a badge version for minimal UI
export function CompanySelectorBadge({ className }: { className?: string }) {
  return <CompanySelector variant="badge" className={className} />;
}