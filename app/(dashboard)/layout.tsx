'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { ChildProvider } from '@/lib/context/ChildContext'
import { useChild } from '@/lib/context/ChildContext'
import { useNoBackNavigation } from '@/lib/hooks/useNoBackNavigation'
import { useQuizNotifications } from '@/lib/hooks/useQuizNotifications'

function QuizNotifWatcher({ uid }: { uid: string }) {
  const { children } = useChild()
  useQuizNotifications(uid, children)
  return null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useNoBackNavigation()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <ChildProvider>
      <QuizNotifWatcher uid={user.uid} />
      <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ChildProvider>
  )
}
