import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

interface TokenPayload {
  uid: string
  email: string
  role: 'admin' | 'employee' | 'client' | 'driver'
  customClaims?: Record<string, any>
  exp: number
}

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth/callback',
  '/api/webhooks',
  '/api/health'
]

// Rotas que precisam de autenticação
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/client',
  '/driver',
  '/profile',
  '/appointments',
  '/pets',
  '/services',
  '/taxi-dog'
]

// Rotas específicas por role
const roleRoutes = {
  admin: ['/admin'],
  client: ['/client', '/appointments', '/pets', '/taxi-dog'],
  driver: ['/driver', '/taxi-dog'],
  employee: ['/admin/appointments', '/admin/clients', '/admin/pets']
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Permitir acesso a rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Permitir acesso a arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // arquivos com extensão
  ) {
    return NextResponse.next()
  }

  // Verificar se a rota precisa de autenticação
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Se não há token, redirecionar para login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verificar e decodificar o token JWT
    const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: TokenPayload }
    
    // Verificar se o token não expirou
    if (payload.exp < Date.now() / 1000) {
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth-token')
      return response
    }

    const userRole = payload.role
    const customClaims = payload.customClaims || {}

    // Verificar se o usuário tem permissão para acessar a rota
    const hasRoleAccess = checkRoleAccess(pathname, userRole, customClaims)
    
    if (!hasRoleAccess) {
      // Redirecionar para dashboard apropriado baseado no role
      const dashboardUrl = getDashboardByRole(userRole)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // Adicionar headers com informações do usuário
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.uid)
    response.headers.set('x-user-role', userRole)
    response.headers.set('x-user-email', payload.email)
    
    return response

  } catch (error) {
    console.error('Erro na verificação do token:', error)
    
    // Token inválido, redirecionar para login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('auth-token')
    
    return response
  }
}

function checkRoleAccess(
  pathname: string, 
  userRole: string, 
  customClaims: Record<string, any>
): boolean {
  // Admin tem acesso a tudo
  if (userRole === 'admin' || customClaims?.admin === true) {
    return true
  }

  // Verificar acesso específico por role
  const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || []
  
  // Verificar se a rota está permitida para o role
  const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))
  
  if (hasAccess) {
    return true
  }

  // Verificar rotas gerais do dashboard
  if (pathname.startsWith('/dashboard')) {
    return true
  }

  // Verificar rotas de perfil (todos podem acessar)
  if (pathname.startsWith('/profile')) {
    return true
  }

  return false
}

function getDashboardByRole(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'client':
      return '/client'
    case 'driver':
      return '/driver'
    case 'employee':
      return '/admin/appointments'
    default:
      return '/dashboard'
  }
}
    


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}