'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { subjectDisplayName } from '@/lib/types'
import type { QuizSession } from '@/lib/types'

// ─── Dummy data — struktur identik Firestore ──────────────────────────────────
// Switch ke real data: onSnapshot(sessionsCol) + topicsCol

type DummyTopic = { subject: string; isDone: boolean }
type SessionWithChild = QuizSession & { childName: string }

const DUMMY_SESSIONS: SessionWithChild[] = [
  { id: 's1', childName: 'Budi', subject: 'MTK',    topicId: 't1', topicName: 'KPK dan FPB',              score: 100, totalQ: 6, correctQ: 6, answers: [], date: daysAgo(0) },
  { id: 's2', childName: 'Budi', subject: 'B_INDO',  topicId: 't2', topicName: 'Teks Deskripsi',           score: 67,  totalQ: 6, correctQ: 4, answers: [], date: daysAgo(0) },
  { id: 's3', childName: 'Budi', subject: 'IPA',     topicId: 't3', topicName: 'Sistem Peredaran Darah',   score: 83,  totalQ: 6, correctQ: 5, answers: [], date: daysAgo(1) },
  { id: 's4', childName: 'Budi', subject: 'MTK',    topicId: 't4', topicName: 'Bilangan Desimal',         score: 100, totalQ: 6, correctQ: 6, answers: [], date: daysAgo(1) },
  { id: 's5', childName: 'Budi', subject: 'AGAMA',  topicId: 't5', topicName: 'Rukun Islam',              score: 83,  totalQ: 6, correctQ: 5, answers: [], date: daysAgo(2) },
  { id: 's6', childName: 'Budi', subject: 'IPS',    topicId: 't6', topicName: 'Indonesia di ASEAN',       score: 50,  totalQ: 6, correctQ: 3, answers: [], date: daysAgo(3) },
  { id: 's7', childName: 'Budi', subject: 'B_INDO',  topicId: 't7', topicName: 'Teks Narasi',             score: 100, totalQ: 6, correctQ: 6, answers: [], date: daysAgo(4) },
  { id: 's8', childName: 'Budi', subject: 'MTK',    topicId: 't8', topicName: 'Pecahan Senilai',          score: 67,  totalQ: 6, correctQ: 4, answers: [], date: daysAgo(5) },
  { id: 's9', childName: 'Sari', subject: 'IPA',    topicId: 't9', topicName: 'Fotosintesis',             score: 100, totalQ: 6, correctQ: 6, answers: [], date: daysAgo(0) },
  { id: 's10',childName: 'Sari', subject: 'MTK',    topicId: 't10',topicName: 'Luas Bangun Ruang',        score: 83,  totalQ: 6, correctQ: 5, answers: [], date: daysAgo(1) },
]

const DUMMY_TOPICS: DummyTopic[] = [
  { subject: 'MTK',    isDone: true  }, { subject: 'MTK',    isDone: true  },
  { subject: 'MTK',    isDone: true  }, { subject: 'MTK',    isDone: false },
  { subject: 'MTK',    isDone: false }, { subject: 'B_INDO',  isDone: true  },
  { subject: 'B_INDO',  isDone: true  }, { subject: 'B_INDO',  isDone: false },
  { subject: 'B_INDO',  isDone: false }, { subject: 'B_INDO',  isDone: false },
  { subject: 'IPA',    isDone: true  }, { subject: 'IPA',    isDone: true  },
  { subject: 'IPA',    isDone: false }, { subject: 'IPA',    isDone: false },
  { subject: 'IPS',    isDone: true  }, { subject: 'IPS',    isDone: false },
  { subject: 'IPS',    isDone: false }, { subject: 'AGAMA',  isDone: true  },
  { subject: 'AGAMA',  isDone: true  }, { subject: 'AGAMA',  isDone: false },
]

const CHILDREN = ['Semua', 'Budi', 'Sari']
const PERIODS  = ['7 Hari', '30 Hari', 'Semua'] as const
type Period = typeof PERIODS[number]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d
}

function stars(score: number) {
  if (score === 100) return '⭐⭐⭐'
  if (score >= 70)   return '⭐⭐'
  return '⭐'
}

function dateLabel(date?: Date): string {
  if (!date) return ''
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Kemarin'
  return `${diff} hari lalu`
}

function xpFromScore(score: number, totalQ: number): number {
  return Math.round((score / 100) * totalQ * 10)
}

