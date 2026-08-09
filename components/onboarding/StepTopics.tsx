'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/onboarding/page'
import { SUBJECT_LABELS } from '@/lib/curriculum'

interface Props { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }

export function StepTopics({ data, onChange }: Props) {
  const subjects = Object.keys(data.topics)
  const [active, setActive] = useState(subjects[0] ?? '')

  const current    = data.topics[active] ?? []
  const manualList = data.manualTopicInputsBySubject[active] ?? ['']
  const isCustom   = active in data.manualTopicInputsBySubject && current.length === 0

  const selectedCount = current.filter(t => t.selected).length
  const allSelected   = current.length > 0 && current.every(t => t.selected)

  // ── Toggle single topic ─────────────────────────────────────────────────
  function toggleTopic(subject: string, idx: number) {
    const list  = [...(data.topics[subject] ?? [])]
    list[idx]   = { ...list[idx], selected: !list[idx].selected }
    onChange({ topics: { ...data.topics, [subject]: list } })
  }

  // ── Select / deselect all for active subject ────────────────────────────
  function toggleAll() {
    const list    = [...(data.topics[active] ?? [])]
    const updated = list.map(t => ({ ...t, selected: !allSelected }))
    onChange({ topics: { ...data.topics, [active]: updated } })
  }

  // ── Manual input helpers ────────────────────────────────────────────────
  function updateManualInput(subject: string, idx: number, value: string) {
    const inputs  = [...(data.manualTopicInputsBySubject[subject] ?? [''])]
    inputs[idx]   = value
    onChange({ manualTopicInputsBySubject: { ...data.manualTopicInputsBySubject, [subject]: inputs } })
  }

  function addManualField(subject: string) {
    const inputs = [...(data.manualTopicInputsBySubject[subject] ?? [''])]
    onChange({ manualTopicInputsBySubject: { ...data.manualTopicInputsBySubject, [subject]: [...inputs, ''] } })
  }

  function confirmManualTopics(subject: string) {
    const inputs      = data.manualTopicInputsBySubject[subject] ?? []
    const validTopics = inputs
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(name => ({ name, selected: true }))

    if (validTopics.length === 0) return

    const existing = (data.topics[subject] ?? []).filter(t =>
      !validTopics.some(v => v.name === t.name)
    )
    const merged = [...existing, ...validTopics]

    onChange({
      topics: { ...data.topics, [subject]: merged },
      manualTopicInputsBySubject: {
        ...data.manualTopicInputsBySubject,
        [subject]: [''],
      },
    })
  }

  function showManualInput(subject: string) {
    if (data.manualTopicInputsBySubject[subject]) return  // already open
    onChange({ manualTopicInputsBySubject: { ...data.manualTopicInputsBySubject, [subject]: [''] } })
  }

  const hasManualSection = active in data.manualTopicInputsBySubject

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-extrabold text-[18px]">Centang Topik</h2>
        <p className="text-[13px] text-[#737373] mt-0.5">Pilih minimal 1 topik per mapel</p>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {subjects.map(subject => {
          const count  = data.topics[subject]?.filter(t => t.selected).length ?? 0
          const custom = subject in data.manualTopicInputsBySubject && (data.topics[subject]?.length ?? 0) === 0
          return (
            <button
              key={subject}
              onClick={() => setActive(subject)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                active === subject
                  ? 'bg-[#0095F6] border-[#0095F6] text-white'
                  : count > 0
                    ? 'border-[#22C55E] text-[#15803D] bg-[#F0FDF4]'
                    : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}
            >
              {SUBJECT_LABELS[subject] ?? subject}
              {custom && <span className="ml-1 opacity-70">✏️</span>}
              {count > 0 && <span className="ml-1">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Topics area */}
      <div className="space-y-2">
        {/* Select All row — only show if there are preset topics */}
        {current.length > 0 && (
          <div className="flex items-center justify-between pb-1 border-b border-[#DBDBDB]">
            <span className="text-[12px] text-[#737373]">
              {selectedCount} dari {current.length} dipilih
            </span>
            <button
              onClick={toggleAll}
              className="text-[12px] font-semibold text-[#0095F6] hover:underline"
            >
              {allSelected ? 'Hapus Semua' : 'Centang Semua'}
            </button>
          </div>
        )}

        {/* Preset / AI topics */}
        {current.map((topic, idx) => (
          <label
            key={idx}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#DBDBDB] cursor-pointer hover:bg-[#F5F5F5] transition-colors"
          >
            <input
              type="checkbox"
              checked={topic.selected}
              onChange={() => toggleTopic(active, idx)}
              className="w-4 h-4 accent-[#0095F6] cursor-pointer"
            />
            <span className="text-[14px] font-medium">{topic.name}</span>
          </label>
        ))}

        {/* Manual input section — for custom subjects OR when user taps "Tambah topik" */}
        {hasManualSection && (
          <div className="mt-3 space-y-2 border-t border-[#DBDBDB] pt-3">
            <p className="text-[12px] font-semibold text-[#737373]">
              {isCustom ? 'Mapel kustom — tulis topik secara manual:' : 'Tambah topik manual:'}
            </p>
            {manualList.map((val, idx) => (
              <input
                key={idx}
                type="text"
                value={val}
                onChange={e => updateManualInput(active, idx, e.target.value)}
                placeholder={`Topik ${idx + 1}...`}
                className="w-full border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[#0095F6] transition-colors"
              />
            ))}
            <div className="flex justify-between items-center">
              <button
                onClick={() => addManualField(active)}
                className="text-[13px] text-[#0095F6] font-semibold hover:underline"
              >
                + Tambah Topik
              </button>
              {manualList.some(v => v.trim().length > 0) && (
                <button
                  onClick={() => confirmManualTopics(active)}
                  className="px-4 py-1.5 rounded-lg bg-[#0095F6] text-white text-[13px] font-semibold hover:bg-[#0074CC] transition-colors"
                >
                  Simpan Topik ✓
                </button>
              )}
            </div>
          </div>
        )}

        {/* "Tambah topik manual" trigger — for standard subjects that don't have manual section yet */}
        {!hasManualSection && (
          <button
            onClick={() => showManualInput(active)}
            className="w-full text-[12px] text-[#737373] hover:text-[#0095F6] py-2 border border-dashed border-[#DBDBDB] rounded-xl hover:border-[#0095F6] transition-colors"
          >
            + Tambah topik manual
          </button>
        )}
      </div>

      {/* Validation hints */}
      {selectedCount === 0 && !isCustom && current.length > 0 && (
        <p className="text-[12px] text-red-500">
          Pilih minimal 1 topik untuk {SUBJECT_LABELS[active] ?? active}
        </p>
      )}
      {isCustom && current.length === 0 && (
        <p className="text-[12px] text-amber-600">
          Tulis topik lalu klik "Simpan Topik" untuk melanjutkan
        </p>
      )}
    </div>
  )
}
