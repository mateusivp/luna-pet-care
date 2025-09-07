'use client'

import { useEffect } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/auth'
import { User } from '@/types'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setFirebaseUser, setLoading, login, logout } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true)
      
      if (firebaseUser) {
        try {
          // Buscar dados completos do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User
            login(userData, firebaseUser)
          } else {
            // Se não existe no Firestore, criar um usuário básico
            const basicUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'client', // role padrão
              orgId: '', // será definido posteriormente
              profile: {
                name: firebaseUser.displayName || '',
                phone: firebaseUser.phoneNumber || '',
                avatar: firebaseUser.photoURL || undefined
              },
              settings: {
                notifications: true,
                twoFactorEnabled: false
              },
              createdAt: new Date() as any,
              updatedAt: new Date() as any
            }
            
            login(basicUser, firebaseUser)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          logout()
        }
      } else {
        logout()
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setFirebaseUser, setLoading, login, logout])

  return <>{children}</>
}