const SUBJECT_COLOR: Record<string, string> = {
  MTK:       '#8B5CF6',
  B_INDO:    '#0095F6',
  IPA:       '#22C55E',
  IPS:       '#F59E0B',
  AGAMA:     '#7C3AED',
  SENI:      '#EC4899',
  PJOK:      '#F97316',
  PANCASILA: '#3B82F6',
  ENGLISH:   '#14B8A6',
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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function XpTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#DBDBDB] rounded-xl px-3 py-2 shadow-md">
      <p className="text-[12px] font-semibold text-[#0A0A0A]">{label}</p>
      <p className="text-[13px] font-bold text-[#FBBF24]">+{payload[0].value} XP</p>
    </div>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: SessionWithChild }) {
  const color = SUBJECT_COLOR[session.subject] ?? '#0095F6'
  const xp    = xpFromScore(session.score, session.totalQ)

  return (
    <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[13px] font-extrabold"
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
        <p className="text-[13px] font-extrabold text-[#0A0A0A]">{session.score}</p>
        <p className="text-[11px]">{stars(session.score)}</p>
        <p className="text-[11px] font-semibold text-[#FBBF24]">+{xp} XP</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const [child,  setChild]  = useState('Semua')
  const [period, setPeriod] = useState<Period>('7 Hari')

  // Filter sessions
  const cutoff = period === '7 Hari' ? 7 : period === '30 Hari' ? 30 : 9999
  const sessions = DUMMY_SESSIONS
    .filter(s => child === 'Semua' || s.childName === child)
    .filter(s => {
      if (!s.date) return true
      return Math.floor((Date.now() - s.date.getTime()) / 86400000) < cutoff
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))

  // Stats
  const totalKuis  = sessions.length
  const avgScore   = totalKuis ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / totalKuis) : 0
  const totalXP    = sessions.reduce((s, r) => s + xpFromScore(r.score, r.totalQ), 0)

  // XP chart data — last 7 days
  const xpByDay = Array.from({ length: 7 }, (_, i) => {
    const d    = daysAgo(6 - i)
    const day  = d.toLocaleDateString('id-ID', { weekday: 'short' })
    const xp   = sessions
      .filter(s => s.date && Math.floor((Date.now() - s.date.getTime()) / 86400000) === (6 - i))
      .reduce((sum, s) => sum + xpFromScore(s.score, s.totalQ), 0)
    return { day, xp }
  })

  // Progress mapel
  const subjects = [...new Set(DUMMY_TOPICS.map(t => t.subject))]
  const progress = subjects.map(sub => {
    const all  = DUMMY_TOPICS.filter(t => t.subject === sub)
    const done = all.filter(t => t.isDone).length
    return { subject: sub, done, total: all.length, pct: Math.round((done / all.length) * 100) }
  }).sort((a, b) => b.pct - a.pct)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header + filters */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-extrabold text-[22px]">Laporan</h1>
          <p className="text-[13px] text-[#737373] mt-0.5">Progress belajar anak</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Child filter */}
          <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
            {CHILDREN.map(c => (
              <button
                key={c}
                onClick={() => setChild(c)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  child === c ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {/* Period filter */}
          <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  period === p ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Kuis"    value={totalKuis} sub="sesi selesai"           color="#0095F6" />
        <StatCard label="Rata-rata Skor" value={avgScore} sub="dari 100"               color="#22C55E" />
        <StatCard label="Total XP"      value={totalXP}  sub="poin diperoleh" color="#FBBF24" />
      </div>

      {/* XP Harian chart */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5 space-y-4">
        <p className="text-[13px] font-bold text-[#0A0A0A]">XP Harian</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={xpByDay} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#A8A8A8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<XpTooltip />} cursor={{ fill: '#F3F4F6', radius: 8 }} />
            <Bar dataKey="xp" radius={[6, 6, 0, 0]}>
              {xpByDay.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.xp > 0 ? '#FBBF24' : '#E5E7EB'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Mapel */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5 space-y-4">
        <p className="text-[13px] font-bold text-[#0A0A0A]">Progress Topik per Mapel</p>
        <div className="space-y-3">
          {progress.map(({ subject, done, total, pct }) => {
            const color = SUBJECT_COLOR[subject] ?? '#0095F6'
            return (
              <div key={subject} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-semibold">{subjectDisplayName(subject)}</span>
                  <span className="text-[12px] text-[#737373]">{done}/{total} topik</span>
                </div>
                <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Riwayat kuis */}
      <div className="space-y-3">
        <p className="text-[13px] font-bold text-[#0A0A0A]">
          Riwayat Kuis
          <span className="ml-2 text-[#737373] font-normal">({sessions.length} sesi)</span>
        </p>
        {sessions.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">📊</p>
            <p className="text-[#737373] font-semibold">Belum ada data untuk periode ini</p>
          </div>
        ) : (
          sessions.map(s => <SessionCard key={s.id} session={s} />)
        )}
      </div>

    </div>
  )
}
