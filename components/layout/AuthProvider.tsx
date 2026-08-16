'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { registerFcmToken, onForegroundMessage } from '@/lib/firebase/messaging'

interface AuthContextType {
  user:    User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (u) {
        document.cookie = 'arahami_auth=1; path=/; max-age=86400'
        // Daftarkan FCM token setelah login
        registerFcmToken(u.uid)
      } else {
        document.cookie = 'arahami_auth=; path=/; max-age=0'
      }
    })
    return unsubscribe
  }, [])

  // Handle foreground notifications (app sedang terbuka)
  useEffect(() => {
    const unsub = onForegroundMessage(payload => {
      const { title, body } = payload.notification ?? {}
      if (!title) return
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body: body ?? '', data: payload.data })
      })
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
