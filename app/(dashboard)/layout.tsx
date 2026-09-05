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

  if (loading || !user) return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      <aside className="w-60 shrink-0 h-screen bg-white border-r border-[#E8EAF0] p-5 space-y-3">
        <div className="h-8 w-28 bg-[#F3F4F6] rounded-lg animate-pulse" />
        <div className="h-14 bg-[#F3F4F6] rounded-xl animate-pulse" />
        <div className="h-10 bg-[#F3F4F6] rounded-xl animate-pulse mt-6" />
        <div className="h-10 bg-[#F3F4F6] rounded-xl animate-pulse" />
        <div className="h-10 bg-[#F3F4F6] rounded-xl animate-pulse" />
        <div className="h-10 bg-[#F3F4F6] rounded-xl animate-pulse" />
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="h-8 w-48 bg-[#F3F4F6] rounded-lg animate-pulse" />
          <div className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />
          <div className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />
        </div>
      </main>
    </div>
  )

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
