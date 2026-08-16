'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, MessageCircle, Gift } from 'lucide-react'
import { useChild } from '@/lib/context/ChildContext'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { themeEmoji } from '@/lib/theme'

const NAV = [
  { href: '/beranda', label: 'Beranda', icon: Home },
  { href: '/laporan', label: 'Laporan', icon: BarChart2 },
  { href: '/reward',  label: 'Reward',  icon: Gift },
  { href: '/pesan',   label: 'Pesan',   icon: MessageCircle },
]

export function DashboardSidebar() {
  const pathname                            = usePathname()
  const { children, selected, setSelected } = useChild()
  const { user }                            = useAuthContext()

  const parentName = user?.displayName ?? 'Orang Tua'

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-[#E8EAF0] flex flex-col shadow-sm">

      {/* Logo + parent identity */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6]">
        <Image src="/logo-text.png" alt="Arahami" width={120} height={32} className="mb-4" />
        <div className="bg-[#F8FAFC] border border-[#E8EAF0] rounded-xl px-3 py-2.5">
          <p className="text-[13px] font-bold text-[#0A0A0A] leading-tight truncate">{parentName}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Parent's Mode</p>
        </div>
      </div>

      {/* Children list */}
      {children.length > 0 && (
        <div className="mx-3 mt-4 mb-3">
          <p className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-widest px-1 mb-1.5">Anak</p>
          <div className="space-y-1">
            {children.map(child => {
              const isActive = selected?.id === child.id
              return (
                <button
                  key={child.id}
                  onClick={() => setSelected(child)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#EFF6FF] border border-[#BFDBFE] shadow-sm'
                      : 'hover:bg-[#F5F7FA]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[15px] shrink-0 ${
                    isActive ? 'bg-[#DBEAFE]' : 'bg-[#F3F4F6]'
                  }`}>
                    {themeEmoji(child.theme)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold leading-tight truncate ${
                      isActive ? 'text-[#0095F6]' : 'text-[#374151]'
                    }`}>
                      {child.name}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">Kelas {child.kelas}</p>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#0095F6] shrink-0" />}
                </button>
              )
            })}
          </div>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                active
                  ? 'bg-[#EFF6FF] text-[#0095F6] shadow-sm'
                  : 'text-[#374151] hover:bg-[#F5F7FA] hover:text-[#0A0A0A]'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#0095F6]' : 'text-[#9CA3AF]'} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0095F6]" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-[#D1D5DB]">Arahami Web v0.1</p>
      </div>
    </aside>
  )
}
