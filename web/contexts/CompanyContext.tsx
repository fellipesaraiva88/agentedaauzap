'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  loading: boolean;
  setCurrentCompany: (companyId: string) => void;
  loadCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedCompanyId';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Load companies from API
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load companies');
      }

      const data = await response.json();
      setCompanies(data.companies || []);

      // Restore previously selected company or select first one
      const savedCompanyId = localStorage.getItem(STORAGE_KEY);

      if (data.companies && data.companies.length > 0) {
        let companyToSelect = data.companies[0];

        if (savedCompanyId) {
          const savedCompany = data.companies.find((c: Company) => c.id === savedCompanyId);
          if (savedCompany) {
            companyToSelect = savedCompany;
          }
        }

        setCurrentCompanyState(companyToSelect);
        localStorage.setItem(STORAGE_KEY, companyToSelect.id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Não foi possível carregar as empresas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set current company
  const setCurrentCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId);

    if (company) {
      setCurrentCompanyState(company);
      localStorage.setItem(STORAGE_KEY, companyId);

      // Trigger a page reload to refresh all data with new company context
      toast.success(`Você está agora visualizando ${company.name}`);

      // Optional: Force refresh of current page data
      // You might want to emit an event here or call specific refresh functions
      window.dispatchEvent(new CustomEvent('companyChanged', { detail: { company } }));
    }
  }, [companies]);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Restore selected company from localStorage
  useEffect(() => {
    const savedCompanyId = localStorage.getItem(STORAGE_KEY);

    if (savedCompanyId && companies.length > 0) {
      const savedCompany = companies.find(c => c.id === savedCompanyId);
      if (savedCompany && (!currentCompany || currentCompany.id !== savedCompany.id)) {
        setCurrentCompanyState(savedCompany);
      }
    } else if (companies.length > 0 && !currentCompany) {
      // If no saved company, select the first one
      setCurrentCompanyState(companies[0]);
      localStorage.setItem(STORAGE_KEY, companies[0].id);
    }
  }, [companies, currentCompany]);

  const value: CompanyContextType = {
    currentCompany,
    companies,
    loading,
    setCurrentCompany,
    loadCompanies,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }

  return context;
}

// Helper hook to get current company ID
export function useCurrentCompanyId(): string | null {
  const { currentCompany } = useCompany();
  return currentCompany?.id || null;
}