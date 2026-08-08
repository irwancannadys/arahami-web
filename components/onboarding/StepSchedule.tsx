'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/onboarding/page'
import { DAYS, DAY_LABELS, SUBJECTS, SUBJECT_LABELS } from '@/lib/curriculum'

interface Props { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }

export function StepSchedule({ data, onChange }: Props) {
  const [activeDay, setActiveDay]     = useState(DAYS[0])
  const [showInput, setShowInput]     = useState(false)
  const [customInput, setCustomInput] = useState('')

  function toggle(subject: string) {
    const current = data.schedules[activeDay] ?? []
    const updated  = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject]
    onChange({ schedules: { ...data.schedules, [activeDay]: updated } })
  }

  function addCustomSubject() {
    const val = customInput.trim()
    if (val.length < 2) return
    const existing = data.customSubjectsByDay[activeDay] ?? []
    if (existing.includes(val)) { setCustomInput(''); setShowInput(false); return }

    // Tambah ke custom list hari ini, TIDAK auto-select (sama seperti mobile)
    onChange({
      customSubjectsByDay: {
        ...data.customSubjectsByDay,
        [activeDay]: [...existing, val],
      },
    })
    setCustomInput('')
    setShowInput(false)
  }

  const daySubjects    = data.schedules[activeDay] ?? []
  const customSubjects = data.customSubjectsByDay?.[activeDay] ?? []
  const allSubjects    = [...SUBJECTS, ...customSubjects]
  const tooFew         = daySubjects.length < 2

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-extrabold text-[18px]">Jadwal Mapel</h2>
        <p className="text-[13px] text-[#737373] mt-0.5">Pilih minimal 2 mapel per hari</p>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5">
        {DAYS.map(day => {
          const count  = data.schedules[day]?.length ?? 0
          const enough = count >= 2
          return (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setShowInput(false); setCustomInput('') }}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                activeDay === day
                  ? 'bg-[#0095F6] border-[#0095F6] text-white'
                  : enough
                    ? 'border-[#22C55E] text-[#15803D] bg-[#F0FDF4]'
                    : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}
            >
              {DAY_LABELS[day].slice(0,3)}
              {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Subject chips */}
      <div className="flex flex-wrap gap-2">
        {allSubjects.map(subject => {
          const selected = daySubjects.includes(subject)
          const label    = SUBJECT_LABELS[subject] ?? subject
          return (
            <button
              key={subject}
              onClick={() => toggle(subject)}
              className={`px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
                selected
                  ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]'
                  : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}
            >
              {label}
            </button>
          )
        })}

        {/* + Tambah Mapel */}
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="px-3 py-1.5 rounded-lg border border-dashed border-[#0095F6] text-[#0095F6] text-[13px] font-semibold hover:bg-[#E0F2FE] transition-colors"
          >
            + Tambah Mapel
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustomSubject(); if (e.key === 'Escape') { setShowInput(false); setCustomInput('') } }}
              placeholder="Nama mapel..."
              className="border border-[#0095F6] rounded-lg px-3 py-1.5 text-[13px] outline-none w-36"
            />
            <button
              onClick={addCustomSubject}
              disabled={customInput.trim().length < 2}
              className="px-3 py-1.5 rounded-lg bg-[#0095F6] text-white text-[13px] font-semibold disabled:opacity-40"
            >
              Tambah
            </button>
            <button
              onClick={() => { setShowInput(false); setCustomInput('') }}
              className="text-[#737373] text-[13px]"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {tooFew && daySubjects.length > 0 && (
        <p className="text-[12px] text-red-500">
          {DAY_LABELS[activeDay]}: pilih minimal 2 mapel ({daySubjects.length}/2)
        </p>
      )}
    </div>
  )
}
