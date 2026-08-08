'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onSnapshot } from 'firebase/firestore'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { childrenCol } from '@/lib/firebase/firestore-paths'
import type { Child } from '@/lib/types'

export default function BerandaPage() {
  const { user }                    = useAuthContext()
  const router                      = useRouter()
  const [children, setChildren]     = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(childrenCol(user.uid), (snap) => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data() } as Child))
      if (kids.length === 0) {
        router.push('/onboarding')
      } else {
        setChildren(kids)
        setSelectedId(prev => prev || kids[0].id)
        setLoading(false)
      }
    })
    return unsub
  }, [user, router])

  if (loading) return null

  const child = children.find(c => c.id === selectedId) ?? children[0]

  return (
    <>
      <DashboardHeader title="Beranda" subtitle="Overview anak kamu" />
      <div className="p-6 space-y-4">

        {/* Child selector — hanya tampil kalau lebih dari 1 anak */}
        {children.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`px-4 py-2 rounded-xl border text-[14px] font-semibold transition-colors ${
                  selectedId === c.id
                    ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]'
                    : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
                }`}
              >
                {c.name} · Kelas {c.kelas}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Level"  value={`${child.level}`}  sub="level saat ini" />
          <StatCard label="XP"     value={`${child.xp}`}     sub={`dari ${child.level * 1000} XP`} />
          <StatCard label="Streak" value={`${child.streak}`} sub="hari berturut-turut 🔥" />
        </div>

        {/* Child info */}
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-[#737373] uppercase tracking-wide mb-4">
            Info Anak — {child.name}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Nama"      value={child.name} />
            <InfoRow label="Kelas"     value={`Kelas ${child.kelas}`} />
            <InfoRow label="Tema"      value={child.theme || '—'} />
            <InfoRow label="Kode Anak" value={child.childCode} mono />
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5">
      <p className="text-[11px] font-bold text-[#737373] uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold mt-1">{value}</p>
      <p className="text-[12px] text-[#737373] mt-0.5">{sub}</p>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-[#737373] font-semibold">{label}</p>
      <p className={`text-[14px] font-semibold mt-0.5 ${mono ? 'font-mono tracking-widest text-[#0095F6]' : ''}`}>
        {value}
      </p>
    </div>
  )
}
