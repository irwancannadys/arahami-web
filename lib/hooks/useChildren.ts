'use client'

import { useState, useEffect } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { childrenCol } from '@/lib/firebase/firestore-paths'
import { Child } from '@/lib/types'

export function useChildren(uid: string | undefined) {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }

    const q    = query(childrenCol(uid))
    const unsub = onSnapshot(q, (snap) => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() } as Child)))
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { children, loading }
}
