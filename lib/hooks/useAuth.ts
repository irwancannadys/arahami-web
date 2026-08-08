'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase/config'

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = () => signInWithPopup(auth, provider)
  const logout           = () => signOut(auth)

  return { user, loading, signInWithGoogle, logout }
}
