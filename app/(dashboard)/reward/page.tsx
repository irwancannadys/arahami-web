'use client'

import { useEffect, useState } from 'react'
import { query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useChild } from '@/lib/context/ChildContext'
import { rewardsCol } from '@/lib/firebase/firestore-paths'
import type { Reward, QuizSession } from '@/lib/types'
import { subjectDisplayName } from '@/lib/types'
import { ChildSwitcher } from '@/components/layout/ChildSwitcher'
import { sendNotification } from '@/lib/notifications'

// ─── Types ────────────────────────────────────────────────────────────────────

type RewardWithChild = Reward & { childName: string }

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
  const h    = Math.floor(diff / 3600000)
  if (h < 1)  return 'Baru saja'
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-[#F3F4F6] rounded-2xl animate-pulse" />
      ))}
    </div>
  )
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
  reward, session, loadingSession, onClose, onAction, actionLoading, pendingAction,
}: {
  reward:         RewardWithChild
  session:        QuizSession | null | undefined
  loadingSession: boolean
  onClose:        () => void
  onAction:       (status: 'APPROVED' | 'REJECTED', note: string) => Promise<void>
  actionLoading:  boolean
  pendingAction:  'APPROVED' | 'REJECTED' | null
}) {
  const [note, setNote]  = useState(reward.parentNote ?? '')
  const { emoji, label } = splitEmoji(reward.request)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md space-y-4 p-6">

        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-[17px]">Detail Permintaan</h3>
          <button onClick={onClose} className="text-[#737373] text-[22px] leading-none">×</button>
        </div>

        <div className="flex items-center gap-4 bg-[#F9FAFB] rounded-2xl p-4 border border-[#F3F4F6]">
          <span className="text-[40px]">{emoji}</span>
          <div>
            <p className="font-bold text-[16px]">{label}</p>
            <p className="text-[13px] text-[#737373]">Diminta oleh {reward.childName}</p>
            <p className="text-[12px] text-[#A8A8A8] mt-0.5">{timeAgo(reward.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[12px] font-semibold text-[#737373] uppercase tracking-wide">Dari kuis</p>
          {loadingSession ? (
            <div className="h-14 bg-[#F3F4F6] rounded-xl animate-pulse" />
          ) : session ? (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 space-y-1">
              <p className="text-[14px] font-semibold">📚 {subjectDisplayName(session.subject)}</p>
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
            <p className="text-[11px] text-[#A8A8A8]">Pesan ini akan terlihat oleh {reward.childName} di aplikasi.</p>
          </div>
        )}

        {reward.status !== 'PENDING' && reward.parentNote && (
          <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl px-4 py-3">
            <p className="text-[12px] font-semibold text-[#737373]">Pesanmu</p>
            <p className="text-[13px] mt-0.5">{reward.parentNote}</p>
          </div>
        )}

        {reward.status === 'PENDING' ? (
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onAction('REJECTED', note)}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl border-2 border-[#EF4444] text-[#EF4444] text-[14px] font-bold hover:bg-[#FEF2F2] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              {pendingAction === 'REJECTED' && <span className="w-4 h-4 border-2 border-[#EF4444]/30 border-t-[#EF4444] rounded-full animate-spin" />}
              Tolak ✕
            </button>
            <button
              onClick={() => onAction('APPROVED', note)}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl bg-[#22C55E] text-white text-[14px] font-bold hover:bg-[#16A34A] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              {pendingAction === 'APPROVED' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
  const { user }                            = useAuthContext()
  const { selected: child, loading: childLoading } = useChild()

  const [rewards,        setRewards]        = useState<Reward[]>([])
  const [sessionCache,   setSessionCache]   = useState<Record<string, QuizSession | null>>({})
  const [selectedReward, setSelectedReward] = useState<RewardWithChild | null>(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [actionLoading,  setActionLoading]  = useState(false)
  const [pendingAction,  setPendingAction]  = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [activeTab,      setActiveTab]      = useState<Tab>('Menunggu')
  const [loadingRewards, setLoadingRewards] = useState(true)

  useEffect(() => {
    if (!user || !child) return
    setLoadingRewards(true)
    const q = query(rewardsCol(user.uid, child.id), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reward)))
      setLoadingRewards(false)
    }, () => {
      onSnapshot(rewardsCol(user.uid, child.id), snap => {
        setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reward)))
        setLoadingRewards(false)
      })
    })
    return unsub
  }, [user, child])

  const withChild: RewardWithChild[] = rewards
    .map(r => ({ ...r, childName: child?.name ?? '' }))
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))

  const filtered     = withChild.filter(r => r.status === TAB_STATUS[activeTab])
  const pendingCount = withChild.filter(r => r.status === 'PENDING').length

  async function handleSelect(reward: RewardWithChild) {
    setSelectedReward(reward)
    const sid = reward.sessionId
    if (!sid || sid in sessionCache || !child) return
    setLoadingSession(true)
    try {
      const snap = await getDoc(doc(db, 'users', user!.uid, 'children', child.id, 'sessions', sid))
      setSessionCache(prev => ({ ...prev, [sid]: snap.exists() ? snap.data() as QuizSession : null }))
    } catch {
      setSessionCache(prev => ({ ...prev, [reward.sessionId]: null }))
    } finally {
      setLoadingSession(false)
    }
  }

  async function handleAction(status: 'APPROVED' | 'REJECTED', note: string) {
    if (!selectedReward || !user || !child) return
    setActionLoading(true)
    setPendingAction(status)
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'children', child.id, 'rewards', selectedReward.id),
        { status, parentNote: note },
      )

      if (child.fcmToken) {
        const { label } = splitEmoji(selectedReward.request)
        if (status === 'APPROVED') {
          await sendNotification(
            child.fcmToken,
            '🎉 Reward Disetujui!',
            `Ayah/Bunda menyetujui: ${label}${note ? ` — "${note}"` : ''}`,
            { type: 'reward_approved', rewardId: selectedReward.id },
          )
        } else {
          await sendNotification(
            child.fcmToken,
            '😔 Reward Belum Bisa',
            note || 'Coba lebih rajin belajar ya!',
            { type: 'reward_rejected', rewardId: selectedReward.id },
          )
        }
      }

      setSelectedReward(null)
    } finally {
      setActionLoading(false)
      setPendingAction(null)
    }
  }

  const isLoading = childLoading || loadingRewards

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-[22px]">Reward</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            {child ? `Permintaan hadiah dari ${child.name}` : 'Permintaan hadiah dari anak'}
          </p>
        </div>
        <ChildSwitcher />
      </div>

      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === tab ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'}`}>
            {tab}
            {tab === 'Menunggu' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? <Skeleton /> : filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => <RewardCard key={r.id} reward={r} onClick={() => handleSelect(r)} />)}
        </div>
      )}

      {selectedReward && (
        <DetailModal
          reward={selectedReward}
          session={sessionCache[selectedReward.sessionId]}
          loadingSession={loadingSession}
          onClose={() => setSelectedReward(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
          pendingAction={pendingAction}
        />
      )}
    </div>
  )
}
