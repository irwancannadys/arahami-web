'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, BarChart2, MessageCircle, Gift } from 'lucide-react'
import { useChild } from '@/lib/context/ChildContext'

const NAV = [
  { href: '/beranda', label: 'Beranda', icon: Home },
  { href: '/laporan', label: 'Laporan', icon: BarChart2 },
  { href: '/reward',  label: 'Reward',  icon: Gift },
  { href: '/pesan',   label: 'Pesan',   icon: MessageCircle },
]

function themeEmoji(theme: string) {
  return theme ? theme.trim().split(' ')[0] : '🎒'
}

export function DashboardSidebar() {
  const pathname              = usePathname()
  const router                = useRouter()
  const { children, selected, setSelected } = useChild()

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-[#E8EAF0] flex flex-col shadow-sm">

      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0095F6] flex items-center justify-center">
            <span className="text-white text-[16px]">🎒</span>
          </div>
          <div>
            <p className="font-extrabold text-[15px] text-[#0A0A0A] leading-tight">Arahami</p>
            <p className="text-[10px] text-[#A8A8A8] font-medium tracking-wide">MODE ORANG TUA</p>
          </div>
        </div>
      </div>

      {/* Child Switcher */}
      {children.length > 0 && (
        <div className="mx-3 mb-2 rounded-2xl bg-[#F5F7FA] border border-[#E8EAF0] p-3 space-y-2">
          <p className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-widest px-1">Anak</p>

          {/* Selected child */}
          {selected && (
            <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-[#E8EAF0]">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[18px] shrink-0">
                {themeEmoji(selected.theme)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-[#0A0A0A] leading-tight truncate">{selected.name}</p>
                <p className="text-[11px] text-[#737373]">Kelas {selected.kelas}</p>
              </div>
            </div>
          )}

          {/* Switch buttons + tambah */}
          {(children.length > 1 || true) && (
            <div className="flex gap-1.5 flex-wrap">
              {children.filter(c => c.id !== selected?.id).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E8EAF0] text-[11px] font-semibold text-[#737373] hover:text-[#0095F6] hover:border-[#0095F6] transition-colors"
                >
                  <span>{themeEmoji(c.theme)}</span>
                  <span>{c.name}</span>
                </button>
              ))}
              <button
                onClick={() => router.push('/onboarding')}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-dashed border-[#0095F6] text-[#0095F6] hover:bg-[#EFF6FF] transition-colors text-[14px] font-bold"
                title="Tambah anak"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all
                ${active
                  ? 'bg-[#EFF6FF] text-[#0095F6] shadow-sm'
                  : 'text-[#374151] hover:bg-[#F5F7FA] hover:text-[#0A0A0A]'
                }
              `}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-[#0095F6]' : 'text-[#9CA3AF]'}
              />
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0095F6]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer version */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-[#D1D5DB]">Arahami Web v0.1</p>
      </div>
    </aside>
  )
}
