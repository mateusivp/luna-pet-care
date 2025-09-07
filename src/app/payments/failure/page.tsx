'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XCircle, ArrowLeft, RefreshCw, CreditCard, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFailurePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  // Obter parâmetros da URL
  const paymentId = searchParams.get('payment_id')
  const collectionId = searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status')
  const preferenceId = searchParams.get('preference_id')
  const externalReference = searchParams.get('external_reference')
  const paymentType = searchParams.get('payment_type')

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  const getFailureReason = (status: string | null) => {
    const reasons: Record<string, string> = {
      'rejected': 'Pagamento rejeitado pelo banco ou operadora',
      'cancelled': 'Pagamento cancelado pelo usuário',
      'failure': 'Falha no processamento do pagamento',
      'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão',
      'cc_rejected_bad_filled_card_number': 'Número do cartão inválido',
      'cc_rejected_bad_filled_date': 'Data de vencimento inválida',
      'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
      'cc_rejected_bad_filled_other': 'Dados do cartão incorretos',
      'cc_rejected_high_risk': 'Pagamento rejeitado por segurança',
      'cc_rejected_max_attempts': 'Muitas tentativas de pagamento',
      'cc_rejected_duplicated_payment': 'Pagamento duplicado detectado',
    }
    return reasons[status || ''] || 'Erro no processamento do pagamento'
  }

  const getSuggestion = (status: string | null) => {
    const suggestions: Record<string, string> = {
      'cc_rejected_insufficient_amount': 'Verifique o saldo do seu cartão ou use outro método de pagamento',
      'cc_rejected_bad_filled_card_number': 'Verifique o número do cartão e tente novamente',
      'cc_rejected_bad_filled_date': 'Verifique a data de vencimento do cartão',
      'cc_rejected_bad_filled_security_code': 'Verifique o código de segurança (CVV) do cartão',
      'cc_rejected_bad_filled_other': 'Verifique todos os dados do cartão',
      'cc_rejected_high_risk': 'Entre em contato com seu banco para autorizar a transação',
      'cc_rejected_max_attempts': 'Aguarde alguns minutos antes de tentar novamente',
      'cc_rejected_duplicated_payment': 'Verifique se o pagamento já foi processado',
    }
    return suggestions[status || ''] || 'Tente novamente ou use outro método de pagamento'
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

  const handleRetryPayment = () => {
    // Redirecionar de volta para a página de origem para tentar novamente
    const redirectPath = getRedirectPath(paymentType)
    router.push(redirectPath)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Pagamento Não Aprovado</CardTitle>
          <CardDescription className="text-lg">
            Não foi possível processar seu pagamento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalhes do Erro */}
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Motivo da Falha</h4>
              <p className="text-sm text-red-700">
                {getFailureReason(collectionStatus)}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">O que fazer agora?</h4>
              <p className="text-sm text-blue-700">
                {getSuggestion(collectionStatus)}
              </p>
            </div>
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

              {collectionStatus && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="destructive">
                    {collectionStatus === 'rejected' ? 'Rejeitado' : 
                     collectionStatus === 'cancelled' ? 'Cancelado' : 
                     collectionStatus === 'failure' ? 'Falha' : 
                     collectionStatus}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Opções de Pagamento Alternativas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Métodos de Pagamento Alternativos</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Tente com outro cartão de crédito</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-bold">P</span>
                </div>
                <span>Use PIX para pagamento instantâneo</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-bold">B</span>
                </div>
                <span>Pague com boleto bancário</span>
              </div>
            </div>
          </div>

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
              onClick={handleRetryPayment}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>

          {/* Links de Ajuda */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span>Precisa de ajuda?</span>
            </div>
            <div className="space-x-4">
              <Link 
                href="/support" 
                className="text-sm text-primary hover:underline"
              >
                Central de Ajuda
              </Link>
              <Link 
                href="/contact" 
                className="text-sm text-primary hover:underline"
              >
                Fale Conosco
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}