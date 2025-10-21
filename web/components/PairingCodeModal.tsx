'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Body, Heading } from './ui/typography'

interface Props {
  open: boolean
  onClose: () => void
  pairingCode: string
  sessionName: string
}

export function PairingCodeModal({ open, onClose, pairingCode, sessionName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar com Código - {sessionName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 p-6">
          {pairingCode ? (
            <>
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-purple-100/50 p-8 dark:from-primary/20 dark:to-purple-900/20">
                <Heading size="xl" className="font-mono tracking-widest">
                  {pairingCode}
                </Heading>
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
                5. Escolha <strong>Conectar com código</strong>
                <br />
                6. Digite o código acima: <strong className="text-primary">{pairingCode}</strong>
              </Body>
            </>
          ) : (
            <Body>Gerando código de pareamento...</Body>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
