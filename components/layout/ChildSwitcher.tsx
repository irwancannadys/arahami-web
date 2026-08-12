'use client'

import { useChild } from '@/lib/context/ChildContext'

export function ChildSwitcher() {
  const { children, selected, setSelected } = useChild()

  if (children.length <= 1) return null

  return (
    <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1">
      {children.map(child => (
        <button
          key={child.id}
          onClick={() => setSelected(child)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
            selected?.id === child.id
              ? 'bg-white shadow-sm text-[#0A0A0A]'
              : 'text-[#737373] hover:text-[#0A0A0A]'
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  )
}
