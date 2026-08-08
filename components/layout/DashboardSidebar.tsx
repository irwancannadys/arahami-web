'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BarChart2,
  MessageCircle,
  Gift,
  Settings,
  LogOut,
  BookOpen,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/beranda',     label: 'Beranda',    icon: Home },
  { href: '/laporan',     label: 'Laporan',    icon: BarChart2 },
  { href: '/pesan',       label: 'Pesan',      icon: MessageCircle },
  { href: '/reward',      label: 'Reward',     icon: Gift },
  { href: '/pengaturan',  label: 'Pengaturan', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await signOut(auth)
    document.cookie = 'arahami_auth=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-[#DBDBDB] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#DBDBDB]">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🎒</span>
          <div>
            <p className="font-bold text-[15px] leading-tight">Arahami</p>
            <p className="text-[11px] text-[#737373]">Mode Orang Tua</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors
                ${active
                  ? 'bg-[#E0F2FE] text-[#0095F6]'
                  : 'text-[#0A0A0A] hover:bg-[#F5F5F5]'
                }
              `}
            >
              <Icon
                size={18}
                className={active ? 'text-[#0095F6]' : 'text-[#737373]'}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#DBDBDB]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-colors"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
