'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/layout/AuthProvider'

interface Props {
  title:     string
  subtitle?: string
}

function Avatar({ name, photoURL }: { name: string; photoURL: string | null }) {
  const [imgFailed, setImgFailed] = useState(false)
  const words   = (name ?? 'U').trim().split(/\s+/)
  const initial = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0][0].toUpperCase()

  if (photoURL && !imgFailed) {
    return (
      <img
        src={photoURL}
        alt="avatar"
        onError={() => setImgFailed(true)}
        className="w-8 h-8 rounded-full border border-[#DBDBDB] object-cover"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0095F6] text-[13px] font-bold shrink-0">
      {initial}
    </div>
  )
}

export function DashboardHeader({ title, subtitle }: Props) {
  const { user } = useAuthContext()

  return (
    <header className="h-14 bg-white border-b border-[#DBDBDB] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="font-bold text-[16px] leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-[#737373]">{subtitle}</p>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-[#737373] font-medium">
            {user.displayName ?? user.email}
          </span>
          <Avatar
            name={user.displayName ?? user.email ?? 'U'}
            photoURL={user.photoURL}
          />
        </div>
      )}
    </header>
  )
}
