'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { ChildProvider } from '@/lib/context/ChildContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <ChildProvider>
      <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ChildProvider>
  )
}
