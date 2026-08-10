'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useChild } from '@/lib/context/ChildContext'

function themeEmoji(theme: string) {
  return theme ? theme.trim().split(' ')[0] : '🎒'
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="text-[11px] text-[#0095F6] font-semibold hover:underline transition-colors"
    >
      {copied ? '✓ Tersalin' : 'Salin'}
    </button>
  )
}

export default function BerandaPage() {
  const router                          = useRouter()
  const { children, selected, loading } = useChild()

  useEffect(() => {
    if (!loading && children.length === 0) router.push('/onboarding')
  }, [loading, children, router])

  if (loading) return (
    <>
      <DashboardHeader title="Beranda" />
      <div className="p-6 max-w-2xl space-y-4">
        <div className="h-36 bg-white border border-[#E8EAF0] rounded-2xl animate-pulse shadow-sm" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-[#E8EAF0] rounded-2xl animate-pulse shadow-sm" />)}
        </div>
      </div>
    </>
  )

  if (!selected) return null

  const xpGoal = selected.level * 1000
  const xpPct  = Math.min(100, xpGoal > 0 ? Math.round((selected.xp / xpGoal) * 100) : 0)
  const emoji  = themeEmoji(selected.theme)

  return (
    <>
      <DashboardHeader title="Beranda" />
      <div className="p-6 max-w-2xl space-y-4">

        {/* Hero card — child identity + level progress */}
        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Theme avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center text-[30px] shrink-0 shadow-sm">
              {emoji}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold text-[20px] text-[#0A0A0A] leading-tight">{selected.name}</p>
                  <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                    Kelas {selected.kelas} · {selected.theme || '—'}
                  </p>
                </div>
                {/* Child code chip */}
                <div className="flex items-center gap-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl px-3 py-1.5 shrink-0">
                  <div>
                    <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider leading-none">Kode Anak</p>
                    <p className="font-mono font-extrabold text-[16px] text-[#0095F6] leading-tight tracking-widest">
                      {selected.childCode}
                    </p>
                  </div>
                  <CopyButton text={selected.childCode} />
                </div>
              </div>

              {/* XP progress */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0095F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      Level {selected.level}
                    </span>
                    <span className="text-[12px] text-[#9CA3AF]">
                      {selected.xp} / {xpGoal} XP
                    </span>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF]">Level {selected.level + 1} →</span>
                </div>
                <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0095F6] to-[#0074CC] transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-[#F59E0B]">{selected.streak}</p>
            <p className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">🔥 Hari Streak</p>
          </div>
          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-[#0095F6]">{selected.level}</p>
            <p className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">⭐ Level</p>
          </div>
          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-extrabold text-[#22C55E]">{selected.xp}</p>
            <p className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">✨ Total XP</p>
          </div>
        </div>

        {/* Tip card — muncul kalau anak belum aktif */}
        {selected.xp === 0 && selected.streak === 0 && (
          <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-xl shrink-0">💡</span>
            <div>
              <p className="font-semibold text-[13px] text-[#92400E]">
                {selected.name} belum mulai belajar
              </p>
              <p className="text-[12px] text-[#92400E] mt-0.5 leading-relaxed">
                Berikan kode{' '}
                <span className="font-mono font-bold tracking-widest">{selected.childCode}</span>
                {' '}ke {selected.name} untuk login di aplikasi Arahami.
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
