'use client'

import { useAuthContext } from '@/components/layout/AuthProvider'

interface Props {
  title:    string
  subtitle?: string
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

      {/* User avatar */}
      {user && (
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-[#737373] font-medium">
            {user.displayName ?? user.email}
          </span>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-[#DBDBDB]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0095F6] text-[13px] font-bold">
              {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
