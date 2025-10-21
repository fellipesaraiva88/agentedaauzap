'use client'

import { MessageSquare, Calendar, UserPlus, Bot } from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const actions = [
  {
    icon: MessageSquare,
    label: 'Nova Conversa',
    href: '/dashboard/conversations',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    icon: Calendar,
    label: 'Agendar',
    href: '/dashboard/appointments',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    icon: UserPlus,
    label: 'Cadastrar Pet',
    href: '/dashboard/clients',
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200 dark:bg-green-950 dark:hover:bg-green-900',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    icon: Bot,
    label: 'Configurar IA',
    href: '/dashboard/settings',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-950 dark:hover:bg-orange-900',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
]

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href={action.href}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-200 md:px-4',
                action.bgColor,
                action.borderColor
              )}
            >
              <action.icon className={cn('h-4 w-4', action.color)} />
              <span className={cn('text-sm font-medium', action.color)}>
                {action.label}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
