'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { query, where, onSnapshot, getDocs, orderBy, limit, addDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useChild } from '@/lib/context/ChildContext'
import { rewardsCol, sessionsCol, topicsCol, threadsCol, tipsDoc } from '@/lib/firebase/firestore-paths'
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

// ─── Tips Feed ────────────────────────────────────────────────────────────────

type TipCategory = 'Parenting' | 'Belajar' | 'Motivasi'
type TipGrade    = 'Semua Kelas' | 'Kelas 1–3' | 'Kelas 4–6'

interface Tip {
  id:       number
  category: TipCategory
  grade:    TipGrade
  emoji:    string
  text:     string
}

const CATEGORY_CONFIG: Record<TipCategory, { bg: string; text: string; dot: string }> = {
  Parenting: { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]', dot: 'bg-[#7C3AED]' },
  Belajar:   { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]' },
  Motivasi:  { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
}

const GRADE_STYLE: Record<TipGrade, { bg: string; text: string }> = {
  'Semua Kelas': { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' },
  'Kelas 1–3':   { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  'Kelas 4–6':   { bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' },
}

function TipCard({ tip, saved, onSave, onSendToChild }: {
  tip:           Tip
  saved:         boolean
  onSave:        () => void
  onSendToChild: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const cat   = CATEGORY_CONFIG[tip.category]
  const grade = GRADE_STYLE[tip.grade]

  function share() {
    navigator.clipboard.writeText(`${tip.emoji} ${tip.text}\n\n— Tips dari Arahami`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border-b border-[#F3F4F6] last:border-0 py-4 px-1">
      {/* Header row — avatar + meta */}
      <div className="flex items-start gap-3">
        {/* Avatar — emoji in colored circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[20px] shrink-0 ${cat.bg}`}>
          {tip.emoji}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[13px] font-bold ${cat.text}`}>{tip.category}</span>
            <span className={`w-1 h-1 rounded-full ${cat.dot}`} />
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${grade.bg} ${grade.text}`}>
              {tip.grade}
            </span>
          </div>

          {/* Tip text */}
          <p className="text-[14px] text-[#0A0A0A] leading-relaxed">{tip.text}</p>

          {/* Action bar — Twitter style */}
          <div className="flex items-center gap-5 pt-1">
            {/* Save/Bookmark */}
            <button
              onClick={onSave}
              className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors group ${
                saved ? 'text-[#0095F6]' : 'text-[#9CA3AF] hover:text-[#0095F6]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>{saved ? 'Tersimpan' : 'Simpan'}</span>
            </button>

            {/* Kirim ke Anak — hanya untuk Motivasi */}
            {tip.category === 'Motivasi' && (
              <button
                onClick={() => onSendToChild(tip.text)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#9CA3AF] hover:text-[#0095F6] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>Kirim ke Anak</span>
              </button>
            )}

            {/* Share */}
            <button
              onClick={share}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#9CA3AF] hover:text-[#374151] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copied ? 'Disalin!' : 'Bagikan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BerandaPage() {
  const router                                = useRouter()
  const { user }                              = useAuthContext()
  const { children, loading }                 = useChild()
  const [stats,        setStats]        = useState<Record<string, ChildStats>>({})
  const [statsLoading, setStatsLoading] = useState(true)
  const [sendModal,    setSendModal]    = useState<string | null>(null)
  const [savedTips,    setSavedTips]    = useState<Set<number>>(new Set())
  const [tips,         setTips]         = useState<Tip[] | null>(null)
  const [tipsError,    setTipsError]    = useState(false)

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

  // Fetch tips: cek Firestore cache dulu, generate via AI kalau belum ada
  useEffect(() => {
    if (!user) return
    async function loadTips() {
      setTipsError(false)
      const today = new Date().toISOString().slice(0, 10)
      try {
        const cached = await getDoc(tipsDoc(today))
        if (cached.exists()) {
          const data = cached.data()
          if (Array.isArray(data.items) && data.items.length > 0) {
            setTips(data.items)
            return
          }
        }
        const res = await fetch('/api/ai/generate-tips', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': 'arahami-secret-2026' },
          body:    JSON.stringify({}),
        })
        if (!res.ok) throw new Error('API error')
        const { tips: generated } = await res.json()
        await setDoc(tipsDoc(today), { generatedAt: serverTimestamp(), items: generated })
        setTips(generated)
      } catch {
        setTipsError(true)
      }
    }
    loadTips()
  }, [user])

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

        {/* Tips Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#374151] uppercase tracking-wide">
              Tips Parenting Hari Ini
            </p>
            <span className="text-[11px] text-[#9CA3AF]">Diperbarui setiap hari</span>
          </div>

          <div className="bg-white border border-[#E8EAF0] rounded-2xl px-4 shadow-sm divide-y divide-[#F3F4F6]">
            {tipsError ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <p className="text-[13px] text-[#737373]">Gagal memuat tips. Coba lagi.</p>
                <button
                  onClick={() => { setTips(null); setTipsError(false); if (user) {
                    const today = new Date().toISOString().slice(0, 10)
                    getDoc(tipsDoc(today)).then(cached => {
                      if (cached.exists() && Array.isArray(cached.data().items)) { setTips(cached.data().items); return }
                      fetch('/api/ai/generate-tips', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-secret': 'arahami-secret-2026' }, body: JSON.stringify({}) })
                        .then(r => r.json()).then(({ tips: g }) => { setDoc(tipsDoc(today), { generatedAt: serverTimestamp(), items: g }); setTips(g) })
                        .catch(() => setTipsError(true))
                    }).catch(() => setTipsError(true))
                  }}}
                  className="px-4 py-2 rounded-xl bg-[#0095F6] text-white text-[13px] font-semibold hover:bg-[#0074CC] transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            ) : tips === null ? (
              [1, 2, 3].map(i => (
                <div key={i} className="py-4 flex items-start gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-[#F3F4F6] rounded-full" />
                    <div className="h-3 w-full bg-[#F3F4F6] rounded-full" />
                    <div className="h-3 w-4/5 bg-[#F3F4F6] rounded-full" />
                  </div>
                </div>
              ))
            ) : (
              tips.map(tip => (
                <TipCard
                  key={tip.id}
                  tip={tip}
                  saved={savedTips.has(tip.id)}
                  onSave={() => setSavedTips(prev => {
                    const next = new Set(prev)
                    next.has(tip.id) ? next.delete(tip.id) : next.add(tip.id)
                    return next
                  })}
                  onSendToChild={text => setSendModal(text)}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Send to child modal */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[17px]">Kirim ke Anak</h3>
              <button onClick={() => setSendModal(null)} className="text-[#737373] text-[22px] leading-none">×</button>
            </div>

            {children.length > 1 && (
              <p className="text-[13px] text-[#737373]">Pilih anak yang akan menerima tips ini:</p>
            )}

            <div className="space-y-2">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={async () => {
                    if (!user) return
                    await addDoc(threadsCol(user.uid, child.id), {
                      text: `💡 Tips untuk kamu:\n\n${sendModal}`,
                      sender: 'parent',
                      replies: [],
                      createdAt: serverTimestamp(),
                    })
                    setSendModal(null)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E8EAF0] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors text-left"
                >
                  <span className="text-[20px]">{themeEmoji(child.theme)}</span>
                  <div>
                    <p className="font-semibold text-[14px]">{child.name}</p>
                    <p className="text-[12px] text-[#9CA3AF]">Kelas {child.kelas}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  )
}

function defaultStats(): ChildStats {
  return { lastSession: null, topicsTotal: 0, topicsDone: 0, pendingRewards: 0 }
}
