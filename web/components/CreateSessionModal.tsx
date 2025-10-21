'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSessionModal({ open, onClose, onSuccess }: Props) {
  const [sessionName, setSessionName] = useState('')
  const [wahaUrl, setWahaUrl] = useState('https://pange-waha.u5qiqp.easypanel.host')
  const [wahaApiKey, setWahaApiKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`${API_URL}/whatsapp/sessions`, {
        companyId: 1,
        sessionName,
        wahaUrl,
        wahaApiKey,
      })
      onSuccess()
      setSessionName('')
      setWahaApiKey('')
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Erro ao criar sessão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Sessão WhatsApp</DialogTitle>
          <DialogDescription>Configure uma nova sessão WAHA para conectar seu WhatsApp Business</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className=\"space-y-4\">
          <div>
            <Label htmlFor=\"session-name\">Nome da Sessão</Label>
            <Input
              id=\"session-name\"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder=\"Ex: principal, vendas, suporte\"
              required
            />
          </div>

          <div>
            <Label htmlFor=\"waha-url\">URL do WAHA</Label>
            <Input id=\"waha-url\" value={wahaUrl} onChange={(e) => setWahaUrl(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor=\"waha-api-key\">API Key do WAHA</Label>
            <Input
              id=\"waha-api-key\"
              type=\"password\"
              value={wahaApiKey}
              onChange={(e) => setWahaApiKey(e.target.value)}
              placeholder=\"Cole sua API key aqui\"
              required
            />
          </div>

          <div className=\"flex gap-2\">
            <Button type=\"button\" variant=\"outline\" onClick={onClose} className=\"flex-1\">
              Cancelar
            </Button>
            <Button type=\"submit\" disabled={loading} className=\"flex-1\">
              {loading ? 'Criando...' : 'Criar Sessão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
