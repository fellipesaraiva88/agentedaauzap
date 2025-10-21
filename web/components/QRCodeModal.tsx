'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Body } from './ui/typography'
import QRCode from 'qrcode.react'

interface Props {
  open: boolean
  onClose: () => void
  qrCode: string
  sessionName: string
}

export function QRCodeModal({ open, onClose, qrCode, sessionName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp - {sessionName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 p-6">
          {qrCode ? (
            <>
              <div className="rounded-lg bg-white p-4">
                <QRCode value={qrCode} size={256} />
              </div>
              <Body variant="muted" size="sm" className="text-center">
                1. Abra o WhatsApp no seu celular
                <br />
                2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong>
                <br />
                3. Toque em <strong>Aparelhos conectados</strong>
                <br />
                4. Toque em <strong>Conectar um aparelho</strong>
                <br />
                5. Aponte seu celular para esta tela para capturar o código
              </Body>
            </>
          ) : (
            <Body>Gerando QR Code...</Body>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
