'use client'

import { useState } from 'react'
import type { Reward } from '@/lib/types'
import { subjectDisplayName } from '@/lib/types'

// ─── Dummy data — struktur sama persis dengan Firestore ──────────────────────
// Switch ke real data: ganti useState(DUMMY) → onSnapshot dari rewardsCol
type RewardWithChild = Reward & { childName: string }

interface DummySession {
  subject:   string
  topicName: string
  correctQ:  number
  totalQ:    number
}

const DUMMY_SESSIONS: Record<string, DummySession> = {
  's1': { subject: 'MTK',       topicName: 'KPK dan FPB',              correctQ: 6, totalQ: 6 },
  's2': { subject: 'B_INDO',    topicName: 'Teks Deskripsi',           correctQ: 4, totalQ: 6 },
  's3': { subject: 'IPA',       topicName: 'Sistem Peredaran Darah',   correctQ: 5, totalQ: 6 },
  's4': { subject: 'PANCASILA', topicName: 'Pengamalan Sila Pancasila', correctQ: 6, totalQ: 6 },
  's5': { subject: 'IPS',       topicName: 'Indonesia di ASEAN',       correctQ: 3, totalQ: 6 },
}

const DUMMY: RewardWithChild[] = [
  {
    id: 'r1', childId: 'c1', childName: 'Budi',
    request: 'Es Krim 🍦', score: 60, sessionId: 's1',
    status: 'PENDING', parentNote: '',
    createdAt: new Date(Date.now() - 1.5 * 3600000),
  },
  {
    id: 'r2', childId: 'c1', childName: 'Budi',
    request: 'Main Game 🎮', score: 40, sessionId: 's2',
    status: 'PENDING', parentNote: '',
    createdAt: new Date(Date.now() - 5 * 3600000),
  },
  {
    id: 'r3', childId: 'c2', childName: 'Sari',
    request: 'Nonton Film 🍿', score: 50, sessionId: 's3',
    status: 'PENDING', parentNote: '',
    createdAt: new Date(Date.now() - 14 * 3600000),
  },
  {
    id: 'r4', childId: 'c1', childName: 'Budi',
    request: 'Pizza 🍕', score: 60, sessionId: 's4',
    status: 'APPROVED', parentNote: 'Boleh ya, sudah rajin belajar! 🎉',
    createdAt: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: 'r5', childId: 'c2', childName: 'Sari',
    request: 'Jalan-jalan 🎡', score: 30, sessionId: 's5',
    status: 'REJECTED', parentNote: 'Besok aja ya sayang, sekarang sibuk dulu.',
    createdAt: new Date(Date.now() - 3 * 86400000),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date?: Date): string {
  if (!date) return ''
  const diff  = Date.now() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1)  return 'Baru saja'
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

function splitEmoji(request: string) {
  const parts = request.trim().split(' ')
  return { emoji: parts.at(-1) ?? '🎁', label: parts.slice(0, -1).join(' ') || request }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Menunggu', 'Disetujui', 'Ditolak'] as const
type Tab = typeof TABS[number]

const TAB_STATUS: Record<Tab, Reward['status']> = {
  'Menunggu':  'PENDING',
  'Disetujui': 'APPROVED',
  'Ditolak':   'REJECTED',
}

// ─── Reward Card ──────────────────────────────────────────────────────────────

function RewardCard({ reward, onClick }: { reward: RewardWithChild; onClick: () => void }) {
  const { emoji, label } = splitEmoji(reward.request)

  const statusCfg = {
    PENDING:  { label: 'Menunggu',  bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
    APPROVED: { label: 'Disetujui', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' },
    REJECTED: { label: 'Ditolak',   bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]' },
  }[reward.status]

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-[#DBDBDB] rounded-2xl p-4 hover:bg-[#FAFAFA] active:scale-[0.99] transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[28px] shrink-0">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] leading-tight truncate">{label}</p>
            <p className="text-[12px] text-[#737373] mt-0.5">
              {reward.childName} · {timeAgo(reward.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
            {statusCfg.label}
          </span>
          <span className="text-[12px] font-bold text-[#FBBF24]">+{reward.score} XP</span>
        </div>
      </div>
      {reward.parentNote ? (
        <p className="text-[12px] text-[#737373] bg-[#F9FAFB] rounded-xl px-3 py-2 border border-[#F3F4F6] text-left">
          📝 {reward.parentNote}
        </p>
      ) : null}
    </button>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  reward, onClose, onAction,
}: {
  reward:   RewardWithChild
  onClose:  () => void
  onAction: (id: string, status: 'APPROVED' | 'REJECTED', note: string) => void
}) {
  const [note, setNote]   = useState(reward.parentNote ?? '')
  const { emoji, label }  = splitEmoji(reward.request)
  const session           = DUMMY_SESSIONS[reward.sessionId]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md space-y-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-[17px]">Detail Permintaan</h3>
          <button onClick={onClose} className="text-[#737373] hover:text-[#0A0A0A] text-[22px] leading-none">×</button>
        </div>

        {/* Reward info */}
        <div className="flex items-center gap-4 bg-[#F9FAFB] rounded-2xl p-4 border border-[#F3F4F6]">
          <span className="text-[40px]">{emoji}</span>
          <div>
            <p className="font-bold text-[16px]">{label}</p>
            <p className="text-[13px] text-[#737373]">Diminta oleh {reward.childName}</p>
            <p className="text-[12px] text-[#A8A8A8] mt-0.5">{timeAgo(reward.createdAt)}</p>
          </div>
        </div>

        {/* Quiz session detail */}
        <div className="space-y-1.5">
          <p className="text-[12px] font-semibold text-[#737373] uppercase tracking-wide">Dari kuis</p>
          {session ? (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 space-y-1">
              <p className="text-[14px] font-semibold text-[#0A0A0A]">
                📚 {subjectDisplayName(session.subject)}
              </p>
              <p className="text-[12px] text-[#374151]">Topik: {session.topicName}</p>
              <p className="text-[12px] text-[#374151]">
                Jawaban benar: {session.correctQ}/{session.totalQ} ·{' '}
                <span className="font-semibold text-[#0095F6]">+{reward.score} XP</span>
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-[#A8A8A8] px-1">Data kuis tidak tersedia</p>
          )}
        </div>

        {/* Note input (pending only) */}
        {reward.status === 'PENDING' && (
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold">
              Pesan ke {reward.childName}{' '}
              <span className="text-[#737373] font-normal">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder={`Boleh ya ${reward.childName}, sudah rajin belajar! 🎉`}
              className="w-full border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] resize-none outline-none focus:border-[#0095F6] transition-colors"
            />
            <p className="text-[11px] text-[#A8A8A8]">
              Pesan ini akan terlihat oleh {reward.childName} di aplikasi.
            </p>
          </div>
        )}

        {/* Note display (non-pending) */}
        {reward.status !== 'PENDING' && reward.parentNote && (
          <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl px-4 py-3">
            <p className="text-[12px] font-semibold text-[#737373]">Pesanmu</p>
            <p className="text-[13px] text-[#0A0A0A] mt-0.5">{reward.parentNote}</p>
          </div>
        )}

        {/* Action buttons */}
        {reward.status === 'PENDING' ? (
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onAction(reward.id, 'REJECTED', note)}
              className="flex-1 py-3 rounded-xl border-2 border-[#EF4444] text-[#EF4444] text-[14px] font-bold hover:bg-[#FEF2F2] transition-colors"
            >
              Tolak ✕
            </button>
            <button
              onClick={() => onAction(reward.id, 'APPROVED', note)}
              className="flex-1 py-3 rounded-xl bg-[#22C55E] text-white text-[14px] font-bold hover:bg-[#16A34A] transition-colors"
            >
              Setujui ✓
            </button>
          </div>
        ) : (
          <div className={`text-center py-3 rounded-xl font-semibold text-[14px] ${
            reward.status === 'APPROVED' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'
          }`}>
            {reward.status === 'APPROVED' ? '✓ Sudah disetujui' : '✕ Sudah ditolak'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const cfg = {
    'Menunggu':  { emoji: '🎁', text: 'Belum ada permintaan hadiah' },
    'Disetujui': { emoji: '✅', text: 'Belum ada hadiah yang disetujui' },
    'Ditolak':   { emoji: '📭', text: 'Belum ada hadiah yang ditolak' },
  }[tab]
  return (
    <div className="text-center py-16 space-y-2">
      <p className="text-4xl">{cfg.emoji}</p>
      <p className="font-semibold text-[#737373]">{cfg.text}</p>
      {tab === 'Menunggu' && (
        <p className="text-[13px] text-[#A8A8A8]">Ketika anak selesai kuis dan minta hadiah, muncul di sini.</p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RewardPage() {
  const [rewards,   setRewards]  = useState<RewardWithChild[]>(DUMMY)
  const [selected,  setSelected] = useState<RewardWithChild | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('Menunggu')

  const filtered     = rewards
    .filter(r => r.status === TAB_STATUS[activeTab])
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
  const pendingCount = rewards.filter(r => r.status === 'PENDING').length

  function handleAction(id: string, status: 'APPROVED' | 'REJECTED', note: string) {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, status, parentNote: note } : r))
    setSelected(null)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      <div>
        <h1 className="font-extrabold text-[22px]">Reward</h1>
        <p className="text-[13px] text-[#737373] mt-0.5">Permintaan hadiah dari anak</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-white shadow-sm text-[#0A0A0A]'
                : 'text-[#737373] hover:text-[#0A0A0A]'
            }`}
          >
            {tab}
            {tab === 'Menunggu' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <RewardCard key={r.id} reward={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          reward={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  )
}
