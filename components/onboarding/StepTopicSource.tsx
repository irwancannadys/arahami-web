'use client'

import { useState } from 'react'
import type { OnboardingData } from '@/app/onboarding/page'
import { SUBJECT_LABELS, DAYS } from '@/lib/curriculum'

const MAX_PHOTOS = 4

const SOURCES = [
  { value: 'AI',    label: '🤖 Kurikulum Merdeka (AI)', desc: 'Topik diambil otomatis dari kurikulum nasional' },
  { value: 'PHOTO', label: '📷 Foto Buku',              desc: 'Upload foto daftar isi buku pelajaran tiap mapel' },
]

interface Props { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }

async function fileToBase64(file: File): Promise<{ imageBase64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ imageBase64: result.split(',')[1], mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function StepTopicSource({ data, onChange }: Props) {
  const allSubjects = [...new Set(DAYS.flatMap(d => data.schedules[d] ?? []))]

  const [activeSubject, setActiveSubject] = useState<string | null>(() => {
    if (data.topicSource !== 'PHOTO') return null
    return allSubjects.find(s => !data.confirmedSubjects.includes(s)) ?? null
  })
  const [uploadingSubject, setUploadingSubject] = useState<string | null>(null)

  function selectSource(value: string) {
    onChange({ topicSource: value, confirmedSubjects: [], photosBySubject: {} })
    setActiveSubject(value === 'PHOTO' ? (allSubjects[0] ?? null) : null)
  }

  async function handleFileChange(subject: string, files: FileList | null) {
    if (!files || files.length === 0) return
    const existing = data.photosBySubject[subject] ?? []
    const canAdd   = MAX_PHOTOS - existing.length
    if (canAdd <= 0) return
    setUploadingSubject(subject)
    try {
      const newPhotos = await Promise.all(Array.from(files).slice(0, canAdd).map(fileToBase64))
      onChange({ photosBySubject: { ...data.photosBySubject, [subject]: [...existing, ...newPhotos] } })
    } finally {
      setUploadingSubject(null)
    }
  }

  function removePhoto(subject: string, idx: number) {
    const updated = [...(data.photosBySubject[subject] ?? [])]
    updated.splice(idx, 1)
    onChange({
      photosBySubject:   { ...data.photosBySubject, [subject]: updated },
      confirmedSubjects: data.confirmedSubjects.filter(s => s !== subject),
    })
  }

  function confirmSubject(subject: string) {
    const newConfirmed = [...new Set([...data.confirmedSubjects, subject])]
    onChange({ confirmedSubjects: newConfirmed })
    const next = allSubjects.find(s => !newConfirmed.includes(s))
    setActiveSubject(next ?? null)
  }

  function openSubject(subject: string) {
    onChange({ confirmedSubjects: data.confirmedSubjects.filter(s => s !== subject) })
    setActiveSubject(subject)
  }

  function tapCollapsed(subject: string) {
    setActiveSubject(subject)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-extrabold text-[18px]">Sumber Topik</h2>
        <p className="text-[13px] text-[#737373] mt-0.5">Dari mana topik kuis anak diambil?</p>
      </div>

      {/* Source cards */}
      <div className="space-y-3">
        {SOURCES.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => selectSource(value)}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              data.topicSource === value
                ? 'bg-[#E0F2FE] border-[#0095F6]'
                : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
            }`}
          >
            <p className={`font-semibold text-[14px] ${data.topicSource === value ? 'text-[#0095F6]' : ''}`}>
              {label}
            </p>
            <p className="text-[12px] text-[#737373] mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      {/* Photo upload accordion */}
      {data.topicSource === 'PHOTO' && (
        <div className="space-y-2 pt-1">
          <div>
            <p className="text-[13px] font-semibold text-[#0A0A0A]">Upload foto daftar isi per mapel:</p>
            <p className="text-[12px] text-[#737373] mt-0.5">Semua mapel wajib diisi minimal 1 foto</p>
          </div>

          {allSubjects.map(subject => {
            const isConfirmed = data.confirmedSubjects.includes(subject)
            const isActive    = activeSubject === subject && !isConfirmed
            const photos      = data.photosBySubject[subject] ?? []
            const label       = SUBJECT_LABELS[subject] ?? subject

            // State: CONFIRMED (hijau)
            if (isConfirmed) {
              return (
                <button
                  key={subject}
                  onClick={() => openSubject(subject)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-[#22C55E] bg-[#F0FDF4] hover:bg-[#DCFCE7] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#15803D]">✓ {label}</span>
                    <span className="text-[12px] text-[#15803D]">{photos.length} foto · Tap untuk edit</span>
                  </div>
                </button>
              )
            }

            // State: ACTIVE (biru, expanded)
            if (isActive) {
              return (
                <div key={subject} className="border border-[#0095F6] rounded-xl p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#0095F6]">{label}</p>
                    {photos.length < MAX_PHOTOS ? (
                      <label className={`px-3 py-1.5 rounded-lg bg-[#F5F5F5] border border-[#DBDBDB] text-[12px] font-semibold hover:bg-[#EBEBEB] transition-colors inline-flex items-center gap-1.5 ${uploadingSubject === subject ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}>
                        {uploadingSubject === subject && (
                          <span className="w-3 h-3 border-2 border-[#DBDBDB] border-t-[#0095F6] rounded-full animate-spin" />
                        )}
                        + Upload
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingSubject === subject}
                          onChange={e => handleFileChange(subject, e.target.files)}
                        />
                      </label>
                    ) : (
                      <span className="text-[11px] text-[#A8A8A8]">Maks. {MAX_PHOTOS} foto</span>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {photos.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {photos.map((photo, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={`data:${photo.mimeType};base64,${photo.imageBase64}`}
                            alt={`Foto ${idx + 1}`}
                            className="w-[72px] h-[72px] object-cover rounded-lg border border-[#DBDBDB]"
                          />
                          <button
                            onClick={() => removePhoto(subject, idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#A8A8A8]">Belum ada foto — tap "+ Upload" untuk mulai</p>
                  )}

                  {/* Confirm button */}
                  <button
                    onClick={() => confirmSubject(subject)}
                    disabled={photos.length === 0}
                    className="w-full py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
                  >
                    ✓ Selesai Mapel Ini
                  </button>
                </div>
              )
            }

            // State: DEFAULT (abu, collapsed)
            return (
              <button
                key={subject}
                onClick={() => tapCollapsed(subject)}
                className="w-full text-left px-4 py-3 rounded-xl border border-[#DBDBDB] hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{label}</span>
                  <span className="text-[12px] text-[#A8A8A8]">
                    {photos.length > 0 ? `${photos.length} foto · Tap untuk lanjut` : 'Belum ada foto'}
                  </span>
                </div>
              </button>
            )
          })}

          <div className="mt-1 rounded-xl bg-[#FFF9EC] border border-[#FCD34D] p-3 space-y-1">
            <p className="text-[12px] font-semibold text-[#92400E]">💡 Tips foto biar hasilnya akurat:</p>
            <ul className="text-[11px] text-[#92400E] space-y-0.5 pl-1">
              <li>• Foto dari atas langsung — jangan miring</li>
              <li>• Tekan halaman rata, jangan biarkan lipatan buku menutupi teks</li>
              <li>• Pastikan seluruh daftar isi terbaca, tidak terpotong</li>
              <li>• Cahaya cukup dan merata, hindari bayangan di atas teks</li>
              <li>• Kalau daftar isi 2 halaman, upload keduanya</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
