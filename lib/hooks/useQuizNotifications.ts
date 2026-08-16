import { useEffect, useRef } from 'react'
import { query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { sessionsCol } from '@/lib/firebase/firestore-paths'
import { subjectDisplayName } from '@/lib/types'
import type { Child } from '@/lib/types'

// Notif hanya untuk session yang dibuat dalam 2 menit terakhir
const RECENCY_MS = 2 * 60 * 1000

function toMs(ts: any): number {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts instanceof Date) return ts.getTime()
  return 0
}

export function useQuizNotifications(uid: string | null, children: Child[]) {
  // Simpan session IDs yang sudah dinotif — hindari notif duplikat
  const notifiedIds = useRef<Set<string>>(new Set())
  // Tunggu sebentar setelah mount sebelum mulai notif (hindari notif dari data lama)
  const readyRef = useRef(false)

  useEffect(() => {
    if (!uid || children.length === 0) return

    // Delay 3 detik setelah mount baru mulai notif — biar initial data load tidak trigger
    const timer = setTimeout(() => { readyRef.current = true }, 3000)

    const unsubs = children.map(child =>
      onSnapshot(
        query(sessionsCol(uid, child.id), orderBy('date', 'desc'), limit(1)),
        snap => {
          if (!readyRef.current) return
          snap.docChanges().forEach(change => {
            if (change.type !== 'added') return
            const id  = change.doc.id
            if (notifiedIds.current.has(id)) return

            const data = change.doc.data()
            const ms   = toMs(data.date)
            if (!ms || Date.now() - ms > RECENCY_MS) return

            notifiedIds.current.add(id)

            const subject = subjectDisplayName(data.subject ?? '')
            const score   = data.score ?? 0
            const stars   = score === 100 ? '⭐⭐⭐' : score >= 70 ? '⭐⭐' : '⭐'

            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(`📚 ${child.name} selesai kuis!`, {
                body: `${subject} — ${data.topicName ?? ''} · Skor ${score} ${stars}`,
                data: { type: 'quiz_done', childId: child.id },
              })
            })
          })
        }
      )
    )

    return () => {
      clearTimeout(timer)
      unsubs.forEach(u => u())
    }
  }, [uid, children])
}
