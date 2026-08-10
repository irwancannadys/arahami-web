'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { Settings, LogOut } from 'lucide-react'

interface Props {
  title:     string
  subtitle?: string
}

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0][0].toUpperCase()
}

function Avatar({ name, photoURL }: { name: string; photoURL: string | null }) {
  const [failed, setFailed] = useState(false)

  if (photoURL && !failed) {
    return (
      <img
        src={photoURL}
        alt="avatar"
        onError={() => setFailed(true)}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-white ring-offset-1 ring-offset-[#E8EAF0]"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0095F6] to-[#0074CC] flex items-center justify-center text-white text-[12px] font-bold ring-2 ring-white ring-offset-1 ring-offset-[#E8EAF0]">
      {initials(name)}
    </div>
  )
}

export function DashboardHeader({ title, subtitle }: Props) {
  const { user }          = useAuthContext()
  const router            = useRouter()
  const [open, setOpen]   = useState(false)
  const dropdownRef       = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await signOut(auth)
    document.cookie = 'arahami_auth=; path=/; max-age=0'
    router.push('/login')
  }

  const displayName = user?.displayName ?? user?.email ?? 'User'
  const email       = user?.email ?? ''

  return (
    <header className="h-14 bg-white border-b border-[#E8EAF0] px-6 flex items-center justify-between shrink-0 shadow-sm">
      <div>
        <h1 className="font-bold text-[16px] text-[#0A0A0A] leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-[#9CA3AF]">{subtitle}</p>}
      </div>

      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-[13px] text-[#6B7280] font-medium hidden sm:block">
              {displayName}
            </span>
            <Avatar name={displayName} photoURL={user.photoURL} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-xl border border-[#E8EAF0] overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <p className="font-semibold text-[14px] text-[#0A0A0A] truncate">{displayName}</p>
                {email && <p className="text-[12px] text-[#9CA3AF] truncate mt-0.5">{email}</p>}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); router.push('/pengaturan') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#F5F7FA] transition-colors"
                >
                  <Settings size={16} className="text-[#9CA3AF]" />
                  Pengaturan
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogOut size={16} className="text-[#EF4444]" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
