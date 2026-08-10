'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { childrenCol } from '@/lib/firebase/firestore-paths'
import { useAuthContext } from '@/components/layout/AuthProvider'
import type { Child } from '@/lib/types'

interface ChildContextValue {
  children:    Child[]
  selected:    Child | null
  setSelected: (c: Child) => void
  loading:     boolean
}

const ChildCtx = createContext<ChildContextValue>({
  children: [], selected: null, setSelected: () => {}, loading: true,
})

export function ChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { user }                    = useAuthContext()
  const [kids,     setKids]         = useState<Child[]>([])
  const [selected, setSelectedState] = useState<Child | null>(null)
  const [loading,  setLoading]      = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(childrenCol(user.uid), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Child))
      setKids(list)
      // Keep current selection if still valid, else default to first
      setSelectedState(prev =>
        prev ? (list.find(c => c.id === prev.id) ?? list[0] ?? null) : (list[0] ?? null)
      )
      setLoading(false)
    })
    return unsub
  }, [user])

  function setSelected(c: Child) { setSelectedState(c) }

  return (
    <ChildCtx.Provider value={{ children: kids, selected, setSelected, loading }}>
      {reactChildren}
    </ChildCtx.Provider>
  )
}

export const useChild = () => useContext(ChildCtx)
