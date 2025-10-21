'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Smartphone } from 'lucide-react'

export default function QRCodePage() {
  const [phoneNumber, setPhoneNumber] = useState('5511999999999')
  const [message, setMessage] = useState('Olá! Gostaria de agendar um serviço para meu pet.')

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  const handleDownload = () => {
    const svg = document.getElementById('qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = 'whatsapp-qrcode.png'
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Code WhatsApp</h1>
        <p className="text-gray-500">Gere QR Codes para facilitar o contato com clientes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do QR Code</CardTitle>
            <CardDescription>Configure o número e mensagem padrão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-xs text-gray-500">
                Formato: Código do país + DDD + Número (sem espaços ou caracteres especiais)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem Padrão</Label>
              <Input
                id="message"
                placeholder="Mensagem inicial..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <p className="text-sm font-semibold mb-2">Pré-visualização da URL:</p>
              <div className="p-3 bg-gray-50 rounded-md break-all text-xs text-gray-700">
                {whatsappUrl}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Baixar PNG
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Testar
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code Gerado</CardTitle>
            <CardDescription>Escaneie para abrir a conversa no WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <QRCodeSVG
                id="qr-code"
                value={whatsappUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Clientes podem escanear este código para iniciar uma conversa
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">Configure</h3>
              <p className="text-sm text-gray-600">
                Insira o número do WhatsApp do seu negócio e personalize a mensagem inicial
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">Baixe</h3>
              <p className="text-sm text-gray-600">
                Baixe o QR Code em formato PNG para usar em materiais impressos ou digitais
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">Compartilhe</h3>
              <p className="text-sm text-gray-600">
                Divulgue o QR Code nas redes sociais, site, cartões de visita ou loja física
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
