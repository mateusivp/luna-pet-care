import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, MapPin, Calendar, Users, Shield, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">PetShop SaaS</span>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestão Completa para seu
            <span className="text-blue-600"> Petshop</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistema completo com painel administrativo, área do cliente e módulo Taxi Dog.
            Gerencie agendamentos, clientes, pets e muito mais em uma única plataforma.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Começar Gratuitamente
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Funcionalidades Principais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Agendamentos</CardTitle>
                <CardDescription>
                  Sistema completo de agendamentos com calendário interativo e notificações automáticas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Gestão de Clientes</CardTitle>
                <CardDescription>
                  Cadastro completo de clientes e pets com histórico detalhado e análise de LTV.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Taxi Dog</CardTitle>
                <CardDescription>
                  Módulo exclusivo para busca e entrega de pets com rastreamento em tempo real.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Sistema seguro com autenticação Firebase, controle de acesso por roles e 2FA.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Multi-plataforma</CardTitle>
                <CardDescription>
                  Acesse de qualquer dispositivo com interface responsiva e app mobile.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Fidelização</CardTitle>
                <CardDescription>
                  Sistema de pontos, cupons e campanhas de marketing para fidelizar clientes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para revolucionar seu petshop?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de petshops que já transformaram sua gestão com nossa plataforma.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Começar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">PetShop SaaS</span>
              </div>
              <p className="text-gray-400">
                A solução completa para gestão de petshops.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Funcionalidades</Link></li>
                <li><Link href="/pricing">Preços</Link></li>
                <li><Link href="/demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Central de Ajuda</Link></li>
                <li><Link href="/contact">Contato</Link></li>
                <li><Link href="/docs">Documentação</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">Sobre</Link></li>
                <li><Link href="/privacy">Privacidade</Link></li>
                <li><Link href="/terms">Termos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PetShop SaaS. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}