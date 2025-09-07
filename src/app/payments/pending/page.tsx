'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Smartphone, Receipt } from 'lucide-react'
import Link from 'next/link'

export default function PaymentPendingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [loading, setLoading] = useState(false)

  // Obter parâmetros da URL
  const paymentId = searchParams.get('payment_id')
  const collectionId = searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status')
  const preferenceId = searchParams.get('preference_id')
  const externalReference = searchParams.get('external_reference')
  const paymentType = searchParams.get('payment_type')
  const merchantOrderId = searchParams.get('merchant_order_id')

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    // Verificar status inicial
    if (collectionStatus) {
      setPaymentStatus(collectionStatus as any)
    }
  }, [user, authLoading, router, collectionStatus])

  const checkPaymentStatus = async () => {
    if (!paymentId && !collectionId) return

    setLoading(true)
    try {
      const token = await user?.getIdToken()
      if (!token) return

      const id = paymentId || collectionId
      const response = await fetch(`/api/payments/mercadopago/preference?payment_id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data.status)
        
        // Se aprovado, redirecionar para página de sucesso
        if (data.status === 'approved') {
          router.push(`/payments/success?payment_id=${id}`)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPendingMessage = (status: string | null) => {
    const messages: Record<string, string> = {
      'pending': 'Seu pagamento está sendo processado',
      'in_process': 'Pagamento em análise',
      'authorized': 'Pagamento autorizado, aguardando confirmação',
    }
    return messages[status || ''] || 'Pagamento pendente de confirmação'
  }

  const getPendingDescription = (status: string | null) => {
    const descriptions: Record<string, string> = {
      'pending': 'Estamos processando seu pagamento. Isso pode levar alguns minutos.',
      'in_process': 'Seu pagamento está sendo analisado. Você será notificado quando for aprovado.',
      'authorized': 'Seu pagamento foi autorizado e será confirmado em breve.',
    }
    return descriptions[status || ''] || 'Aguarde a confirmação do seu pagamento.'
  }

  const getEstimatedTime = (status: string | null) => {
    const times: Record<string, string> = {
      'pending': 'até 2 horas',
      'in_process': 'até 24 horas',
      'authorized': 'até 1 hora',
    }
    return times[status || ''] || 'em breve'
  }

  const getRedirectPath = (type: string | null) => {
    switch (type) {
      case 'appointment':
        return '/client/appointments'
      case 'taxi_dog':
        return '/taxi-dog'
      case 'service':
        return '/client'
      default:
        return '/client'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            {paymentStatus === 'approved' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : paymentStatus === 'rejected' ? (
              <AlertCircle className="h-8 w-8 text-red-600" />
            ) : (
              <Clock className="h-8 w-8 text-yellow-600" />
            )}
          </div>
          <CardTitle className="text-2xl text-yellow-600">
            {paymentStatus === 'approved' ? 'Pagamento Aprovado!' :
             paymentStatus === 'rejected' ? 'Pagamento Rejeitado' :
             'Pagamento Pendente'}
          </CardTitle>
          <CardDescription className="text-lg">
            {paymentStatus === 'approved' ? 'Seu pagamento foi confirmado com sucesso' :
             paymentStatus === 'rejected' ? 'Não foi possível processar seu pagamento' :
             getPendingMessage(paymentStatus)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status e Descrição */}
          <div className="space-y-4">
            {paymentStatus !== 'approved' && paymentStatus !== 'rejected' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Processando Pagamento</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {getPendingDescription(paymentStatus)}
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Tempo estimado: {getEstimatedTime(paymentStatus)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === 'rejected' && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Pagamento Rejeitado</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Seu pagamento foi rejeitado. Tente novamente com outro método de pagamento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Informações do Pagamento */}
          {(paymentId || collectionId || preferenceId) && (
            <div className="space-y-2">
              <h4 className="font-medium">Detalhes da Transação</h4>
              
              {(paymentId || collectionId) && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID do Pagamento:</span>
                  <span className="text-sm font-mono">{paymentId || collectionId}</span>
                </div>
              )}
              
              {preferenceId && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID da Preferência:</span>
                  <span className="text-sm font-mono">{preferenceId}</span>
                </div>
              )}

              {merchantOrderId && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pedido:</span>
                  <span className="text-sm font-mono">{merchantOrderId}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge 
                  variant={paymentStatus === 'approved' ? 'default' : 
                          paymentStatus === 'rejected' ? 'destructive' : 'secondary'}
                  className={paymentStatus === 'approved' ? 'bg-green-100 text-green-800' : ''}
                >
                  {paymentStatus === 'pending' ? 'Pendente' :
                   paymentStatus === 'approved' ? 'Aprovado' :
                   paymentStatus === 'rejected' ? 'Rejeitado' :
                   paymentStatus === 'in_process' ? 'Em Análise' :
                   paymentStatus === 'authorized' ? 'Autorizado' :
                   paymentStatus || 'Pendente'}
                </Badge>
              </div>
            </div>
          )}

          {/* Próximos Passos */}
          {paymentStatus !== 'approved' && paymentStatus !== 'rejected' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">O que acontece agora?</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Você receberá uma notificação quando o pagamento for aprovado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Um email de confirmação será enviado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Você pode acompanhar o status nesta página</span>
                </div>
              </div>
            </div>
          )}

          {/* Métodos de Pagamento Alternativos */}
          {paymentStatus === 'rejected' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Tente com outro método</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span>PIX - Pagamento instantâneo</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Boleto bancário - Até 3 dias úteis</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            {paymentStatus === 'approved' ? (
              <Button 
                onClick={() => {
                  const redirectPath = getRedirectPath(paymentType)
                  router.push(redirectPath)
                }}
                className="flex-1"
              >
                Continuar
              </Button>
            ) : paymentStatus === 'rejected' ? (
              <Button 
                onClick={() => {
                  const redirectPath = getRedirectPath(paymentType)
                  router.push(redirectPath)
                }}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            ) : (
              <Button 
                onClick={checkPaymentStatus}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Verificar Status
              </Button>
            )}
          </div>

          {/* Links de Ajuda */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {paymentStatus !== 'approved' && paymentStatus !== 'rejected' 
                ? 'Esta página será atualizada automaticamente quando o pagamento for processado'
                : 'Você receberá um comprovante por email'
              }
            </p>
            <div className="space-x-4">
              <Link 
                href="/client/payments" 
                className="text-xs text-primary hover:underline"
              >
                Ver histórico de pagamentos
              </Link>
              <Link 
                href="/support" 
                className="text-xs text-primary hover:underline"
              >
                Central de Ajuda
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}