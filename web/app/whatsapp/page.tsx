'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Display, Heading, Body } from '@/components/ui/typography'
import { Plus, Smartphone, QrCode, Hash, Play, Square, Trash2, Send } from 'lucide-react'
import { WhatsAppSessionCard } from '@/components/WhatsAppSessionCard'
import { CreateSessionModal } from '@/components/CreateSessionModal'
import { QRCodeModal } from '@/components/QRCodeModal'
import { PairingCodeModal } from '@/components/PairingCodeModal'
import { motion } from 'framer-motion'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface WhatsAppSession {
  id: number
  company_id: number
  session_name: string
  waha_url: string
  status: 'disconnected' | 'connecting' | 'connected' | 'failed'
  phone_number?: string
  last_connected?: string
  created_at: string
  updated_at: string
}

async function getSessions(companyId: number = 1): Promise<WhatsAppSession[]> {
  const response = await axios.get(`${API_URL}/whatsapp/sessions?companyId=${companyId}`)
  return response.data.sessions
}

export default function WhatsAppPage() {
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [qrModalOpen, setQRModalOpen] = useState(false)
  const [pairingModalOpen, setPairingModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null)
  const [qrCode, setQRCode] = useState<string>('')
  const [pairingCode, setPairingCode] = useState<string>('')

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: () => getSessions(),
    refetchInterval: 5000, // Poll a cada 5 segundos
  })

  const startSessionMutation = useMutation({
    mutationFn: async ({ sessionId, method }: { sessionId: number; method: 'qr' | 'pairing' }) => {
      const response = await axios.post(`${API_URL}/whatsapp/sessions/${sessionId}/start`, {
        method,
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      const session = sessions.find((s) => s.id === variables.sessionId)
      if (session) {
        setSelectedSession(session)
        if (data.method === 'qr') {
          setQRCode(data.qrCode)
          setQRModalOpen(true)
        } else {
          setPairingCode(data.pairingCode)
          setPairingModalOpen(true)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] })
    },
  })

  const stopSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await axios.post(`${API_URL}/whatsapp/sessions/${sessionId}/stop`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] })
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await axios.delete(`${API_URL}/whatsapp/sessions/${sessionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] })
    },
  })

  const handleStartSession = (session: WhatsAppSession, method: 'qr' | 'pairing') => {
    startSessionMutation.mutate({ sessionId: session.id, method })
  }

  const handleStopSession = (sessionId: number) => {
    stopSessionMutation.mutate(sessionId)
  }

  const handleDeleteSession = (sessionId: number) => {
    if (confirm('Tem certeza que deseja deletar esta sessão?')) {
      deleteSessionMutation.mutate(sessionId)
    }
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6\">
      <div className=\"mx-auto max-w-7xl space-y-8\">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className=\"space-y-2\"
        >
          <Display variant=\"gradient\" className=\"text-4xl\">
            <Smartphone className=\"mr-3 inline h-10 w-10\" />
            Gerenciamento WhatsApp
          </Display>
          <Body variant=\"muted\" size=\"lg\">
            Configure e gerencie suas sessões WhatsApp Business via WAHA
          </Body>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button size=\"lg\" onClick={() => setCreateModalOpen(true)}>
            <Plus className=\"mr-2 h-5 w-5\" />
            Nova Sessão WhatsApp
          </Button>
        </motion.div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className=\"grid gap-6 md:grid-cols-2 lg:grid-cols-3\">
            {[1, 2, 3].map((i) => (
              <Card key={i} className=\"animate-pulse\">
                <CardContent className=\"p-6\">
                  <div className=\"h-40 rounded bg-muted\" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className=\"border-2 border-dashed\">
              <CardContent className=\"flex flex-col items-center justify-center p-12 text-center\">
                <Smartphone className=\"mb-4 h-16 w-16 text-muted-foreground\" />
                <Heading size=\"lg\" className=\"mb-2\">
                  Nenhuma sessão configurada
                </Heading>
                <Body variant=\"muted\" className=\"mb-6\">
                  Crie sua primeira sessão WhatsApp para começar a automatizar atendimentos
                </Body>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className=\"mr-2 h-4 w-4\" />
                  Criar Primeira Sessão
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className=\"grid gap-6 md:grid-cols-2 lg:grid-cols-3\">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <WhatsAppSessionCard
                  session={session}
                  onStartQR={() => handleStartSession(session, 'qr')}
                  onStartPairing={() => handleStartSession(session, 'pairing')}
                  onStop={() => handleStopSession(session.id)}
                  onDelete={() => handleDeleteSession(session.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateSessionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] })
        }}
      />

      <QRCodeModal
        open={qrModalOpen}
        onClose={() => setQRModalOpen(false)}
        qrCode={qrCode}
        sessionName={selectedSession?.session_name || ''}
      />

      <PairingCodeModal
        open={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        pairingCode={pairingCode}
        sessionName={selectedSession?.session_name || ''}
      />
    </div>
  )
}
