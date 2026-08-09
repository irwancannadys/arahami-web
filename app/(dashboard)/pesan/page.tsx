'use client'

import { useState, useRef, useEffect } from 'react'
import type { ThreadMessage, ChatMessage } from '@/lib/types'

// ─── Dummy data — struktur identik Firestore ──────────────────────────────────
// Switch ke real data: onSnapshot(threadsCol) + chatsCol

type ThreadWithChild = ThreadMessage & { childName: string }
type ChatWithChild   = ChatMessage   & { childName: string }

const DUMMY_THREADS: ThreadWithChild[] = [
  {
    id: 'th1', childName: 'Budi',
    text:   'Semangat belajarnya ya sayang! Hari ini ada kuis Matematika 💪',
    sender: 'parent',
    replies: [
      { text: 'Siap bunda! Gua udah belajar tadi 😊', sender: 'child', createdAt: hoursAgo(1) },
    ],
    createdAt: hoursAgo(2),
  },
  {
    id: 'th2', childName: 'Budi',
    text:   'Jangan lupa kerjain topik IPA hari ini ya, tentang peredaran darah 🩸',
    sender: 'parent',
    replies: [],
    createdAt: hoursAgo(26),
  },
  {
    id: 'th3', childName: 'Sari',
    text:   'Hai Sari, tadi nilai Bahasa Indonesianya bagus banget! Bunda bangga 🌟',
    sender: 'parent',
    replies: [
      { text: 'Makasih bunda! Besok gua mau coba IPA juga', sender: 'child', createdAt: hoursAgo(10) },
      { text: 'Ayah ikut bangga juga ya 😊', sender: 'parent', createdAt: hoursAgo(9) },
    ],
    createdAt: hoursAgo(12),
  },
]

const DUMMY_CHATS: Record<string, ChatWithChild[]> = {
  Budi: [
    { id: 'c1', childName: 'Budi', text: 'Bunda, tadi soal nomor 5 susah banget 😅',  sender: 'child',  isRead: true,  createdAt: hoursAgo(3) },
    { id: 'c2', childName: 'Budi', text: 'Yang mana? Nomor 5 topik apa?',              sender: 'parent', isRead: true,  createdAt: hoursAgo(2.5) },
    { id: 'c3', childName: 'Budi', text: 'KPK dan FPB bunda',                          sender: 'child',  isRead: true,  createdAt: hoursAgo(2.4) },
    { id: 'c4', childName: 'Budi', text: 'Oh itu! Nanti bunda ajarin ya setelah makan', sender: 'parent', isRead: true,  createdAt: hoursAgo(2) },
    { id: 'c5', childName: 'Budi', text: 'Sip bunda! 😊',                               sender: 'child',  isRead: false, createdAt: hoursAgo(1.5) },
  ],
  Sari: [
    { id: 'c6', childName: 'Sari', text: 'Ayah, hari ini Sari udah kerjain 2 kuis!',   sender: 'child',  isRead: true,  createdAt: hoursAgo(5) },
    { id: 'c7', childName: 'Sari', text: 'Wah hebat Sari! Mapel apa aja?',             sender: 'parent', isRead: true,  createdAt: hoursAgo(4.5) },
    { id: 'c8', childName: 'Sari', text: 'IPA sama Matematika ayah',                   sender: 'child',  isRead: true,  createdAt: hoursAgo(4) },
  ],
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600000)
}

