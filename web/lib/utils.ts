import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(time: string): string {
  return time.substring(0, 5) // "14:00:00" -> "14:00"
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmado: 'bg-blue-100 text-blue-800 border-blue-300',
    em_atendimento: 'bg-purple-100 text-purple-800 border-purple-300',
    concluido: 'bg-green-100 text-green-800 border-green-300',
    cancelado: 'bg-red-100 text-red-800 border-red-300',
    nao_compareceu: 'bg-gray-100 text-gray-800 border-gray-300',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    em_atendimento: 'Em Atendimento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    nao_compareceu: 'Não Compareceu',
  }
  return labels[status] || status
}
