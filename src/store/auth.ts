import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User as FirebaseUser } from 'firebase/auth'
import { User, UserRole } from '@/types'

interface AuthState {
  // Estado
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setFirebaseUser: (user: FirebaseUser | null) => void
  setLoading: (loading: boolean) => void
  login: (user: User, firebaseUser: FirebaseUser) => void
  logout: () => void
  updateProfile: (updates: Partial<User['profile']>) => void
  
  // Getters
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isAdmin: () => boolean
  isClient: () => boolean
  isDriver: () => boolean
}

export const useAuthStore = create<AuthState>()(persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      firebaseUser: null,
      isLoading: true,
      isAuthenticated: false,
      
      // Actions
      setUser: (user) => set({ user }),
      
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: (user, firebaseUser) => set({ 
        user, 
        firebaseUser, 
        isAuthenticated: true, 
        isLoading: false 
      }),
      
      logout: () => set({ 
        user: null, 
        firebaseUser: null, 
        isAuthenticated: false, 
        isLoading: false 
      }),
      
      updateProfile: (updates) => {
        const { user } = get()
        if (user) {
          set({
            user: {
              ...user,
              profile: {
                ...user.profile,
                ...updates
              }
            }
          })
        }
      },
      
      // Getters
      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },
      
      hasAnyRole: (roles) => {
        const { user } = get()
        return user ? roles.includes(user.role) : false
      },
      
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin'
      },
      
      isClient: () => {
        const { user } = get()
        return user?.role === 'client'
      },
      
      isDriver: () => {
        const { user } = get()
        return user?.role === 'driver'
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)

// Hooks personalizados para facilitar o uso
export const useAuth = () => {
  const store = useAuthStore()
  return {
    user: store.user,
    firebaseUser: store.firebaseUser,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    logout: store.logout,
    updateProfile: store.updateProfile
  }
}

export const useAuthActions = () => {
  const store = useAuthStore()
  return {
    setUser: store.setUser,
    setFirebaseUser: store.setFirebaseUser,
    setLoading: store.setLoading,
    login: store.login,
    logout: store.logout,
    updateProfile: store.updateProfile
  }
}

export const useAuthPermissions = () => {
  const store = useAuthStore()
  return {
    hasRole: store.hasRole,
    hasAnyRole: store.hasAnyRole,
    isAdmin: store.isAdmin,
    isClient: store.isClient,
    isDriver: store.isDriver
  }
}