'use client'

import { useQuery } from '@tanstack/react-query'
import { servicesApi, type Service } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Clock, Package } from 'lucide-react'

export default function ServicesPage() {
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  })

  const categorias = Array.from(new Set(servicesData?.data.map((s: Service) => s.categoria) || []))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Serviços</h1>
        <p className="text-gray-500">Gerencie os serviços oferecidos</p>
      </div>

      {categorias.map((categoria: string) => (
        <div key={categoria}>
          <h2 className="text-xl font-semibold mb-4 capitalize">{categoria}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicesData?.data
              .filter((service: Service) => service.categoria === categoria)
              .map((service: Service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{service.nome}</CardTitle>
                        <CardDescription className="mt-2">{service.descricao}</CardDescription>
                      </div>
                      {service.ativo ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        {service.duracaoMinutos} minutos
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Preços por porte:</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {service.precos.pequeno && (
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <p className="text-xs text-gray-600">Pequeno</p>
                              <p className="font-semibold">{formatCurrency(service.precos.pequeno)}</p>
                            </div>
                          )}
                          {service.precos.medio && (
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <p className="text-xs text-gray-600">Médio</p>
                              <p className="font-semibold">{formatCurrency(service.precos.medio)}</p>
                            </div>
                          )}
                          {service.precos.grande && (
                            <div className="text-center p-2 bg-pink-50 rounded">
                              <p className="text-xs text-gray-600">Grande</p>
                              <p className="font-semibold">{formatCurrency(service.precos.grande)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
