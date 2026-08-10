'use client'

import { useEffect, useState, useRef } from 'react'
import {
  onSnapshot, addDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { childrenCol, threadsCol, chatsCol } from '@/lib/firebase/firestore-paths'
import type { Child, ThreadMessage, ChatMessage } from '@/lib/types'

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
    <div className="space-y-3">
      {[1,2].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}
    </div>
  )
}

// ─── Kabar Tab ────────────────────────────────────────────────────────────────

function KabarTab({
  childName, threads, onPost,
}: {
  childName: string
  threads:   ThreadMessage[]
  onPost:    (text: string) => Promise<void>
}) {
  const [input,    setInput]    = useState('')
  const [open,     setOpen]     = useState(false)
  const [sending,  setSending]  = useState(false)

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
    <div className="space-y-4">
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
          <div key={thread.id ?? i} className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
            <div className="p-4 space-y-1">
              <p className="text-[14px] leading-relaxed">{thread.text}</p>
              <p className="text-[11px] text-[#A8A8A8]">Kamu · {timeLabel(thread.createdAt)}</p>
            </div>
            {thread.replies?.length > 0 && (
              <div className="border-t border-[#F3F4F6] bg-[#F9FAFB]">
                {thread.replies.map((r, j) => (
                  <div key={j} className="px-4 py-3 border-b border-[#F3F4F6] last:border-0">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        r.sender === 'child' ? 'bg-[#E0F2FE] text-[#0095F6]' : 'bg-[#DCFCE7] text-[#15803D]'
                      }`}>
                        {r.sender === 'child' ? childName[0] : 'K'}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-[#737373]">
                          {r.sender === 'child' ? childName : 'Kamu'}
                        </p>
                        <p className="text-[13px] mt-0.5 leading-relaxed">{r.text}</p>
                        <p className="text-[11px] text-[#A8A8A8] mt-1">{timeLabel(r.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[17px]">Tulis Kabar</h3>
              <button onClick={() => setOpen(false)} className="text-[#737373] text-[22px] leading-none">×</button>
            </div>
            <p className="text-[13px] text-[#737373]">Pesan akan dikirim ke {childName} dan bisa dilihat di aplikasi.</p>
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
    <div className="flex flex-col h-[480px]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl">💬</p>
            <p className="text-[#737373] font-semibold mt-2">Belum ada pesan</p>
            <p className="text-[13px] text-[#A8A8A8] mt-1">Mulai chat dengan {childName}</p>
          </div>
        ) : sorted.map(msg => {
          const isParent = msg.sender === 'parent'
          return (
            <div key={msg.id} className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] flex flex-col ${isParent ? 'items-end' : 'items-start'} space-y-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                  isParent
                    ? 'bg-[#0095F6] text-white rounded-br-sm'
                    : 'bg-white border border-[#DBDBDB] text-[#0A0A0A] rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <p className="text-[10px] text-[#A8A8A8] px-1">
                  {isParent ? 'Kamu' : childName} · {timeLabel(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#F3F4F6] pt-3 flex gap-2">
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
  const { user } = useAuthContext()

  const [children,    setChildren]    = useState<Child[]>([])
  const [threadMap,   setThreadMap]   = useState<Record<string, ThreadMessage[]>>({})
  const [chatMap,     setChatMap]     = useState<Record<string, ChatMessage[]>>({})
  const [activeTab,   setActiveTab]   = useState<Tab>('kabar')
  const [activeChild, setActiveChild] = useState<Child | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)

  // Listen children
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(childrenCol(user.uid), snap => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data() } as Child))
      setChildren(kids)
      if (kids.length && !activeChild) setActiveChild(kids[0])
      setLoadingInit(false)
    })
    return unsub
  }, [user])

  // Listen threads + chats per child
  useEffect(() => {
    if (!user || !children.length) return
    const unsubs: (() => void)[] = []

    children.forEach(c => {
      const qThreads = query(threadsCol(user.uid, c.id), orderBy('createdAt', 'desc'))
      unsubs.push(onSnapshot(qThreads, snap => {
        setThreadMap(prev => ({
          ...prev,
          [c.id]: snap.docs.map(d => ({ id: d.id, ...d.data() } as ThreadMessage)),
        }))
      }, () => {
        unsubs.push(onSnapshot(threadsCol(user.uid, c.id), snap => {
          setThreadMap(prev => ({
            ...prev,
            [c.id]: snap.docs.map(d => ({ id: d.id, ...d.data() } as ThreadMessage)),
          }))
        }))
      }))

      const qChats = query(chatsCol(user.uid, c.id), orderBy('createdAt', 'asc'))
      unsubs.push(onSnapshot(qChats, snap => {
        setChatMap(prev => ({
          ...prev,
          [c.id]: snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)),
        }))
      }, () => {
        unsubs.push(onSnapshot(chatsCol(user.uid, c.id), snap => {
          setChatMap(prev => ({
            ...prev,
            [c.id]: snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)),
          }))
        }))
      }))
    })

    return () => unsubs.forEach(u => u())
  }, [user, children])

  // Unread badge
  const unreadCount = activeChild
    ? (chatMap[activeChild.id] ?? []).filter(c => !c.isRead && c.sender === 'child').length
    : 0

  async function postThread(text: string) {
    if (!user || !activeChild) return
    await addDoc(threadsCol(user.uid, activeChild.id), {
      text, sender: 'parent', replies: [], createdAt: serverTimestamp(),
    })
  }

  async function sendChat(text: string) {
    if (!user || !activeChild) return
    await addDoc(chatsCol(user.uid, activeChild.id), {
      text, sender: 'parent', isRead: true, createdAt: serverTimestamp(),
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-extrabold text-[22px]">Pesan</h1>
          <p className="text-[13px] text-[#737373] mt-0.5">Komunikasi dengan anak</p>
        </div>
        {children.length > 1 && (
          <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveChild(c)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                  activeChild?.id === c.id ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
        <button onClick={() => setActiveTab('kabar')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'kabar' ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'}`}>
          📢 Kabar
        </button>
        <button onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'chat' ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'}`}>
          💬 Chat
          {unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {loadingInit ? <Skeleton /> : !activeChild ? (
        <div className="text-center py-12 text-[#737373]">Belum ada anak terdaftar</div>
      ) : activeTab === 'kabar' ? (
        <KabarTab
          childName={activeChild.name}
          threads={threadMap[activeChild.id] ?? []}
          onPost={postThread}
        />
      ) : (
        <ChatTab
          childName={activeChild.name}
          chats={chatMap[activeChild.id] ?? []}
          onSend={sendChat}
        />
      )}
    </div>
  )
}
