'use client'

import { useEffect, useState } from 'react'
import { onSnapshot, query, orderBy } from 'firebase/firestore'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useChild } from '@/lib/context/ChildContext'
import { sessionsCol, topicsCol } from '@/lib/firebase/firestore-paths'
import type { QuizSession, Topic } from '@/lib/types'
import { subjectDisplayName } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMs(ts: any): number {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts instanceof Date) return ts.getTime()
  return 0
}

function toDate(ts: any): Date | undefined {
  if (!ts) return undefined
  if (typeof ts.toDate === 'function') return ts.toDate()
  if (ts instanceof Date) return ts
  return undefined
}

function dateLabel(ts: any): string {
  const ms   = toMs(ts)
  if (!ms) return ''
  const diff = Math.floor((Date.now() - ms) / 86400000)
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Kemarin'
  return `${diff} hari lalu`
}

function stars(score: number) {
  if (score === 100) return '⭐⭐⭐'
  if (score >= 70)   return '⭐⭐'
  return '⭐'
}

function xpFromScore(score: number, totalQ: number) {
  return Math.round((score / 100) * totalQ * 10)
}

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d
}

const SUBJECT_COLOR: Record<string, string> = {
  MTK: '#8B5CF6', B_INDO: '#0095F6', IPA: '#22C55E', IPS: '#F59E0B',
  AGAMA: '#7C3AED', SENI: '#EC4899', PJOK: '#F97316',
  PANCASILA: '#3B82F6', ENGLISH: '#14B8A6',
}

const PERIODS  = ['7 Hari', '30 Hari', 'Semua'] as const
type Period = typeof PERIODS[number]

type SessionWithChild = QuizSession & { childName: string }
type TopicWithChild   = Topic       & { childName: string }

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-48 bg-[#F3F4F6] rounded-2xl animate-pulse" />
      <div className="h-48 bg-[#F3F4F6] rounded-2xl animate-pulse" />
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#0095F6' }: {
  label: string; value: string | number; sub: string; color?: string
}) {
  return (
    <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5">
      <p className="text-[11px] font-bold text-[#737373] uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold mt-1" style={{ color }}>{value}</p>
      <p className="text-[12px] text-[#737373] mt-0.5">{sub}</p>
    </div>
  )
}

function XpTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#DBDBDB] rounded-xl px-3 py-2 shadow-md">
      <p className="text-[12px] font-semibold">{label}</p>
      <p className="text-[13px] font-bold text-[#FBBF24]">+{payload[0].value} XP</p>
    </div>
  )
}

