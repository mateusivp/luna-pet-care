'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, ArrowLeft, Receipt, Calendar, Car } from 'lucide-react'
import Link from 'next/link'

interface PaymentDetails {
  id: string
  status: string
  amount: number
  currency: string
  paymentMethod: string
  customerEmail?: string
  metadata?: {
    userId: string
    serviceType: string
    paymentType: string
    petId?: string
    appointmentId?: string
    taxiRequestId?: string
  }
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obter parâmetros da URL
  const sessionId = searchParams.get('session_id')
  const paymentId = searchParams.get('payment_id')
  const collectionId = searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status')
  const preferenceId = searchParams.get('preference_id')

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    fetchPaymentDetails()
  }, [user, authLoading, sessionId, paymentId, collectionId])

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()

      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }

      let response: Response

      // Verificar se é pagamento Stripe ou Mercado Pago
      if (sessionId) {
        // Stripe Checkout Session
        response = await fetch(`/api/payments/stripe/checkout?session_id=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } else if (paymentId || collectionId) {
        // Mercado Pago Payment
        const id = paymentId || collectionId
        response = await fetch(`/api/payments/mercadopago/preference?payment_id=${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } else {
        throw new Error('ID de pagamento não encontrado')
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do pagamento')
      }

      const data = await response.json()
      setPaymentDetails(data)
    } catch (error) {
      console.error('Erro ao buscar detalhes do pagamento:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency = 'BRL') => {
    // Stripe retorna em centavos, Mercado Pago em reais
    const value = sessionId ? amount / 100 : amount
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'brl' ? 'BRL' : currency.toUpperCase(),
    }).format(value)
  }

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'stripe': 'Cartão de Crédito (Stripe)',
      'mercadopago': 'Mercado Pago',
      'pix': 'PIX',
      'card': 'Cartão de Crédito',
      'boleto': 'Boleto Bancário',
    }
    return methods[method] || method
  }

  const getNextStepMessage = (paymentType: string) => {
    switch (paymentType) {
      case 'appointment':
        return 'Seu agendamento foi confirmado! Você receberá um lembrete antes da consulta.'
      case 'taxi_dog':
        return 'Sua solicitação de Taxi Dog foi confirmada! O motorista entrará em contato em breve.'
      case 'service':
        return 'Seu serviço foi agendado com sucesso! Entraremos em contato para confirmar os detalhes.'
      default:
        return 'Seu pagamento foi processado com sucesso!'
    }
  }

  const getRedirectPath = (paymentType: string) => {
    switch (paymentType) {
      case 'appointment':
        return '/client/appointments'
      case 'taxi_dog':
        return '/taxi-dog/history'
      case 'service':
        return '/client'
      default:
        return '/client'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/client')} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Pagamento Aprovado!</CardTitle>
          <CardDescription className="text-lg">
            Seu pagamento foi processado com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {paymentDetails && (
            <>
              {/* Detalhes do Pagamento */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Pago:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID do Pagamento:</span>
                    <span className="text-sm font-mono">{paymentDetails.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Método:</span>
                    <Badge variant="secondary">
                      {getPaymentMethodName(paymentDetails.paymentMethod)}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {paymentDetails.status === 'complete' || paymentDetails.status === 'approved' 
                        ? 'Aprovado' 
                        : paymentDetails.status
                      }
                    </Badge>
                  </div>

                  {paymentDetails.customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm">{paymentDetails.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Próximos Passos */}
              {paymentDetails.metadata && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    {paymentDetails.metadata.paymentType === 'appointment' && (
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    {paymentDetails.metadata.paymentType === 'taxi_dog' && (
                      <Car className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    {paymentDetails.metadata.paymentType === 'service' && (
                      <Receipt className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-medium text-blue-900">Próximos Passos</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {getNextStepMessage(paymentDetails.metadata.paymentType)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
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
            
            <Button 
              onClick={() => {
                const redirectPath = paymentDetails?.metadata 
                  ? getRedirectPath(paymentDetails.metadata.paymentType)
                  : '/client'
                router.push(redirectPath)
              }}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>

          {/* Link para Comprovante */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Você receberá um comprovante por email
            </p>
            <Link 
              href="/client/payments" 
              className="text-xs text-primary hover:underline"
            >
              Ver histórico de pagamentos
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}