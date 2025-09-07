'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  CreditCard,
  Smartphone,
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'

// Inicializar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentData: {
    amount: number
    title: string
    description: string
    serviceType: string
    paymentType: 'appointment' | 'taxi_dog' | 'product' | 'service'
    petId?: string
    appointmentId?: string
    taxiRequestId?: string
  }
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
}

export function CheckoutDialog({
  open,
  onOpenChange,
  paymentData,
  onSuccess,
  onError,
}: CheckoutDialogProps) {
  const { user } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'mercadopago' | 'pix'>('stripe')
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount)
  }

  const handleStripePayment = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      const token = await user.getIdToken()
      
      const response = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          serviceType: paymentData.serviceType,
          paymentType: paymentData.paymentType,
          petId: paymentData.petId,
          appointmentId: paymentData.appointmentId,
          taxiRequestId: paymentData.taxiRequestId,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payments/cancel`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento')
      }

      // Redirecionar para o Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Erro ao carregar Stripe')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Erro no pagamento Stripe:', error)
      setPaymentStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleMercadoPagoPayment = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      const token = await user.getIdToken()
      
      const response = await fetch('/api/payments/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: paymentData.title,
          description: paymentData.description,
          price: paymentData.amount,
          serviceType: paymentData.serviceType,
          paymentType: paymentData.paymentType,
          petId: paymentData.petId,
          appointmentId: paymentData.appointmentId,
          taxiRequestId: paymentData.taxiRequestId,
          payerEmail: user.email,
          successUrl: `${window.location.origin}/payments/success`,
          failureUrl: `${window.location.origin}/payments/failure`,
          pendingUrl: `${window.location.origin}/payments/pending`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar preferência de pagamento')
      }

      // Redirecionar para o Mercado Pago
      window.location.href = data.init_point
    } catch (error) {
      console.error('Erro no pagamento Mercado Pago:', error)
      setPaymentStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePixPayment = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      const token = await user.getIdToken()
      
      const response = await fetch('/api/payments/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: paymentData.title,
          description: paymentData.description,
          price: paymentData.amount,
          serviceType: paymentData.serviceType,
          paymentType: paymentData.paymentType,
          paymentMethod: 'pix',
          petId: paymentData.petId,
          appointmentId: paymentData.appointmentId,
          taxiRequestId: paymentData.taxiRequestId,
          payerEmail: user.email,
          successUrl: `${window.location.origin}/payments/success`,
          failureUrl: `${window.location.origin}/payments/failure`,
          pendingUrl: `${window.location.origin}/payments/pending`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento PIX')
      }

      setPixData(data)
      setPaymentStatus('success')
      toast.success('QR Code PIX gerado com sucesso!')
    } catch (error) {
      console.error('Erro no pagamento PIX:', error)
      setPaymentStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    switch (selectedMethod) {
      case 'stripe':
        handleStripePayment()
        break
      case 'mercadopago':
        handleMercadoPagoPayment()
        break
      case 'pix':
        handlePixPayment()
        break
    }
  }

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      toast.success('Código PIX copiado!')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Pagamento</DialogTitle>
          <DialogDescription>
            Escolha o método de pagamento para {paymentData.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do Pagamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{paymentData.title}</CardTitle>
              <CardDescription>{paymentData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          {paymentStatus === 'idle' && (
            <div className="space-y-3">
              <h4 className="font-medium">Escolha o método de pagamento:</h4>
              
              {/* Stripe */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'stripe' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedMethod('stripe')}
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <CreditCard className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                  </div>
                  <Badge variant="secondary">Stripe</Badge>
                </CardContent>
              </Card>

              {/* Mercado Pago */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'mercadopago' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedMethod('mercadopago')}
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <Receipt className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Mercado Pago</p>
                    <p className="text-sm text-muted-foreground">Cartão, PIX, Boleto</p>
                  </div>
                  <Badge variant="secondary">MP</Badge>
                </CardContent>
              </Card>

              {/* PIX */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'pix' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedMethod('pix')}
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <Smartphone className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                  <Badge variant="secondary">Instantâneo</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status do Pagamento */}
          {paymentStatus === 'processing' && (
            <Card>
              <CardContent className="flex items-center justify-center space-x-2 p-6">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processando pagamento...</span>
              </CardContent>
            </Card>
          )}

          {paymentStatus === 'success' && pixData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>PIX Gerado com Sucesso!</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pixData.qr_code_base64 && (
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code ou copie o código PIX:
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyPixCode}
                      className="flex-1"
                    >
                      Copiar Código PIX
                    </Button>
                    {pixData.ticket_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(pixData.ticket_url, '_blank')}
                      >
                        Ver Comprovante
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Pagamento expira em 30 minutos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStatus === 'error' && (
            <Card>
              <CardContent className="flex items-center justify-center space-x-2 p-6 text-red-500">
                <XCircle className="h-5 w-5" />
                <span>Erro no processamento do pagamento</span>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          {paymentStatus === 'idle' && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pagar {formatCurrency(paymentData.amount)}
              </Button>
            </div>
          )}

          {paymentStatus === 'success' && pixData && (
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}