function SessionCard({ session }: { session: SessionWithChild }) {
  const color = SUBJECT_COLOR[session.subject] ?? '#0095F6'
  const xp    = xpFromScore(session.score, session.totalQ)
  return (
    <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[12px] font-extrabold"
        style={{ background: color }}
      >
        {subjectDisplayName(session.subject).slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] leading-tight truncate">{session.topicName}</p>
        <p className="text-[12px] text-[#737373] mt-0.5">
          {subjectDisplayName(session.subject)} · {dateLabel(session.date)}
          {session.childName && <span className="ml-1 text-[#A8A8A8]">· {session.childName}</span>}
        </p>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-[14px] font-extrabold">{session.score}</p>
        <p className="text-[11px]">{stars(session.score)}</p>
        <p className="text-[11px] font-semibold text-[#FBBF24]">+{xp} XP</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const { user }                     = useAuthContext()
  const { selected, loading: childLoading } = useChild()

  const [sessions,    setSessions]    = useState<QuizSession[]>([])
  const [topics,      setTopics]      = useState<Topic[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [period,      setPeriod]      = useState<Period>('7 Hari')

  useEffect(() => {
    if (!user || !selected) return
    setLoadingData(true)
    const unsubs: (() => void)[] = []

    // Sessions
    const qSessions = query(sessionsCol(user.uid, selected.id), orderBy('date', 'desc'))
    unsubs.push(onSnapshot(qSessions, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSession)))
      setLoadingData(false)
    }, () => {
      unsubs.push(onSnapshot(sessionsCol(user.uid, selected.id), snap => {
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSession)))
        setLoadingData(false)
      }))
    }))

    // Topics
    unsubs.push(onSnapshot(topicsCol(user.uid, selected.id), snap => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Topic)))
    }))

    return () => unsubs.forEach(u => u())
  }, [user, selected])

  const cutoffDays = period === '7 Hari' ? 7 : period === '30 Hari' ? 30 : 9999
  const filtered   = sessions
    .filter(s => {
      const ms = toMs(s.date)
      return ms ? Math.floor((Date.now() - ms) / 86400000) < cutoffDays : true
    })
    .sort((a, b) => toMs(b.date) - toMs(a.date))

  const totalKuis = filtered.length
  const avgScore  = totalKuis ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / totalKuis) : 0
  const totalXP   = filtered.reduce((s, r) => s + xpFromScore(r.score, r.totalQ), 0)

  const xpByDay = Array.from({ length: 7 }, (_, i) => {
    const targetDay = 6 - i
    const day = daysAgo(targetDay).toLocaleDateString('id-ID', { weekday: 'short' })
    const xp  = filtered
      .filter(s => { const ms = toMs(s.date); return ms ? Math.floor((Date.now() - ms) / 86400000) === targetDay : false })
      .reduce((sum, s) => sum + xpFromScore(s.score, s.totalQ), 0)
    return { day, xp }
  })

  const subjects = [...new Set(topics.map(t => t.subject))]
  const progress = subjects.map(sub => {
    const all  = topics.filter(t => t.subject === sub)
    const done = all.filter(t => t.isDone).length
    return { subject: sub, done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 }
  }).sort((a, b) => b.pct - a.pct)

  const isLoading = childLoading || loadingData

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-extrabold text-[22px]">Laporan</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            {selected ? `Progress ${selected.name}` : 'Progress belajar anak'}
          </p>
        </div>
        <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${period === p ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Skeleton /> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Kuis"     value={totalKuis} sub="sesi selesai"   color="#0095F6" />
            <StatCard label="Rata-rata Skor" value={avgScore}  sub="dari 100"       color="#22C55E" />
            <StatCard label="Total XP"       value={totalXP}   sub="poin diperoleh" color="#FBBF24" />
          </div>

          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 space-y-4 shadow-sm">
            <p className="text-[13px] font-bold">XP Harian</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={xpByDay} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#D1D5DB' }} axisLine={false} tickLine={false} />
                <Tooltip content={<XpTooltip />} cursor={{ fill: '#F5F7FA', radius: 8 }} />
                <Bar dataKey="xp" radius={[6,6,0,0]}>
                  {xpByDay.map((e, i) => <Cell key={i} fill={e.xp > 0 ? '#FBBF24' : '#E5E7EB'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {progress.length > 0 && (
            <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 space-y-4 shadow-sm">
              <p className="text-[13px] font-bold">Progress Topik per Mapel</p>
              <div className="space-y-3">
                {progress.map(({ subject, done, total, pct }) => (
                  <div key={subject} className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[13px] font-semibold">{subjectDisplayName(subject)}</span>
                      <span className="text-[12px] text-[#9CA3AF]">{done}/{total} topik</span>
                    </div>
                    <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: SUBJECT_COLOR[subject] ?? '#0095F6' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[13px] font-bold">
              Riwayat Kuis
              <span className="ml-2 text-[#9CA3AF] font-normal">({filtered.length} sesi)</span>
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-3xl">📊</p>
                <p className="text-[#9CA3AF] font-semibold">Belum ada data untuk periode ini</p>
              </div>
            ) : (
              filtered.map(s => <SessionCard key={s.id} session={{ ...s, childName: selected?.name ?? '' }} />)
            )}
          </div>
        </>
      )}
    </div>
  )
}
