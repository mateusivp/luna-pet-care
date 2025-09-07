'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Mail, Lock, Chrome } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  
  const router = useRouter()
  const { login } = useAuth()

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Obter token com custom claims
      const idTokenResult = await user.getIdTokenResult()
      const role = idTokenResult.claims.role as string
      
      if (!role) {
        throw new Error('Usuário sem permissões definidas')
      }
      
      await login(user, role)
      
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      })
      
      // Redirecionar baseado no role
      switch (role) {
        case 'admin':
        case 'employee':
          router.push('/admin')
          break
        case 'client':
          router.push('/client')
          break
        case 'driver':
          router.push('/driver')
          break
        default:
          router.push('/')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      let errorMessage = 'Erro ao fazer login'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado'
          break
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email inválido'
          break
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde'
          break
        default:
          errorMessage = error.message || 'Erro desconhecido'
      }
      
      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const user = userCredential.user
      
      // Verificar se é primeiro login
      const idTokenResult = await user.getIdTokenResult()
      let role = idTokenResult.claims.role as string
      
      if (!role) {
        // Primeiro login com Google - definir como cliente por padrão
        role = 'client'
        
        // Criar documento do usuário no Firestore
        const userDoc = {
          email: user.email!,
          name: user.displayName!,
          role: 'client',
          avatar: user.photoURL,
          isActive: true,
          emailVerified: user.emailVerified,
          provider: 'google',
        }
        
        // Salvar no Firestore (será processado pela Cloud Function)
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, ...userDoc }),
        })
      }
      
      await login(user, role)
      
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      })
      
      // Redirecionar baseado no role
      switch (role) {
        case 'admin':
        case 'employee':
          router.push('/admin')
          break
        case 'client':
          router.push('/client')
          break
        case 'driver':
          router.push('/driver')
          break
        default:
          router.push('/')
      }
    } catch (error: any) {
      console.error('Google login error:', error)
      
      toast({
        title: 'Erro no login com Google',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Entrar
          </CardTitle>
          <CardDescription className="text-center">
            Entre com sua conta para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "pl-10",
                    errors.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "pl-10 pr-10",
                    errors.password && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>
          
          <div className="text-center text-sm">
            Não tem uma conta?{' '}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}