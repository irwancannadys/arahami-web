'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useChild } from '@/lib/context/ChildContext'
import { rewardsCol, sessionsCol, topicsCol } from '@/lib/firebase/firestore-paths'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { themeEmoji, themeGradient } from '@/lib/theme'
import { subjectDisplayName } from '@/lib/types'
import type { Child, QuizSession } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMs(ts: any): number {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts instanceof Date) return ts.getTime()
  return 0
}

function timeAgo(ts: any): string {
  const ms   = toMs(ts)
  if (!ms) return ''
  const diff = Date.now() - ms
  const m    = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  const d    = Math.floor(diff / 86400000)
  if (m < 1)  return 'Baru saja'
  if (h < 1)  return `${m} mnt lalu`
  if (h < 24) return `${h} jam lalu`
  if (d < 7)  return `${d} hari lalu`
  return `${Math.floor(d / 7)} minggu lalu`
}

function stars(score: number) {
  if (score === 100) return '⭐⭐⭐'
  if (score >= 70)   return '⭐⭐'
  return '⭐'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChildStats = {
  lastSession:  QuizSession | null
  topicsTotal:  number
  topicsDone:   number
  pendingRewards: number
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="h-56 bg-white border border-[#E8EAF0] rounded-2xl animate-pulse shadow-sm" />
      ))}
    </div>
  )
}

// ─── Child Card ───────────────────────────────────────────────────────────────

