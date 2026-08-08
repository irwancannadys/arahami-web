'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/layout/AuthProvider'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {children}
    </div>
  )
}
