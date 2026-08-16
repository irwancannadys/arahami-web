'use client'

import { useEffect, useState, useRef } from 'react'
import {
  onSnapshot, addDoc, updateDoc, doc, query, orderBy, serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useChild } from '@/lib/context/ChildContext'
import { threadsCol, chatsCol } from '@/lib/firebase/firestore-paths'
import type { ThreadMessage, ChatMessage } from '@/lib/types'
import { ChildSwitcher } from '@/components/layout/ChildSwitcher'
import { sendNotification } from '@/lib/notifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMs(ts: any): number {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts instanceof Date) return ts.getTime()
  return 0
}

function timeLabel(ts: any): string {
  const ms = toMs(ts)
  if (!ms) return ''
  const diff = Date.now() - ms
  const m    = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  if (m < 1)  return 'Baru saja'
  if (m < 60) return `${m} mnt lalu`
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

type Tab = 'kabar' | 'chat'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 p-1">
      {[1, 2].map(i => <div key={i} className="h-28 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}
    </div>
  )
}

// ─── Thread Card ─────────────────────────────────────────────────────────────

function ThreadCard({ thread, childName, onReply }: {
  thread:    ThreadMessage
  childName: string
  onReply:   (threadId: string, text: string) => Promise<void>
}) {
  const [replyOpen,  setReplyOpen]  = useState(false)
  const [replyInput, setReplyInput] = useState('')
  const [sending,    setSending]    = useState(false)
  const inputRef                    = useRef<HTMLInputElement>(null)

  function openReply() {
    setReplyOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function submitReply() {
    const t = replyInput.trim()
    if (!t || !thread.id) return
    setSending(true)
    await onReply(thread.id, t)
    setReplyInput('')
    setReplyOpen(false)
    setSending(false)
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-2xl shadow-sm px-4 py-4 space-y-3">

      {/* ── Parent post ── */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0095F6] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
          K
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-bold text-[#0A0A0A]">Kamu</span>
            <span className="text-[11px] text-[#A8A8A8]">{timeLabel(thread.createdAt)}</span>
          </div>
          <p className="text-[14px] leading-relaxed text-[#0A0A0A] mt-0.5">{thread.text}</p>
          <button onClick={openReply}
            className="mt-1.5 text-[11px] font-semibold text-[#9CA3AF] hover:text-[#0095F6] transition-colors">
            Balas
          </button>
        </div>
      </div>

      {/* ── Replies — indented ── */}
      {thread.replies?.length > 0 && (
        <div className="ml-11 space-y-3">
          {thread.replies.map((r, j) => (
            <div key={j} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                r.sender === 'child' ? 'bg-[#E0F2FE] text-[#0095F6]' : 'bg-[#DCFCE7] text-[#15803D]'
              }`}>
                {r.sender === 'child' ? childName[0].toUpperCase() : 'K'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[12px] font-bold ${
                    r.sender === 'child' ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]'
                  }`}>
                    {r.sender === 'child' ? childName : 'Kamu'}
                  </span>
                  <span className="text-[11px] text-[#A8A8A8]">{timeLabel(r.createdAt)}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-[#374151] mt-0.5">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reply input — muncul saat "Balas" diklik ── */}
      {replyOpen && (
        <div className="ml-11 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[11px] font-bold text-[#15803D] shrink-0">
            K
          </div>
          <input
            ref={inputRef}
            type="text"
            value={replyInput}
            onChange={e => setReplyInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !sending) submitReply()
              if (e.key === 'Escape') setReplyOpen(false)
            }}
            placeholder="Tulis balasan..."
            className="flex-1 text-[13px] bg-[#F3F4F6] rounded-full px-4 py-2 outline-none focus:bg-white focus:ring-1 focus:ring-[#0095F6] transition-all"
          />
          <button onClick={() => { setReplyOpen(false); setReplyInput('') }}
            className="text-[11px] text-[#9CA3AF] hover:text-[#374151] transition-colors shrink-0">
            Batal
          </button>
          <button
            onClick={submitReply}
            disabled={!replyInput.trim() || sending}
            className="text-[12px] font-bold text-[#0095F6] disabled:opacity-40 hover:text-[#0074CC] transition-colors shrink-0"
          >
            {sending ? '...' : 'Kirim'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Kabar Tab ────────────────────────────────────────────────────────────────

function KabarTab({
  childName, threads, onPost, onReply,
}: {
  childName: string
  threads:   ThreadMessage[]
  onPost:    (text: string) => Promise<void>
  onReply:   (threadId: string, text: string) => Promise<void>
}) {
  const [input,   setInput]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [sending, setSending] = useState(false)

  async function submit() {
    const t = input.trim()
    if (!t) return
    setSending(true)
    await onPost(t)
    setInput('')
    setOpen(false)
    setSending(false)
  }

  const sorted = [...threads].sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))

  return (
    <div className="h-full overflow-y-auto space-y-4 pb-2">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-dashed border-[#0095F6] rounded-2xl text-[#0095F6] hover:bg-[#EFF6FF] transition-colors"
      >
        <span className="text-xl">✏️</span>
        <span className="text-[14px] font-semibold">Tulis kabar untuk {childName}...</span>
      </button>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl">📢</p>
          <p className="text-[#737373] font-semibold mt-2">Belum ada kabar</p>
          <p className="text-[13px] text-[#A8A8A8] mt-1">Kirim semangat atau pengumuman ke {childName}</p>
        </div>
      ) : (
        sorted.map((thread, i) => (
          <ThreadCard key={thread.id ?? i} thread={thread} childName={childName} onReply={onReply} />
        ))
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[17px]">Tulis Kabar</h3>
              <button onClick={() => setOpen(false)} className="text-[#737373] text-[22px] leading-none">×</button>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              autoFocus
              placeholder={`Tulis semangat atau pengumuman untuk ${childName}...`}
              className="w-full border border-[#DBDBDB] rounded-xl px-4 py-3 text-[14px] resize-none outline-none focus:border-[#0095F6] transition-colors"
            />
            <div className="flex gap-2 flex-wrap">
              {['Semangat ya! 💪', 'Hebat sekali! 🌟', 'Jangan lupa belajar ya 📚'].map(t => (
                <button key={t} onClick={() => setInput(t)}
                  className="px-3 py-1.5 bg-[#F3F4F6] rounded-xl text-[12px] font-medium hover:bg-[#E5E7EB] transition-colors">
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={!input.trim() || sending}
              className="w-full py-3 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
            >
              {sending ? 'Mengirim...' : 'Kirim Kabar 📢'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ childName, chats, onSend }: {
  childName: string
  chats:     ChatMessage[]
  onSend:    (text: string) => Promise<void>
}) {
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  const sorted = [...chats].sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sorted.length])

  async function send() {
    const t = input.trim()
    if (!t) return
    setSending(true)
    await onSend(t)
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 py-2">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl">💬</p>
            <p className="text-[#737373] font-semibold mt-2">Belum ada pesan</p>
            <p className="text-[13px] text-[#A8A8A8] mt-1">Mulai chat dengan {childName}</p>
          </div>
        ) : sorted.map(msg => {
          const isParent = msg.sender === 'parent'
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {!isParent && (
                <div className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[11px] font-bold text-[#0095F6] shrink-0">
                  {childName[0].toUpperCase()}
                </div>
              )}
              <div className={`max-w-[72%] flex flex-col ${isParent ? 'items-end' : 'items-start'} space-y-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                  isParent
                    ? 'bg-[#0095F6] text-white rounded-br-sm'
                    : 'bg-white border border-[#DBDBDB] text-[#0A0A0A] rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <p className="text-[10px] text-[#A8A8A8] px-1">
                  {timeLabel(msg.createdAt)}
                  {isParent && <span className="ml-1 text-[#0095F6]">✓</span>}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — pinned to bottom */}
      <div className="shrink-0 border-t border-[#F3F4F6] pt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !sending && send()}
          placeholder={`Pesan ke ${childName}...`}
          className="flex-1 border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[#0095F6] transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-[#0095F6] text-white font-semibold text-[14px] disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
        >
          {sending ? '...' : 'Kirim'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PesanPage() {
  const { user }                                    = useAuthContext()
  const { selected: child, loading: childLoading }  = useChild()

  const [threads,    setThreads]    = useState<ThreadMessage[]>([])
  const [chats,      setChats]      = useState<ChatMessage[]>([])
  const [activeTab,  setActiveTab]  = useState<Tab>('kabar')
  const [loadingMsg, setLoadingMsg] = useState(true)
  const [seeding,    setSeeding]    = useState(false)

  useEffect(() => {
    if (!user || !child) return
    setLoadingMsg(true)
    const unsubs: (() => void)[] = []

    const qThreads = query(threadsCol(user.uid, child.id), orderBy('createdAt', 'desc'))
    unsubs.push(onSnapshot(qThreads, snap => {
      setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() } as ThreadMessage)))
      setLoadingMsg(false)
    }, () => {
      unsubs.push(onSnapshot(threadsCol(user.uid, child.id), snap => {
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() } as ThreadMessage)))
        setLoadingMsg(false)
      }))
    }))

    const qChats = query(chatsCol(user.uid, child.id), orderBy('createdAt', 'asc'))
    unsubs.push(onSnapshot(qChats, snap => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
    }, () => {
      unsubs.push(onSnapshot(chatsCol(user.uid, child.id), snap => {
        setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
      }))
    }))

    return () => unsubs.forEach(u => u())
  }, [user, child])

  // Auto mark-as-read saat parent buka tab Chat
  useEffect(() => {
    if (activeTab !== 'chat' || !user || !child) return
    chats
      .filter(c => !c.isRead && c.sender === 'child')
      .forEach(msg => {
        updateDoc(doc(db, 'users', user.uid, 'children', child.id, 'chats', msg.id), { isRead: true })
      })
  }, [activeTab, chats, user, child])

  async function postThread(text: string) {
    if (!user || !child) return
    await addDoc(threadsCol(user.uid, child.id), {
      text, sender: 'parent', replies: [], createdAt: serverTimestamp(),
    })
    if (child.fcmToken) {
      await sendNotification(
        child.fcmToken,
        '📢 Ada kabar dari Ayah/Bunda!',
        text.length > 60 ? text.slice(0, 60) + '...' : text,
        { type: 'kabar' },
      )
    }
  }

  async function replyThread(threadId: string, text: string) {
    if (!user || !child) return
    await updateDoc(doc(db, 'users', user.uid, 'children', child.id, 'messages', threadId), {
      replies: arrayUnion({ text, sender: 'parent', createdAt: new Date() }),
    })
    if (child.fcmToken) {
      await sendNotification(
        child.fcmToken,
        '💬 Ayah/Bunda membalas kabarmu',
        text.length > 60 ? text.slice(0, 60) + '...' : text,
        { type: 'kabar_reply' },
      )
    }
  }

  async function sendChat(text: string) {
    if (!user || !child) return
    await addDoc(chatsCol(user.uid, child.id), {
      text, sender: 'parent', isRead: true, createdAt: serverTimestamp(),
    })
    if (child.fcmToken) {
      await sendNotification(
        child.fcmToken,
        '💬 Pesan dari Ayah/Bunda',
        text.length > 60 ? text.slice(0, 60) + '...' : text,
        { type: 'chat' },
      )
    }
  }

  async function seedDummyData() {
    if (!user || !child) return
    setSeeding(true)
    const childName = child.name

    // Dummy threads
    await addDoc(threadsCol(user.uid, child.id), {
      text: 'Semangat belajar hari ini ya! Ayah/Bunda bangga sama kamu 💪',
      sender: 'parent', createdAt: new Date(Date.now() - 2 * 3600000),
      replies: [
        { text: 'Iya Ayah! Aku udah belajar matematika tadi 😊', sender: 'child', createdAt: new Date(Date.now() - 1.5 * 3600000) },
      ],
    })
    await addDoc(threadsCol(user.uid, child.id), {
      text: 'Jangan lupa istirahat ya, jangan main HP terus 📵',
      sender: 'parent', createdAt: new Date(Date.now() - 24 * 3600000),
      replies: [],
    })

    // Dummy chats
    const msgs = [
      { text: 'Halo! Sudah makan siang belum?', sender: 'parent', isRead: true, createdAt: new Date(Date.now() - 3 * 3600000) },
      { text: 'Udah Bunda! Aku makan nasi sama ayam 🍗', sender: 'child', isRead: true, createdAt: new Date(Date.now() - 2.8 * 3600000) },
      { text: `Bagus! Nanti belajar yang rajin ya ${childName}`, sender: 'parent', isRead: true, createdAt: new Date(Date.now() - 2.5 * 3600000) },
      { text: 'Oke Bunda! Aku mau kuis dulu ah 📚', sender: 'child', isRead: false, createdAt: new Date(Date.now() - 30 * 60000) },
    ]
    for (const m of msgs) {
      await addDoc(chatsCol(user.uid, child.id), m)
    }
    setSeeding(false)
  }

  const unreadCount = chats.filter(c => !c.isRead && c.sender === 'child').length
  const isLoading   = childLoading || loadingMsg

  return (
    <div className="flex flex-col h-full">

      {/* Header — shrink-0 */}
      <div className="px-6 pt-6 shrink-0 max-w-2xl mx-auto w-full space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-[22px]">Pesan</h1>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">
              {child ? `Komunikasi dengan ${child.name}` : 'Komunikasi dengan anak'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={seedDummyData}
                disabled={seeding || !child}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-dashed border-[#D1D5DB] text-[#9CA3AF] hover:border-[#0095F6] hover:text-[#0095F6] transition-colors disabled:opacity-40"
              >
                {seeding ? '...' : '🧪 Dummy Data'}
              </button>
            )}
            <ChildSwitcher />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
          <button onClick={() => setActiveTab('kabar')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'kabar' ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'}`}>
            📢 Kabar
          </button>
          <button onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'chat' ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'}`}>
            💬 Chat
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Content — flex-1, fills remaining height */}
      <div className="flex-1 min-h-0 px-6 pb-6 max-w-2xl mx-auto w-full mt-4 overflow-hidden">
        {isLoading ? <Skeleton /> : !child ? (
          <div className="text-center py-12 text-[#9CA3AF]">Belum ada anak terdaftar</div>
        ) : activeTab === 'kabar' ? (
          <KabarTab childName={child.name} threads={threads} onPost={postThread} onReply={replyThread} />
        ) : (
          <ChatTab childName={child.name} chats={chats} onSend={sendChat} />
        )}
      </div>

    </div>
  )
}
