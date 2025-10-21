'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Home,
  Settings,
  Users,
  Package,
  QrCode,
  BarChart3,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Agendamentos', href: '/dashboard/appointments', icon: CalendarDays },
  { name: 'Serviços', href: '/dashboard/services', icon: Package },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Estatísticas', href: '/dashboard/stats', icon: BarChart3 },
  { name: 'QR Code', href: '/dashboard/qr-code', icon: QrCode },
  { name: 'Conversas', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col gap-y-5 border-r bg-white px-6 py-8">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-2xl font-bold text-primary">Pet Shop</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:text-primary hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
