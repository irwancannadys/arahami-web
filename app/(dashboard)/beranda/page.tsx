'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useChild } from '@/lib/context/ChildContext'

function StatCard({ label, value, sub, color = '#0095F6' }: {
  label: string; value: string | number; sub: string; color?: string
}) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-sm">
      <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold mt-1" style={{ color }}>{value}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-0.5">{sub}</p>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-[#9CA3AF] font-semibold">{label}</p>
      <p className={`text-[14px] font-semibold mt-0.5 ${mono ? 'font-mono tracking-widest text-[#0095F6]' : 'text-[#0A0A0A]'}`}>
        {value}
      </p>
    </div>
  )
}

export default function BerandaPage() {
  const router                = useRouter()
  const { children, selected, loading } = useChild()

  // Redirect ke onboarding kalau belum ada anak
  useEffect(() => {
    if (!loading && children.length === 0) {
      router.push('/onboarding')
    }
  }, [loading, children, router])

  if (loading) return (
    <>
      <DashboardHeader title="Beranda" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white border border-[#E8EAF0] rounded-2xl p-5 space-y-2 animate-pulse shadow-sm">
              <div className="h-3 w-12 bg-[#E5E7EB] rounded" />
              <div className="h-8 w-16 bg-[#E5E7EB] rounded" />
              <div className="h-3 w-20 bg-[#E5E7EB] rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 space-y-4 animate-pulse shadow-sm">
          <div className="h-3 w-24 bg-[#E5E7EB] rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-10 bg-[#E5E7EB] rounded" />
                <div className="h-4 w-24 bg-[#E5E7EB] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  if (!selected) return null

  const xpGoal = selected.level * 1000
  const xpPct  = Math.min(100, Math.round((selected.xp / xpGoal) * 100))

  return (
    <>
      <DashboardHeader title="Beranda" subtitle={`Overview untuk ${selected.name}`} />
      <div className="p-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Level"  value={selected.level}  sub="level saat ini"              color="#0095F6" />
          <StatCard label="Streak" value={selected.streak} sub="hari berturut-turut 🔥"      color="#F59E0B" />
          <StatCard label="XP"     value={selected.xp}     sub={`dari ${xpGoal} XP`}         color="#22C55E" />
        </div>

        {/* XP Progress bar */}
        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[13px] font-bold text-[#0A0A0A]">Progress ke Level {selected.level + 1}</p>
            <p className="text-[12px] text-[#9CA3AF]">{xpPct}%</p>
          </div>
          <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0095F6] to-[#0074CC] transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-[12px] text-[#9CA3AF] mt-2">{selected.xp} / {xpGoal} XP</p>
        </div>

        {/* Child info */}
        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">
            Info Anak
          </p>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Nama"      value={selected.name} />
            <InfoRow label="Kelas"     value={`Kelas ${selected.kelas}`} />
            <InfoRow label="Tema"      value={selected.theme || '—'} />
            <InfoRow label="Kode Anak" value={selected.childCode} mono />
          </div>
        </div>

      </div>
    </>
  )
}