function timeLabel(date?: Date): string {
  if (!date) return ''
  const diff  = Date.now() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Baru saja'
  if (mins < 60)  return `${mins} mnt lalu`
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

const CHILDREN = ['Budi', 'Sari']
type Tab = 'kabar' | 'chat'

// ─── Kabar Tab ────────────────────────────────────────────────────────────────

function KabarTab({
  child, threads, onPost,
}: {
  child:   string
  threads: ThreadWithChild[]
  onPost:  (text: string) => void
}) {
  const [input, setInput] = useState('')
  const [open,  setOpen]  = useState(false)

  function submit() {
    const t = input.trim()
    if (!t) return
    onPost(t)
    setInput('')
    setOpen(false)
  }

  const filtered = threads
    .filter(t => t.childName === child)
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))

  return (
    <div className="space-y-4">
      {/* Compose button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-dashed border-[#0095F6] rounded-2xl text-[#0095F6] hover:bg-[#EFF6FF] transition-colors"
      >
        <span className="text-xl">✏️</span>
        <span className="text-[14px] font-semibold">Tulis kabar untuk {child}...</span>
      </button>

      {/* Thread list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl">📢</p>
          <p className="text-[#737373] font-semibold mt-2">Belum ada kabar</p>
          <p className="text-[13px] text-[#A8A8A8] mt-1">Kirim semangat atau pengumuman ke {child}</p>
        </div>
      ) : (
        filtered.map(thread => (
          <div key={thread.id} className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
            {/* Parent message */}
            <div className="p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] leading-relaxed flex-1">{thread.text}</p>
              </div>
              <p className="text-[11px] text-[#A8A8A8]">Kamu · {timeLabel(thread.createdAt)}</p>
            </div>

            {/* Replies */}
            {thread.replies.length > 0 && (
              <div className="border-t border-[#F3F4F6] bg-[#F9FAFB]">
                {thread.replies.map((r, i) => (
                  <div key={i} className={`px-4 py-3 border-b border-[#F3F4F6] last:border-0 ${r.sender === 'child' ? '' : ''}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        r.sender === 'child' ? 'bg-[#E0F2FE] text-[#0095F6]' : 'bg-[#DCFCE7] text-[#15803D]'
                      }`}>
                        {r.sender === 'child' ? thread.childName[0] : 'K'}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-[#737373]">
                          {r.sender === 'child' ? thread.childName : 'Kamu'}
                        </p>
                        <p className="text-[13px] text-[#0A0A0A] mt-0.5 leading-relaxed">{r.text}</p>
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

      {/* Compose modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[17px]">Tulis Kabar</h3>
              <button onClick={() => setOpen(false)} className="text-[#737373] text-[22px] leading-none">×</button>
            </div>
            <p className="text-[13px] text-[#737373]">Pesan akan dikirim ke {child} dan bisa dilihat di aplikasi.</p>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              autoFocus
              placeholder={`Tulis semangat atau pengumuman untuk ${child}...`}
              className="w-full border border-[#DBDBDB] rounded-xl px-4 py-3 text-[14px] resize-none outline-none focus:border-[#0095F6] transition-colors"
            />
            <div className="flex gap-2 flex-wrap">
              {['Semangat ya! 💪', 'Hebat sekali! 🌟', 'Jangan lupa belajar ya 📚'].map(t => (
                <button
                  key={t}
                  onClick={() => setInput(t)}
                  className="px-3 py-1.5 bg-[#F3F4F6] rounded-xl text-[12px] font-medium hover:bg-[#E5E7EB] transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="w-full py-3 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
            >
              Kirim Kabar 📢
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ child, chats, onSend }: {
  child:  string
  chats:  ChatWithChild[]
  onSend: (text: string) => void
}) {
  const [input, setInput]     = useState('')
  const bottomRef             = useRef<HTMLDivElement>(null)

  const messages = chats
    .filter(c => c.childName === child)
    .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function send() {
    const t = input.trim()
    if (!t) return
    onSend(t)
    setInput('')
  }

  return (
    <div className="flex flex-col h-[480px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl">💬</p>
            <p className="text-[#737373] font-semibold mt-2">Belum ada pesan</p>
            <p className="text-[13px] text-[#A8A8A8] mt-1">Mulai chat dengan {child}</p>
          </div>
        ) : (
          messages.map(msg => {
            const isParent = msg.sender === 'parent'
            return (
              <div key={msg.id} className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] space-y-1 ${isParent ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                    isParent
                      ? 'bg-[#0095F6] text-white rounded-br-sm'
                      : 'bg-white border border-[#DBDBDB] text-[#0A0A0A] rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-[#A8A8A8] px-1">
                    {isParent ? 'Kamu' : child} · {timeLabel(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#F3F4F6] pt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Pesan ke ${child}...`}
          className="flex-1 border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[#0095F6] transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#0095F6] text-white font-semibold text-[14px] disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
        >
          Kirim
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PesanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('kabar')
  const [child,     setChild]     = useState(CHILDREN[0])
  const [threads,   setThreads]   = useState<ThreadWithChild[]>(DUMMY_THREADS)
  const [chats,     setChats]     = useState<Record<string, ChatWithChild[]>>(DUMMY_CHATS)

  const unreadCount = Object.values(chats)
    .flat()
    .filter(c => !c.isRead && c.sender === 'child').length

  function postThread(text: string) {
    const newThread: ThreadWithChild = {
      id:        `th${Date.now()}`,
      childName: child,
      text,
      sender:    'parent',
      replies:   [],
      createdAt: new Date(),
    }
    setThreads(prev => [newThread, ...prev])
  }

  function sendChat(text: string) {
    const msg: ChatWithChild = {
      id:        `c${Date.now()}`,
      childName: child,
      text,
      sender:    'parent',
      isRead:    true,
      createdAt: new Date(),
    }
    setChats(prev => ({
      ...prev,
      [child]: [...(prev[child] ?? []), msg],
    }))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-extrabold text-[22px]">Pesan</h1>
          <p className="text-[13px] text-[#737373] mt-0.5">Komunikasi dengan anak</p>
        </div>
        {/* Child selector */}
        <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
          {CHILDREN.map(c => (
            <button
              key={c}
              onClick={() => setChild(c)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                child === c ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
        <button
          onClick={() => setActiveTab('kabar')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            activeTab === 'kabar' ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
          }`}
        >
          📢 Kabar
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            activeTab === 'chat' ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
          }`}
        >
          💬 Chat
          {unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'kabar' ? (
        <KabarTab child={child} threads={threads} onPost={postThread} />
      ) : (
        <ChatTab
          child={child}
          chats={Object.values(chats).flat()}
          onSend={sendChat}
        />
      )}
    </div>
  )
}
