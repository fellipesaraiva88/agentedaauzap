'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
}

export function ImageUploader({ value, onChange, onRemove }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // TODO: Implement actual upload to your storage service
    // For now, we'll just use the data URL
    setUploading(true)
    setTimeout(() => {
      onChange(reader.result as string)
      setUploading(false)
    }, 1000)
  }

  const handleRemove = () => {
    setPreview(null)
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-600">Clique para selecionar uma imagem</p>
          <p className="text-xs text-gray-500">PNG, JPG ou WEBP (máx. 5MB)</p>
        </div>
      )}

      {!preview && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Enviando...' : 'Selecionar Imagem'}
        </Button>
      )}
    </div>
  )
}