function ChildCard({ child, stats }: { child: Child; stats: ChildStats }) {
  const xpGoal = child.level * 1000
  const xpPct  = Math.min(100, xpGoal > 0 ? Math.round((child.xp / xpGoal) * 100) : 0)
  const emoji  = themeEmoji(child.theme)
  const colors = themeGradient(child.theme)
  const hasActivity = !!stats.lastSession

  return (
    <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-sm overflow-hidden">

      {/* Header strip */}
      <div className="px-5 pt-4 pb-4" style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center text-[22px] shadow-sm shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-extrabold text-[16px] text-[#0A0A0A] leading-tight">{child.name}</p>
              {stats.pendingRewards > 0 && (
                <span className="flex items-center gap-1 bg-[#FEF3C7] border border-[#FCD34D] rounded-full px-2 py-0.5">
                  <span className="text-[11px]">🎁</span>
                  <span className="text-[11px] font-bold text-[#92400E]">{stats.pendingRewards}</span>
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#374151] mt-0.5">Kelas {child.kelas}</p>
          </div>
          {/* Level badge */}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg text-white shrink-0" style={{ background: colors.accent }}>
            Lv.{child.level}
          </span>
        </div>

        {/* XP bar — compact */}
        <div className="mt-3 space-y-1">
          <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${xpPct}%`, background: colors.accent }}
            />
          </div>
          <p className="text-[10px] text-[#374151]/60">{child.xp} / {xpGoal} XP</p>
        </div>
      </div>

      {/* Body — aktivitas */}
      <div className="px-5 py-4 space-y-3">
        {hasActivity ? (
          <>
            {/* Last session */}
            <div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Terakhir belajar</p>
              <div className="flex items-start gap-2.5">
                <div
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-white shrink-0 mt-0.5"
                  style={{ background: colors.accent }}
                >
                  {subjectDisplayName(stats.lastSession!.subject).slice(0, 3).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0A0A0A] leading-snug truncate">
                    {stats.lastSession!.topicName}
                  </p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                    {stars(stats.lastSession!.score)} {stats.lastSession!.score}
                    <span className="mx-1.5 opacity-40">·</span>
                    {timeAgo(stats.lastSession!.date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Topics progress + streak */}
            <div className="flex items-center justify-between pt-1 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px]">📚</span>
                <span className="text-[12px] text-[#374151]">
                  <span className="font-semibold">{stats.topicsDone}</span>
                  <span className="text-[#9CA3AF]">/{stats.topicsTotal} topik selesai</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#9CA3AF]">
                <span className="text-[12px]">🔥</span>
                <span className="text-[12px]">{child.streak} hari</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Belum mulai */}
            <div className="flex items-start gap-2.5">
              <span className="text-[18px] shrink-0">💡</span>
              <div>
                <p className="text-[13px] font-semibold text-[#374151]">Belum mulai belajar</p>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5 leading-relaxed">
                  Berikan kode{' '}
                  <span className="font-mono font-bold text-[#0095F6]">{child.childCode}</span>
                  {' '}ke {child.name} untuk login.
                </p>
              </div>
            </div>

            {/* Topics available */}
            {stats.topicsTotal > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-[#F3F4F6]">
                <span className="text-[12px] text-[#9CA3AF]">
                  <span className="font-semibold text-[#374151]">{stats.topicsTotal}</span> topik siap
                </span>
                <div className="flex items-center gap-1 text-[#9CA3AF]">
                  <span className="text-[12px]">🔥</span>
                  <span className="text-[12px]">0 hari</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BerandaPage() {
  const router                                = useRouter()
  const { user }                              = useAuthContext()
  const { children, loading }                 = useChild()
  const [stats,    setStats]                  = useState<Record<string, ChildStats>>({})
  const [statsLoading, setStatsLoading]       = useState(true)

  useEffect(() => {
    if (!loading && children.length === 0) router.push('/onboarding')
  }, [loading, children, router])

  // Fetch stats per child
  useEffect(() => {
    if (!user || children.length === 0) return

    setStatsLoading(true)

    // Real-time pending rewards
    const rewardUnsubs = children.map(child =>
      onSnapshot(
        query(rewardsCol(user.uid, child.id), where('status', '==', 'PENDING')),
        snap => setStats(prev => ({
          ...prev,
          [child.id]: { ...defaultStats(), ...prev[child.id], pendingRewards: snap.size },
        }))
      )
    )

    // One-time: last session + topics per child
    Promise.all(children.map(async child => {
      const [sessSnap, topicsSnap] = await Promise.all([
        getDocs(query(sessionsCol(user.uid, child.id), orderBy('date', 'desc'), limit(1))),
        getDocs(topicsCol(user.uid, child.id)),
      ])
      const lastSession  = sessSnap.empty ? null : { id: sessSnap.docs[0].id, ...sessSnap.docs[0].data() } as QuizSession
      const allTopics    = topicsSnap.docs.map(d => d.data())
      const topicsTotal  = allTopics.length
      const topicsDone   = allTopics.filter(t => t.isDone).length

      setStats(prev => ({
        ...prev,
        [child.id]: { ...defaultStats(), ...prev[child.id], lastSession, topicsTotal, topicsDone },
      }))
    })).finally(() => setStatsLoading(false))

    return () => rewardUnsubs.forEach(u => u())
  }, [user, children])

  const isLoading    = loading || statsLoading
  const displayName  = user?.displayName?.split(' ')[0] ?? 'Ortu'
  const totalPending = Object.values(stats).reduce((s, c) => s + (c.pendingRewards ?? 0), 0)

  if (isLoading) return (
    <>
      <DashboardHeader title="Beranda" />
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="h-8 w-40 bg-[#F3F4F6] rounded-xl animate-pulse" />
        <Skeleton />
      </div>
    </>
  )

  return (
    <>
      <DashboardHeader title="Beranda" />
      <div className="p-6 max-w-4xl mx-auto space-y-5">

        <h1 className="font-extrabold text-[22px] text-[#0A0A0A]">
          Halo, {displayName}! 👋
        </h1>

        <div className={`grid gap-4 ${children.length === 1 ? 'grid-cols-1 max-w-lg' : 'grid-cols-1 md:grid-cols-2'}`}>
          {children.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              stats={stats[child.id] ?? defaultStats()}
            />
          ))}
        </div>

        {totalPending > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl p-4 flex items-start gap-3 max-w-lg">
            <span className="text-xl shrink-0">🎁</span>
            <div>
              <p className="font-semibold text-[13px] text-[#92400E]">
                Ada {totalPending} reward menunggu persetujuan
              </p>
              <p className="text-[12px] text-[#92400E] mt-0.5">
                Buka tab <span className="font-bold">Reward</span> untuk menyetujuinya.
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

function defaultStats(): ChildStats {
  return { lastSession: null, topicsTotal: 0, topicsDone: 0, pendingRewards: 0 }
}
