# 🐾 Luna Pet Care - Sistema SaaS para Petshops

Um sistema completo de gestão para petshops com funcionalidades avançadas de agendamento, pagamentos, notificações e serviço de Taxi Dog.

## 🚀 Funcionalidades Principais

### 👨‍💼 Painel Administrativo
- **Dashboard Completo**: Métricas em tempo real, gráficos de receita e agendamentos
- **Gestão de Clientes**: CRUD completo com histórico de serviços
- **Gestão de Pets**: Cadastro detalhado com fotos e informações médicas
- **Gestão de Serviços**: Configuração de preços, duração e disponibilidade
- **Agendamentos**: Calendário interativo com status em tempo real
- **Relatórios**: Analytics detalhados de vendas e performance

### 👤 Painel do Cliente
- **Dashboard Personalizado**: Visão geral dos pets e próximos agendamentos
- **Cadastro de Pets**: Interface intuitiva para adicionar e gerenciar pets
- **Agendamento Online**: Sistema de reservas com disponibilidade em tempo real
- **Histórico de Serviços**: Acompanhamento completo dos atendimentos
- **Notificações**: Lembretes e atualizações via push notifications

### 🚗 Taxi Dog
- **Mapa Interativo**: Integração com Google Maps para rastreamento
- **Status em Tempo Real**: Acompanhamento da localização do pet
- **Agendamento de Transporte**: Sistema integrado de coleta e entrega
- **Notificações de Trajeto**: Updates automáticos para clientes

### 💳 Sistema de Pagamentos
- **Stripe Integration**: Pagamentos internacionais com cartão
- **Mercado Pago**: Pagamentos locais incluindo PIX
- **Webhooks**: Processamento automático de confirmações
- **Gestão de Assinaturas**: Planos recorrentes para clientes

### 🔔 Sistema de Notificações
- **Push Notifications**: Notificações em tempo real via FCM
- **Email Notifications**: Confirmações e lembretes automáticos
- **SMS Integration**: Alertas importantes via SMS
- **Notificações Personalizadas**: Configuração por tipo de evento

## 🛠 Tecnologias Utilizadas

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn/UI**: Componentes UI modernos e acessíveis
- **Lucide React**: Ícones SVG otimizados

### Backend & Database
- **Firebase Auth**: Autenticação com RBAC
- **Firestore**: Banco de dados NoSQL em tempo real
- **Firebase Storage**: Armazenamento de arquivos
- **Firebase Functions**: Funções serverless
- **Firebase Cloud Messaging**: Push notifications

### Pagamentos
- **Stripe**: Processamento de pagamentos internacionais
- **Mercado Pago**: Pagamentos locais e PIX

### Mapas & Localização
- **Google Maps API**: Integração completa de mapas
- **Geolocation API**: Rastreamento de localização

### Deploy & CI/CD
- **Vercel**: Hospedagem e deploy automático
- **GitHub Actions**: Pipeline de CI/CD
- **ESLint**: Linting e qualidade de código

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Firebase
- Conta Stripe (opcional)
- Conta Mercado Pago (opcional)
- Google Maps API Key

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/luna-pet-care.git
cd luna-pet-care
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... outras variáveis
```

### 4. Configure o Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication, Firestore, Storage e Cloud Messaging
3. Configure as regras de segurança usando os arquivos `firestore.rules` e `storage.rules`
4. Faça deploy das regras:
```bash
firebase deploy --only firestore:rules,storage
```

### 5. Configure os pagamentos (opcional)
- **Stripe**: Obtenha as chaves em [Stripe Dashboard](https://dashboard.stripe.com)
- **Mercado Pago**: Configure em [Mercado Pago Developers](https://www.mercadopago.com.br/developers)

### 6. Execute o projeto
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🔧 Configuração

### Firebase

1. **Authentication**
   - Ative Email/Password
   - Configure domínios autorizados

2. **Firestore**
   - Configure as regras de segurança
   - Crie os índices necessários

3. **Storage**
   - Configure regras para upload de imagens

### Stripe

1. Configure webhooks para:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### Google Maps

1. Ative as APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Distance Matrix API

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/            # Rotas de autenticação
│   ├── admin/             # Dashboard administrativo
│   ├── client/            # Portal do cliente
│   ├── driver/            # App do motorista
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/                # Componentes base (Radix UI)
│   ├── forms/             # Formulários
│   ├── charts/            # Gráficos e relatórios
│   └── providers/         # Context Providers
├── lib/                   # Utilitários e configurações
│   ├── firebase/          # Configuração Firebase
│   ├── stripe/            # Configuração Stripe
│   └── utils.ts           # Funções utilitárias
├── store/                 # Estado global (Zustand)
├── types/                 # Tipos TypeScript
└── styles/                # Estilos globais
```

## 🔐 Autenticação e Autorização

O sistema utiliza Firebase Auth com controle de acesso baseado em roles:

- **admin**: Acesso total ao sistema
- **client**: Acesso ao portal do cliente
- **driver**: Acesso ao app do motorista
- **employee**: Acesso limitado ao dashboard

## 📊 Banco de Dados

### Coleções Principais

- `users`: Usuários do sistema
- `clients`: Clientes dos pet shops
- `pets`: Pets dos clientes
- `services`: Serviços oferecidos
- `appointments`: Agendamentos
- `taxiRides`: Corridas do Taxi Dog
- `payments`: Pagamentos
- `notifications`: Notificações

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Docker

```bash
docker build -t petshop-saas .
docker run -p 3000:3000 petshop-saas
```

## 📈 Monitoramento

- **Sentry**: Monitoramento de erros
- **Firebase Analytics**: Métricas de uso
- **Stripe Dashboard**: Métricas financeiras

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Build para produção
- `npm run start`: Inicia o servidor de produção
- `npm run lint`: Executa o linter
- `npm run type-check`: Verifica tipos TypeScript

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- Email: support@petshopsaas.com
- Discord: [Link do servidor]
- Documentação: [Link da documentação]

## 🔄 Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para histórico de versões.

---

**Desenvolvido com ❤️ para a comunidade pet**