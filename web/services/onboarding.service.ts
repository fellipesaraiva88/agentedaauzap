import { api } from '@/lib/api'

export interface OnboardingProgress {
  currentStep: number
  completed: boolean
  data: Record<string, any>
  createdAt?: string
  updatedAt?: string
  completedAt?: string | null
}

export interface OnboardingResponse {
  progress: OnboardingProgress
}

/**
 * Onboarding Service
 * Gerencia o progresso do onboarding do usuário
 */
export const onboardingService = {
  /**
   * Busca o progresso atual do onboarding
   */
  async getProgress(): Promise<OnboardingProgress> {
    try {
      const response = await api.get<OnboardingResponse>('/api/onboarding/progress')
      return response.data.progress
    } catch (error: any) {
      console.error('Failed to get onboarding progress:', error)
      
      // Se erro 404, retornar progresso inicial
      if (error.response?.status === 404) {
        return {
          currentStep: 1,
          completed: false,
          data: {}
        }
      }
      
      throw new Error(
        error.response?.data?.message || 'Failed to load onboarding progress'
      )
    }
  },

  /**
   * Atualiza o progresso do onboarding
   */
  async updateProgress(currentStep?: number, data?: Record<string, any>): Promise<OnboardingProgress> {
    try {
      const response = await api.put<{ success: boolean; progress: OnboardingProgress }>(
        '/api/onboarding/progress',
        { currentStep, data }
      )
      return response.data.progress
    } catch (error: any) {
      console.error('Failed to update onboarding progress:', error)
      throw new Error(
        error.response?.data?.message || 'Failed to save progress'
      )
    }
  },

  /**
   * Salva dados de um step específico
   */
  async saveStepData(step: number, stepData: Record<string, any>): Promise<OnboardingProgress> {
    const current = await this.getProgress()
    const updatedData = {
      ...current.data,
      [`step${step}`]: stepData
    }
    return await this.updateProgress(step, updatedData)
  },

  /**
   * Avança para o próximo step
   */
  async goToNextStep(currentStep: number, stepData?: Record<string, any>): Promise<OnboardingProgress> {
    const nextStep = Math.min(currentStep + 1, 9)
    
    if (stepData) {
      const current = await this.getProgress()
      const updatedData = {
        ...current.data,
        [`step${currentStep}`]: stepData
      }
      return await this.updateProgress(nextStep, updatedData)
    }
    
    return await this.updateProgress(nextStep)
  },

  /**
   * Marca o onboarding como completo
   */
  async complete(finalData?: Record<string, any>): Promise<void> {
    const current = await this.getProgress()
    const completeData = finalData ? { ...current.data, ...finalData } : current.data
    await api.post('/api/onboarding/complete', { data: completeData })
  }
}
