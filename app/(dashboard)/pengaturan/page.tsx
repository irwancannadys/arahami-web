'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  doc, collection, getDocs, updateDoc, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useChild } from '@/lib/context/ChildContext'
import { childDoc, schedulesCol, topicsCol } from '@/lib/firebase/firestore-paths'
import { DAYS, WEEKEND_DAYS, DAY_LABELS, SUBJECTS, SUBJECT_LABELS } from '@/lib/curriculum'
import type { Child, Schedule, Topic } from '@/lib/types'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { themeEmoji } from '@/lib/theme'
import { ChevronRight, ArrowLeft } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type EditTab = 'profil' | 'jadwal' | 'topik' | 'kode' | 'reward'

const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: 'profil',  label: 'Profil' },
  { key: 'jadwal',  label: 'Jadwal' },
  { key: 'topik',   label: 'Topik' },
  { key: 'kode',    label: 'Kode Anak' },
  { key: 'reward',  label: 'Reward' },
]

// ─── 20 preset reward ─────────────────────────────────────────────────────────

const REWARD_PRESETS = [
  { key: 'es_krim',        label: 'Es Krim',        emoji: '🍦' },
  { key: 'jalan_jalan',    label: 'Jalan-jalan',     emoji: '🎡' },
  { key: 'makan_enak',     label: 'Makan Enak',      emoji: '🍗' },
  { key: 'main_game',      label: 'Main Game',       emoji: '🎮' },
  { key: 'buku',           label: 'Buku',            emoji: '📕' },
  { key: 'nonton',         label: 'Nonton',          emoji: '🍿' },
  { key: 'pizza',          label: 'Pizza',           emoji: '🍕' },
  { key: 'bakso',          label: 'Bakso',           emoji: '🍜' },
  { key: 'taman',          label: 'Main di Taman',   emoji: '🌳' },
  { key: 'renang',         label: 'Renang',          emoji: '🏊' },
  { key: 'mainan',         label: 'Mainan',          emoji: '🧸' },
  { key: 'bioskop',        label: 'Bioskop',         emoji: '🎬' },
  { key: 'sushi',          label: 'Sushi',           emoji: '🍱' },
  { key: 'burger',         label: 'Burger',          emoji: '🍔' },
  { key: 'trampolin',      label: 'Trampolin',       emoji: '🤸' },
  { key: 'kebun_binatang', label: 'Kebun Binatang',  emoji: '🦁' },
  { key: 'kue',            label: 'Kue',             emoji: '🎂' },
  { key: 'komik',          label: 'Komik',           emoji: '📚' },
  { key: 'bowling',        label: 'Bowling',         emoji: '🎳' },
  { key: 'stiker',         label: 'Stiker',          emoji: '⭐' },
]
const ALL_REWARD_KEYS = REWARD_PRESETS.map(r => r.key)

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SaveButton({ onClick, loading, label = 'Simpan Perubahan', disabled: extraDisabled = false }: {
  onClick: () => void; loading: boolean; label?: string; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || extraDisabled}
      className="w-full py-3 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
    >
      {loading ? 'Menyimpan...' : label}
    </button>
  )
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-[13px] font-semibold text-[#15803D]">
      <span>✓</span>
      <span>{message}</span>
    </div>
  )
}

// ─── Tab: Edit Profil ─────────────────────────────────────────────────────────

const GRADES  = [1,2,3,4,5,6]
const GENDERS = [{ value: 'L', label: '👦 Laki-laki' }, { value: 'P', label: '👧 Perempuan' }]
const THEMES_BOY  = ['⚽ Sepak Bola','🤖 Robot','🎒 Petualang','🦕 Dinosaurus']
const THEMES_GIRL = ['👑 Princess','🐱 Kucing','🧁 Bakery','🧜‍♀️ Putri Duyung']

function TabProfil({ child, uid, onSaved }: { child: Child; uid: string; onSaved: (msg: string) => void }) {
  const [name,   setName]   = useState(child.name)
  const [grade,  setGrade]  = useState(child.kelas)
  const [gender, setGender] = useState(child.gender)
  const [theme,  setTheme]  = useState(child.theme)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [showGradeWarn, setShowGradeWarn] = useState(false)
  const [pendingGrade,  setPendingGrade]  = useState<number | null>(null)

  const themes   = gender === 'L' ? THEMES_BOY : gender === 'P' ? THEMES_GIRL : []
  const canSave  = !!(name.trim() && gender && theme)

  function handleGradeClick(g: number) {
    if (g !== grade) { setPendingGrade(g); setShowGradeWarn(true) }
  }

  async function save() {
    if (!canSave) return
    setSaving(true); setError('')
    try {
      const gradeChanged = grade !== child.kelas
      await updateDoc(childDoc(uid, child.id), { name: name.trim(), kelas: grade, gender, theme })

      if (gradeChanged) {
        const topicsSnap = await getDocs(topicsCol(uid, child.id))
        const batch = writeBatch(db)
        topicsSnap.docs.forEach(d => batch.delete(d.ref))
        await batch.commit()

        const schedulesSnap = await getDocs(schedulesCol(uid, child.id))
        const allSubjects = [...new Set(schedulesSnap.docs.flatMap(d => (d.data() as Schedule).subjects))]
        if (allSubjects.length > 0) {
          const idToken = await auth.currentUser?.getIdToken()
          const res = await fetch('/api/ai/generate-topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ kelas: grade, subjects: allSubjects }),
          })
          if (res.ok) {
            const aiTopics: Record<string, string[]> = await res.json()
            const batch2 = writeBatch(db)
            allSubjects.forEach(subject => {
              ;(aiTopics[subject] ?? []).forEach((topicName, idx) => {
                const ref = doc(collection(db, 'users', uid, 'children', child.id, 'topics'))
                batch2.set(ref, { id: ref.id, subject, topicName, source: 'AI', isDone: false, order: idx })
              })
            })
            await batch2.commit()
          }
        }
        onSaved('Profil disimpan & topik dibuat ulang untuk kelas ' + grade)
      } else {
        onSaved('Profil berhasil disimpan')
      }
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Nama */}
      <div>
        <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Nama anak</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[#0095F6] transition-colors"
        />
      </div>

      {/* Kelas */}
      <div>
        <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Kelas</label>
        <div className="flex gap-2 flex-wrap">
          {GRADES.map(g => (
            <button key={g} onClick={() => g !== grade ? handleGradeClick(g) : undefined}
              className={`px-4 py-2 rounded-xl border text-[14px] font-semibold transition-colors ${
                grade === g ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]' : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}>
              Kelas {g}
            </button>
          ))}
        </div>
        {grade !== child.kelas && (
          <p className="text-[12px] text-amber-600 mt-1.5">⚠️ Topik akan dihapus & dibuat ulang dari AI</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Jenis kelamin</label>
        <div className="flex gap-3">
          {GENDERS.map(({ value, label }) => (
            <button key={value} onClick={() => { setGender(value); setTheme('') }}
              className={`flex-1 py-2.5 rounded-xl border text-[14px] font-semibold transition-colors ${
                gender === value ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]' : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tema */}
      {themes.length > 0 && (
        <div>
          <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Tema favorit</label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={`py-2.5 rounded-xl border text-[14px] font-semibold transition-colors ${
                  theme === t ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]' : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <SaveButton onClick={save} loading={saving} />

      {/* Grade warning dialog */}
      {showGradeWarn && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-3xl text-center">⚠️</div>
            <div className="text-center">
              <h3 className="font-extrabold text-[17px]">Ganti ke Kelas {pendingGrade}?</h3>
              <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">
                Semua topik kuis akan dihapus dan dibuat ulang sesuai kurikulum kelas {pendingGrade}.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowGradeWarn(false); setPendingGrade(null) }}
                className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-colors">
                Batal
              </button>
              <button onClick={() => { if (pendingGrade) setGrade(pendingGrade); setShowGradeWarn(false); setPendingGrade(null) }}
                className="flex-1 py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-bold hover:bg-[#0074CC] transition-colors">
                Ya, Ganti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Edit Jadwal ─────────────────────────────────────────────────────────

function TabJadwal({ child, uid, onSaved }: { child: Child; uid: string; onSaved: (msg: string, switchToTab?: EditTab) => void }) {
  const ALL_DAYS = [...DAYS, ...WEEKEND_DAYS]

  const [schedules,        setSchedules]        = useState<Record<string, string[]>>({})
  const [savedSchedules,   setSavedSchedules]   = useState<Record<string, string[]>>({})
  const [originalSubjects, setOriginalSubjects] = useState<string[]>([])
  const [customByDay,      setCustomByDay]      = useState<Record<string, string[]>>({})
  const [activeDay,        setActiveDay]        = useState(DAYS[0])
  const [showInput,        setShowInput]        = useState(false)
  const [customInput,      setCustomInput]      = useState('')
  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState('')
  const [removeWarning,       setRemoveWarning]       = useState<string[] | null>(null)
  const [weekendEnabled,      setWeekendEnabled]      = useState(child.enableWeekend ?? false)
  const [showWeekendOffDialog,setShowWeekendOffDialog] = useState(false)
  const [weekendOffLoading,   setWeekendOffLoading]   = useState(false)

  useEffect(() => {
    async function load() {
      const snap   = await getDocs(schedulesCol(uid, child.id))
      const loaded: Record<string, string[]> = {}
      snap.docs.forEach(d => { const s = d.data() as Schedule; loaded[s.day] = s.subjects })
      const full = Object.fromEntries(ALL_DAYS.map(d => [d, loaded[d] ?? []]))
      setSchedules(full)
      setSavedSchedules(full)
      setOriginalSubjects([...new Set(Object.values(full).flat())])
      const customSubs = child.customSubjects ?? []
      const byDay: Record<string, string[]> = {}
      ALL_DAYS.forEach(day => { byDay[day] = (loaded[day] ?? []).filter(s => customSubs.includes(s)) })
      setCustomByDay(byDay)
      setLoading(false)
    }
    load()
  }, [uid, child.id, child.customSubjects])

  function toggle(subject: string) {
    const current = schedules[activeDay] ?? []
    const updated  = current.includes(subject) ? current.filter(s => s !== subject) : [...current, subject]
    setSchedules(prev => ({ ...prev, [activeDay]: updated }))
  }

  function addCustom() {
    const val = customInput.trim()
    if (val.length < 2) return
    const existing = customByDay[activeDay] ?? []
    if (existing.includes(val)) { setCustomInput(''); setShowInput(false); return }
    setCustomByDay(prev => ({ ...prev, [activeDay]: [...existing, val] }))
    setCustomInput(''); setShowInput(false)
  }

  async function handleSave() {
    const newAll  = [...new Set(ALL_DAYS.flatMap(d => schedules[d] ?? []))]
    const removed = originalSubjects.filter(s => !newAll.includes(s))
    if (removed.length > 0) {
      const topicsSnap = await getDocs(topicsCol(uid, child.id))
      const removedWithTopics = removed.filter(s => topicsSnap.docs.some(d => d.data().subject === s))
      if (removedWithTopics.length > 0) { setRemoveWarning(removedWithTopics); return }
    }
    await doSave(removed)
  }

  async function doSave(subjectsToRemove: string[] = []) {
    setSaving(true); setError('')
    try {
      const batch = writeBatch(db)
      // Simpan semua hari (weekday + weekend)
      ALL_DAYS.forEach(day => {
        const subjects = schedules[day] ?? []
        const ref = doc(schedulesCol(uid, child.id), day)
        subjects.length > 0 ? batch.set(ref, { id: day, day, subjects }) : batch.delete(ref)
      })
      if (subjectsToRemove.length > 0) {
        const topicsSnap = await getDocs(topicsCol(uid, child.id))
        topicsSnap.docs.filter(d => subjectsToRemove.includes(d.data().subject)).forEach(d => batch.delete(d.ref))
      }
      const allCustom = [...new Set(Object.values(customByDay).flat())]
      batch.update(childDoc(uid, child.id), { customSubjects: allCustom, enableWeekend: weekendEnabled })
      await batch.commit()
      setSavedSchedules({ ...schedules })
      setRemoveWarning(null)

      // Cek apakah ada mapel weekend baru yang belum punya topik
      if (weekendEnabled) {
        const weekendSubjects = [...new Set([
          ...(schedules['SATURDAY'] ?? []),
          ...(schedules['SUNDAY']   ?? []),
        ])]
        if (weekendSubjects.length > 0) {
          const topicsSnap2       = await getDocs(topicsCol(uid, child.id))
          const hasTopics         = new Set(topicsSnap2.docs.map(d => d.data().subject as string))
          const withoutTopics     = weekendSubjects.filter(s => !hasTopics.has(s))
          if (withoutTopics.length > 0) {
            const names = withoutTopics.map(s => SUBJECT_LABELS[s] ?? s).join(', ')
            onSaved(`Jadwal disimpan! Tambahkan topik untuk: ${names}`, 'topik')
            return
          }
        }
      }

      onSaved('Jadwal berhasil disimpan')
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // Matikan weekend: hapus jadwal Sabtu/Minggu + topik weekend-only (tidak ada di weekday)
  async function confirmDisableWeekend() {
    setWeekendOffLoading(true)
    try {
      const weekdaySet    = new Set(DAYS.flatMap(d => schedules[d] ?? []))
      const weekendSubs   = [...new Set([...(schedules['SATURDAY'] ?? []), ...(schedules['SUNDAY'] ?? [])])]
      const weekendOnly   = weekendSubs.filter(s => !weekdaySet.has(s))

      const batch = writeBatch(db)
      batch.delete(doc(schedulesCol(uid, child.id), 'SATURDAY'))
      batch.delete(doc(schedulesCol(uid, child.id), 'SUNDAY'))

      // Hapus topik untuk mapel yang HANYA ada di weekend (tidak ada di weekday)
      if (weekendOnly.length > 0) {
        const topicsSnap = await getDocs(topicsCol(uid, child.id))
        topicsSnap.docs
          .filter(d => weekendOnly.includes(d.data().subject as string))
          .forEach(d => batch.delete(d.ref))
      }

      batch.update(childDoc(uid, child.id), { enableWeekend: false })
      await batch.commit()

      // Update local state
      setWeekendEnabled(false)
      setSchedules(prev => ({ ...prev, SATURDAY: [], SUNDAY: [] }))
      setSavedSchedules(prev => ({ ...prev, SATURDAY: [], SUNDAY: [] }))
      setCustomByDay(prev => ({ ...prev, SATURDAY: [], SUNDAY: [] }))
      if (WEEKEND_DAYS.includes(activeDay)) setActiveDay(DAYS[0])
      setShowWeekendOffDialog(false)
      onSaved('Belajar Weekend dimatikan')
    } catch (e: any) {
      setError(e.message ?? 'Gagal mematikan weekend')
    } finally {
      setWeekendOffLoading(false)
    }
  }

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-[#F3F4F6] rounded-xl animate-pulse" />)}</div>

  const isWeekendDay   = WEEKEND_DAYS.includes(activeDay)
  const daySubjects    = schedules[activeDay] ?? []
  const customSubs     = customByDay[activeDay] ?? []
  const allSubjects    = [...SUBJECTS, ...customSubs]

  const weekdaysValid  = DAYS.every(d => (schedules[d] ?? []).length >= 2)
  // Weekend valid kalau disabled, ATAU minimal 1 hari weekend ada mapelnya
  // Minggu/Sabtu kosong = hari itu tidak belajar (boleh)
  const weekendValid   = !weekendEnabled || WEEKEND_DAYS.some(d => (schedules[d] ?? []).length >= 1)
  const hasChanges     = ALL_DAYS.some(d => {
    const curr = [...(schedules[d] ?? [])].sort().join(',')
    const orig = [...(savedSchedules[d] ?? [])].sort().join(',')
    return curr !== orig
  })
  const canSave = hasChanges && weekdaysValid && weekendValid

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#737373]">Minimal 2 mapel per hari (Senin–Jumat)</p>

      {/* Toggle Belajar Weekend */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] rounded-xl border border-[#E8EAF0]">
        <div>
          <p className="text-[13px] font-semibold text-[#0A0A0A]">Belajar Weekend 🌟</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Aktifkan jadwal Sabtu & Minggu</p>
        </div>
        <button
          onClick={async () => {
            if (weekendEnabled) {
              // Turning OFF — tampilkan dialog konfirmasi
              setShowWeekendOffDialog(true)
            } else {
              // Turning ON — langsung simpan ke Firestore
              setWeekendEnabled(true)
              try {
                await updateDoc(childDoc(uid, child.id), { enableWeekend: true })
              } catch {
                setWeekendEnabled(false)
              }
            }
          }}
          className={`relative w-11 h-6 rounded-full overflow-hidden transition-colors ${weekendEnabled ? 'bg-[#0095F6]' : 'bg-[#D1D5DB]'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${weekendEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Weekday tabs */}
      <div className="flex gap-1.5">
        {DAYS.map(day => {
          const count  = schedules[day]?.length ?? 0
          const enough = count >= 2
          return (
            <button key={day} onClick={() => { setActiveDay(day); setShowInput(false); setCustomInput('') }}
              className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-colors ${
                activeDay === day ? 'bg-[#0095F6] border-[#0095F6] text-white'
                  : enough ? 'border-[#22C55E] text-[#15803D] bg-[#F0FDF4]'
                  : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}>
              {DAY_LABELS[day].slice(0,3)}{count > 0 && <span className="ml-1 opacity-80">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Weekend tabs — muncul kalau weekendEnabled */}
      {weekendEnabled && (
        <div className="flex gap-1.5">
          {WEEKEND_DAYS.map(day => {
            const count = schedules[day]?.length ?? 0
            return (
              <button key={day} onClick={() => { setActiveDay(day); setShowInput(false); setCustomInput('') }}
                className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-colors ${
                  activeDay === day ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                    : count > 0 ? 'border-[#7C3AED] text-[#7C3AED] bg-[#F5F3FF]'
                    : 'border-dashed border-[#C4B5FD] text-[#8B5CF6] hover:bg-[#F5F3FF]'
                }`}>
                {DAY_LABELS[day]}{count > 0 && <span className="ml-1 opacity-80">({count})</span>}
              </button>
            )
          })}
          <div className="flex-1 flex items-center justify-center text-[11px] text-[#9CA3AF]">
            Min 1 mapel per hari
          </div>
        </div>
      )}

      {/* Subject chips */}
      <div className="flex flex-wrap gap-2">
        {allSubjects.map(subject => (
          <button key={subject} onClick={() => toggle(subject)}
            className={`px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
              daySubjects.includes(subject)
                ? isWeekendDay
                  ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#7C3AED]'
                  : 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]'
                : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
            }`}>
            {SUBJECT_LABELS[subject] ?? subject}
          </button>
        ))}
        {!showInput ? (
          <button onClick={() => setShowInput(true)}
            className="px-3 py-1.5 rounded-lg border border-dashed border-[#0095F6] text-[#0095F6] text-[13px] font-semibold hover:bg-[#E0F2FE] transition-colors">
            + Tambah Mapel
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input autoFocus type="text" value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') { setShowInput(false); setCustomInput('') } }}
              placeholder="Nama mapel..." className="border border-[#0095F6] rounded-lg px-3 py-1.5 text-[13px] outline-none w-36" />
            <button onClick={addCustom} disabled={customInput.trim().length < 2}
              className="px-3 py-1.5 rounded-lg bg-[#0095F6] text-white text-[13px] font-semibold disabled:opacity-40">Tambah</button>
            <button onClick={() => { setShowInput(false); setCustomInput('') }} className="text-[#737373] text-[13px]">Batal</button>
          </div>
        )}
      </div>

      {!isWeekendDay && daySubjects.length > 0 && daySubjects.length < 2 && (
        <p className="text-[12px] text-red-500">{DAY_LABELS[activeDay]}: pilih minimal 2 mapel ({daySubjects.length}/2)</p>
      )}
      {weekendEnabled && !weekendValid && (
        <p className="text-[12px] text-red-500">Pilih minimal 1 mapel di Sabtu atau Minggu</p>
      )}

      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <SaveButton onClick={handleSave} loading={saving} disabled={!canSave} />

      {/* Remove warning dialog */}
      {removeWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-3xl text-center">⚠️</div>
            <div className="text-center">
              <h3 className="font-extrabold text-[17px]">Hapus Topik Mapel?</h3>
              <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">Topik mapel berikut akan dihapus:</p>
              <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                {removeWarning.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-[#FEE2E2] text-[#B91C1C] text-[12px] font-semibold rounded-lg">
                    {SUBJECT_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRemoveWarning(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-colors">Batal</button>
              <button onClick={() => doSave(removeWarning)} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-[13px] font-bold disabled:opacity-40 hover:bg-[#DC2626] transition-colors">
                {saving ? 'Menyimpan...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog konfirmasi matikan weekend */}
      {showWeekendOffDialog && (() => {
        const weekdaySet  = new Set(DAYS.flatMap(d => schedules[d] ?? []))
        const weekendSubs = [...new Set([...(schedules['SATURDAY'] ?? []), ...(schedules['SUNDAY'] ?? [])])]
        const weekendOnly = weekendSubs.filter(s => !weekdaySet.has(s))
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <div className="text-center">
                <p className="text-3xl mb-2">🌙</p>
                <h3 className="font-extrabold text-[17px]">Matikan Belajar Weekend?</h3>
                <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">
                  Jadwal Sabtu & Minggu akan dihapus.
                </p>
                {weekendOnly.length > 0 && (
                  <div className="mt-3 text-left bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
                    <p className="text-[12px] font-semibold text-[#B91C1C] mb-1.5">
                      Topik untuk mapel berikut juga dihapus (tidak ada di hari lain):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {weekendOnly.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-[#FEE2E2] text-[#B91C1C] text-[11px] font-semibold rounded-lg">
                          {SUBJECT_LABELS[s] ?? s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowWeekendOffDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-colors">
                  Batal
                </button>
                <button onClick={confirmDisableWeekend} disabled={weekendOffLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-[13px] font-bold disabled:opacity-40 hover:bg-[#DC2626] transition-colors">
                  {weekendOffLoading ? 'Memproses...' : 'Matikan Weekend'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Tab: Kelola Topik ────────────────────────────────────────────────────────

type TopicView = 'list' | 'add-ai' | 'add-manual'

function TabTopik({ child, uid, onSaved }: { child: Child; uid: string; onSaved: (msg: string) => void }) {
  const [topics,        setTopics]        = useState<Topic[]>([])
  const [allSubjects,   setAllSubjects]   = useState<string[]>([])
  const [loading,       setLoading]       = useState(true)
  const [activeSubject, setActiveSubject] = useState('')
  const [topicView,     setTopicView]     = useState<TopicView>('list')
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [manualInput,   setManualInput]   = useState('')
  const [addingManual,  setAddingManual]  = useState(false)
  const [aiLoading,     setAiLoading]     = useState(false)
  const [aiResults,     setAiResults]     = useState<string[]>([])
  const [aiSelected,    setAiSelected]    = useState<Set<string>>(new Set())
  const [aiSaving,      setAiSaving]      = useState(false)

  useEffect(() => { loadTopics() }, [uid, child.id])

  async function loadTopics() {
    setLoading(true)
    const [topicsSnap, schedulesSnap] = await Promise.all([
      getDocs(topicsCol(uid, child.id)),
      getDocs(schedulesCol(uid, child.id)),
    ])
    const list = topicsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Topic))
    setTopics(list)

    // Gabungkan subjects dari topik + dari semua jadwal (weekday + weekend)
    const topicSubjects    = list.map(t => t.subject)
    const scheduleSubjects = schedulesSnap.docs.flatMap(d => (d.data() as Schedule).subjects)
    const combined         = [...new Set([...topicSubjects, ...scheduleSubjects])]
    setAllSubjects(combined)

    const first = activeSubject || combined[0] || ''
    if (first) setActiveSubject(first)
    setLoading(false)
  }

  const subjects     = allSubjects
  const activeTopics = topics.filter(t => t.subject === activeSubject)

  async function deleteTopic(topicId: string) {
    setDeleting(topicId)
    try {
      await deleteDoc(doc(db, 'users', uid, 'children', child.id, 'topics', topicId))
      setTopics(prev => prev.filter(t => t.id !== topicId))
    } finally { setDeleting(null) }
  }

  async function addManualTopic() {
    const name = manualInput.trim()
    if (!name || !activeSubject) return
    setAddingManual(true)
    try {
      const ref = doc(topicsCol(uid, child.id))
      await setDoc(ref, {
        id: ref.id, subject: activeSubject, topicName: name, source: 'MANUAL', isDone: false, order: activeTopics.length,
      })
      setTopics(prev => [...prev, { id: ref.id, subject: activeSubject, topicName: name, source: 'MANUAL', isDone: false, order: activeTopics.length }])
      setManualInput('')
      onSaved('Topik berhasil ditambahkan')
    } finally { setAddingManual(false) }
  }

  async function generateFromAI() {
    setAiLoading(true); setAiResults([]); setAiSelected(new Set())
    try {
      const idToken = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/ai/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ kelas: child.kelas, subjects: [activeSubject] }),
      })
      if (res.ok) {
        const data: Record<string, string[]> = await res.json()
        const existing = new Set(activeTopics.map(t => t.topicName.toLowerCase()))
        const fresh = (data[activeSubject] ?? []).filter(t => !existing.has(t.toLowerCase()))
        setAiResults(fresh)
        setAiSelected(new Set(fresh))
      }
    } finally { setAiLoading(false) }
  }

  async function saveAITopics() {
    if (aiSelected.size === 0) return
    setAiSaving(true)
    try {
      const batch = writeBatch(db)
      let idx = 0
      aiResults.filter(t => aiSelected.has(t)).forEach(topicName => {
        const ref = doc(collection(db, 'users', uid, 'children', child.id, 'topics'))
        batch.set(ref, { id: ref.id, subject: activeSubject, topicName, source: 'AI', isDone: false, order: activeTopics.length + idx++ })
      })
      await batch.commit()
      setTopicView('list')
      await loadTopics()
      onSaved('Topik AI berhasil ditambahkan')
    } finally { setAiSaving(false) }
  }

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-[#F3F4F6] rounded-xl animate-pulse" />)}</div>

  if (topicView === 'add-manual') return (
    <div className="space-y-4">
      <button onClick={() => setTopicView('list')} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0095F6] hover:underline">
        ← Kembali
      </button>
      <p className="text-[13px] text-[#737373]">Tambah topik ke <span className="font-semibold text-[#0A0A0A]">{SUBJECT_LABELS[activeSubject] ?? activeSubject}</span></p>
      <div className="flex gap-2">
        <input autoFocus type="text" value={manualInput} onChange={e => setManualInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addManualTopic()}
          placeholder="Nama topik..." className="flex-1 border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[#0095F6] transition-colors" />
        <button onClick={addManualTopic} disabled={!manualInput.trim() || addingManual}
          className="px-4 py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-[#0074CC] transition-colors">
          {addingManual ? '...' : 'Tambah'}
        </button>
      </div>
    </div>
  )

  if (topicView === 'add-ai') return (
    <div className="space-y-4">
      <button onClick={() => setTopicView('list')} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0095F6] hover:underline">
        ← Kembali
      </button>
      <p className="text-[13px] text-[#737373]">Topik AI untuk <span className="font-semibold text-[#0A0A0A]">{SUBJECT_LABELS[activeSubject] ?? activeSubject}</span> kelas {child.kelas}</p>
      {aiLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-11 bg-[#F3F4F6] rounded-xl animate-pulse" />)}
          <p className="text-[12px] text-center text-[#737373]">Memuat dari AI...</p>
        </div>
      ) : aiResults.length === 0 ? (
        <p className="text-[13px] text-[#737373] text-center py-6">Tidak ada topik baru dari AI (semua sudah ada)</p>
      ) : (
        <>
          <div className="flex items-center justify-between pb-1 border-b border-[#DBDBDB]">
            <span className="text-[12px] text-[#737373]">{aiSelected.size} dari {aiResults.length} dipilih</span>
            <button onClick={() => setAiSelected(aiSelected.size === aiResults.length ? new Set() : new Set(aiResults))}
              className="text-[12px] font-semibold text-[#0095F6] hover:underline">
              {aiSelected.size === aiResults.length ? 'Hapus Semua' : 'Centang Semua'}
            </button>
          </div>
          <div className="space-y-2">
            {aiResults.map(t => (
              <label key={t} className="flex items-center gap-3 p-3 rounded-xl border border-[#DBDBDB] cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                <input type="checkbox" checked={aiSelected.has(t)}
                  onChange={() => { const n = new Set(aiSelected); n.has(t) ? n.delete(t) : n.add(t); setAiSelected(n) }}
                  className="w-4 h-4 accent-[#0095F6]" />
                <span className="text-[14px] font-medium">{t}</span>
              </label>
            ))}
          </div>
          <SaveButton onClick={saveAITopics} loading={aiSaving} label="Tambah Topik yang Dipilih" />
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {subjects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl">📚</p>
          <p className="text-[#737373] font-semibold mt-2">Belum ada topik</p>
        </div>
      ) : (
        <>
          {/* Banner warning — tampil dari awal, list semua mapel tanpa topik */}
          {(() => {
            const emptySubjects = subjects.filter(s => topics.filter(t => t.subject === s).length === 0)
            if (emptySubjects.length === 0) return null
            return (
              <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0">⚠️</span>
                  <div>
                    <p className="text-[13px] font-bold text-[#92400E]">
                      {emptySubjects.length} mapel belum punya topik
                    </p>
                    <p className="text-[12px] text-[#B45309] mt-0.5 leading-relaxed">
                      Anak tidak bisa mulai kuis untuk mapel-mapel ini. Tap untuk langsung tambah topik.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {emptySubjects.map(s => (
                    <button key={s} onClick={() => setActiveSubject(s)}
                      className="px-2.5 py-1 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg text-[12px] font-semibold text-[#92400E] hover:bg-[#FDE68A] transition-colors">
                      {SUBJECT_LABELS[s] ?? s} →
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Subject tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {subjects.map(subject => {
              const count  = topics.filter(t => t.subject === subject).length
              const empty  = count === 0
              const active = activeSubject === subject
              return (
                <button key={subject} onClick={() => setActiveSubject(subject)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                    active && !empty ? 'bg-[#0095F6] border-[#0095F6] text-white'
                    : active &&  empty ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                    : !active && empty ? 'border-[#FCD34D] text-[#B45309] bg-[#FFFBEB] hover:bg-[#FEF3C7]'
                    : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
                  }`}>
                  {SUBJECT_LABELS[subject] ?? subject}
                  {' '}<span className="opacity-80">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Topic list / empty state per subject */}
          {activeTopics.length === 0 ? (
            <div className="text-center py-6 text-[#9CA3AF]">
              <p className="text-2xl mb-1.5">📋</p>
              <p className="text-[13px] font-semibold">Belum ada topik untuk mapel ini</p>
              <p className="text-[12px] mt-0.5">Gunakan tombol di bawah untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTopics.map(topic => (
                <div key={topic.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-[#DBDBDB] rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{topic.topicName}</p>
                    <p className="text-[11px] text-[#A8A8A8] mt-0.5">
                      {topic.source === 'AI' ? 'Dari AI' : topic.source === 'MANUAL' ? 'Tulis manual' : 'Dari foto'}
                      {' · '}
                      {topic.isDone ? '✅ Sudah dikerjakan' : '⏳ Belum dikerjakan anak'}
                    </p>
                  </div>
                  <button onClick={() => deleteTopic(topic.id)} disabled={deleting === topic.id}
                    className="px-3 py-1 rounded-lg border border-[#FCA5A5] text-[#EF4444] text-[12px] font-semibold hover:bg-[#FEF2F2] disabled:opacity-40 shrink-0 transition-colors">
                    {deleting === topic.id ? '...' : 'Hapus'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div className="flex gap-2 pt-2">
        <button onClick={() => { setTopicView('add-ai'); generateFromAI() }} disabled={!activeSubject}
          className="flex-1 py-2.5 rounded-xl border border-[#0095F6] text-[#0095F6] text-[13px] font-semibold hover:bg-[#EFF6FF] disabled:opacity-40 transition-colors">
          🤖 Generate AI
        </button>
        <button onClick={() => setTopicView('add-manual')} disabled={!activeSubject}
          className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[14px] font-semibold hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors">
          ✏️ Tulis Manual
        </button>
      </div>
    </div>
  )
}

// ─── Tab: Kode Anak ───────────────────────────────────────────────────────────

function TabKode({ child }: { child: Child }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(child.childCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-[13px] text-[#737373] text-center">
        Berikan kode ini ke <span className="font-semibold text-[#0A0A0A]">{child.name}</span> untuk login di aplikasi Arahami
      </p>
      <div className="bg-[#E0F2FE] rounded-2xl px-10 py-7 text-center">
        <p className="text-[11px] font-bold text-[#737373] uppercase tracking-widest mb-2">Kode Anak</p>
        <p className="text-5xl font-extrabold text-[#0095F6] tracking-[0.2em]">{child.childCode}</p>
      </div>
      <button onClick={copy}
        className="w-full max-w-xs py-3 rounded-xl border-2 border-[#0095F6] text-[#0095F6] text-[14px] font-bold hover:bg-[#EFF6FF] transition-colors">
        {copied ? '✓ Tersalin!' : 'Salin Kode'}
      </button>
    </div>
  )
}

// ─── Tab: Setting Reward ──────────────────────────────────────────────────────

function TabReward({ child, uid, onSaved }: { child: Child; uid: string; onSaved: (msg: string) => void }) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set((child as any).enabledRewards ?? ALL_REWARD_KEYS))
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function toggle(key: string) {
    const next = new Set(enabled); next.has(key) ? next.delete(key) : next.add(key); setEnabled(next)
  }

  async function save() {
    setSaving(true); setError('')
    try {
      await updateDoc(childDoc(uid, child.id), { enabledRewards: [...enabled] })
      onSaved('Setting reward berhasil disimpan')
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#737373]">{enabled.size} dari {REWARD_PRESETS.length} aktif</p>
        <button onClick={() => setEnabled(enabled.size === REWARD_PRESETS.length ? new Set() : new Set(ALL_REWARD_KEYS))}
          className="text-[12px] font-semibold text-[#0095F6] hover:underline">
          {enabled.size === REWARD_PRESETS.length ? 'Nonaktifkan Semua' : 'Aktifkan Semua'}
        </button>
      </div>
      <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
        {REWARD_PRESETS.map(reward => (
          <button key={reward.key} onClick={() => toggle(reward.key)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA] transition-colors text-left ${!enabled.has(reward.key) ? 'opacity-40' : ''}`}>
            <span className="text-[22px] shrink-0">{reward.emoji}</span>
            <span className="flex-1 text-[14px] font-medium">{reward.label}</span>
            <div className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${enabled.has(reward.key) ? 'bg-[#0095F6]' : 'bg-[#D1D5DB]'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled.has(reward.key) ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
        ))}
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      <SaveButton onClick={save} loading={saving} />
    </div>
  )
}

// ─── Edit View (child selected — tabbed) ─────────────────────────────────────

function EditChildView({
  child, uid, onBack,
}: { child: Child; uid: string; onBack: () => void }) {
  const [activeTab,   setActiveTab]   = useState<EditTab>('profil')
  const [successMsg,  setSuccessMsg]  = useState('')

  function handleSaved(msg: string, switchToTab?: EditTab) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
    if (switchToTab) setActiveTab(switchToTab)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-xl border border-[#E8EAF0] hover:bg-[#F5F7FA] transition-colors shrink-0">
          <ArrowLeft size={16} className="text-[#374151]" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[18px]">
            {themeEmoji(child.theme)}
          </div>
          <div>
            <p className="font-extrabold text-[17px] leading-tight">{child.name}</p>
            <p className="text-[12px] text-[#9CA3AF]">Kelas {child.kelas}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 overflow-x-auto">
        {EDIT_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors px-2 ${
              activeTab === tab.key ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#737373]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Success banner */}
      {successMsg && <SuccessBanner message={successMsg} />}

      {/* Tab content */}
      <div>
        {activeTab === 'profil'  && <TabProfil  child={child} uid={uid} onSaved={handleSaved} />}
        {/* TabJadwal selalu mounted — state jadwal & weekend tidak hilang saat pindah tab */}
        <div style={{ display: activeTab === 'jadwal' ? 'block' : 'none' }}>
          <TabJadwal child={child} uid={uid} onSaved={handleSaved} />
        </div>
        {activeTab === 'topik'   && <TabTopik   child={child} uid={uid} onSaved={handleSaved} />}
        {activeTab === 'kode'    && <TabKode    child={child} />}
        {activeTab === 'reward'  && <TabReward  child={child} uid={uid} onSaved={handleSaved} />}
      </div>
    </div>
  )
}

// ─── Pilih Anak (shared — dipakai Edit Anak & Progress Belajar) ──────────────

function ChildPickerList({ title, onBack, onSelect }: {
  title: string; onBack: () => void; onSelect: (child: Child) => void
}) {
  const { children } = useChild()
  const router        = useRouter()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-xl border border-[#E8EAF0] hover:bg-[#F5F7FA] transition-colors"
        >
          <ArrowLeft size={16} className="text-[#374151]" />
        </button>
        <h2 className="font-extrabold text-[18px]">{title}</h2>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-3xl">👶</p>
          <p className="font-semibold text-[#737373]">Belum ada anak terdaftar</p>
          <button onClick={() => router.push('/onboarding')}
            className="px-6 py-2.5 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold hover:bg-[#0074CC] transition-colors">
            Daftar Anak Pertama
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
          {children.map(child => (
            <button key={child.id} onClick={() => onSelect(child)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA] transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[20px] shrink-0">
                {themeEmoji(child.theme)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px]">{child.name}</p>
                <p className="text-[12px] text-[#737373] mt-0.5">Kelas {child.kelas}</p>
              </div>
              <ChevronRight size={18} className="text-[#A8A8A8] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Progress Belajar — checklist materi yang udah diajarin di sekolah ───────

function ProgressBelajarView({ child, uid, onBack }: { child: Child; uid: string; onBack: () => void }) {
  const [topics,     setTopics]     = useState<Topic[]>([])
  const [loading,    setLoading]    = useState(true)
  const [pending,    setPending]    = useState<Record<string, boolean>>({})
  const [saving,     setSaving]     = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [validationMsg,   setValidationMsg]   = useState<string | null>(null)

  useEffect(() => { load() }, [uid, child.id])

  async function load() {
    setLoading(true)
    const snap = await getDocs(topicsCol(uid, child.id))
    setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Topic)))
    setPending({})
    setLoading(false)
  }

  // Toggle cuma ubah state lokal — belum nulis ke Firestore, biar aman dari
  // race condition kalau ortu klik-klik cepat. Ke-apply beneran pas "Simpan".
  // Kalau hasil akhirnya balik sama kayak nilai tersimpan, key-nya dihapus dari
  // pending — biar counter "N perubahan" nunjukin beda beneran, bukan jumlah klik.
  function toggle(topic: Topic) {
    const original = topic.isUnlocked ?? true
    const current  = pending[topic.id] ?? original
    const next     = !current

    // Validasi: jangan sampai 1 mapel jadi 0 topik ke-centang — anak bisa
    // jadi gak punya materi sama sekali buat kuis mapel itu.
    if (current && !next) {
      const checkedCount = topics
        .filter(t => t.subject === topic.subject)
        .filter(t => pending[t.id] ?? (t.isUnlocked ?? true))
        .length
      if (checkedCount <= 1) {
        setValidationMsg(`Minimal 1 topik ${SUBJECT_LABELS[topic.subject] ?? topic.subject} harus tetap dicentang, biar anak masih bisa kuis mapel ini.`)
        return
      }
    }

    setPending(prev => {
      const copy = { ...prev }
      if (next === original) delete copy[topic.id]
      else copy[topic.id] = next
      return copy
    })
  }

  function discard() {
    setPending({})
  }

  async function save() {
    setShowSaveConfirm(false)
    setSaving(true)
    try {
      const batch = writeBatch(db)
      Object.entries(pending).forEach(([topicId, value]) => {
        batch.update(doc(db, 'users', uid, 'children', child.id, 'topics', topicId), { isUnlocked: value })
      })
      await batch.commit()
      setTopics(prev => prev.map(t => t.id in pending ? { ...t, isUnlocked: pending[t.id] } : t))
      setPending({})
      setSuccessMsg('Progress berhasil disimpan')
      setTimeout(() => setSuccessMsg(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  const dirtyCount = Object.keys(pending).length
  const subjects   = [...new Set(topics.map(t => t.subject))]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-xl border border-[#E8EAF0] hover:bg-[#F5F7FA] transition-colors shrink-0">
          <ArrowLeft size={16} className="text-[#374151]" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[18px]">
            {themeEmoji(child.theme)}
          </div>
          <div>
            <p className="font-extrabold text-[17px] leading-tight">Progress Belajar</p>
            <p className="text-[12px] text-[#9CA3AF]">{child.name} · Kelas {child.kelas}</p>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-[#737373] leading-relaxed">
        Centang materi yang udah diajarin gurunya di sekolah — anak cuma bisa latihan dari materi yang dicentang.
      </p>

      {successMsg && <SuccessBanner message={successMsg} />}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl">📚</p>
          <p className="text-[#737373] font-semibold mt-2">Belum ada topik</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Tambahkan topik dulu di Edit Anak → Topik</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {subjects.map(subject => {
              const subjectTopics = topics.filter(t => t.subject === subject).sort((a, b) => a.order - b.order)
              const checkedCount  = subjectTopics.filter(t => pending[t.id] ?? (t.isUnlocked ?? true)).length
              return (
                <div key={subject} className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13.5px] font-bold">{SUBJECT_LABELS[subject] ?? subject}</p>
                    <span className="text-[11px] font-bold text-[#0095F6] bg-white border border-[#BFDBFE] rounded-full px-2.5 py-1">
                      {checkedCount} dari {subjectTopics.length}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#737373] mb-2">Anak cuma bisa latihan dari materi yang dicentang</p>
                  <div>
                    {subjectTopics.map(topic => {
                      const checked = pending[topic.id] ?? (topic.isUnlocked ?? true)
                      return (
                        <label key={topic.id} className="flex items-center gap-2.5 py-2 px-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(topic)}
                            className="w-[18px] h-[18px] rounded-md accent-[#0095F6] cursor-pointer"
                          />
                          <span className={`text-[13.5px] font-semibold ${checked ? 'text-[#0A0A0A]' : 'text-[#A8A8A8]'}`}>
                            {topic.topicName}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={discard} disabled={saving || dirtyCount === 0}
              className="flex-1 py-3 rounded-xl border border-[#DBDBDB] text-[#737373] text-[14px] font-semibold hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors">
              Batal
            </button>
            <div className="flex-1">
              <SaveButton
                onClick={() => setShowSaveConfirm(true)}
                loading={saving}
                disabled={dirtyCount === 0}
                label={dirtyCount > 0 ? `Simpan Perubahan (${dirtyCount})` : 'Simpan Perubahan'}
              />
            </div>
          </div>

          {showSaveConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <div className="text-3xl text-center">📍</div>
                <div className="text-center">
                  <h3 className="font-extrabold text-[17px]">Simpan Progress Belajar?</h3>
                  <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">
                    {dirtyCount} perubahan bakal langsung berlaku ke {child.name} — topik yang dicentang jadi bisa dikerjain anak, yang gak dicentang bakal disembunyikan dari pilihan kuis.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSaveConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-colors">
                    Batal
                  </button>
                  <button onClick={save}
                    className="flex-1 py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-bold hover:bg-[#0074CC] transition-colors">
                    Ya, Simpan
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {validationMsg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-3xl text-center">⚠️</div>
            <div className="text-center">
              <h3 className="font-extrabold text-[17px]">Gak Bisa Dihapus</h3>
              <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">{validationMsg}</p>
            </div>
            <button onClick={() => setValidationMsg(null)}
              className="w-full py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-bold hover:bg-[#0074CC] transition-colors">
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PengaturanView = 'menu' | 'child-list' | 'edit' | 'progress-child-list' | 'progress'

export default function PengaturanPage() {
  const { user }              = useAuthContext()
  const { children }          = useChild()
  const router                = useRouter()
  const [view,          setView]          = useState<PengaturanView>('menu')
  const [editingChild,  setEditingChild]  = useState<Child | null>(null)
  const [progressChild, setProgressChild] = useState<Child | null>(null)

  // Sync editingChild/progressChild dengan data live dari Firestore (handle update enableWeekend dll)
  const liveEditingChild = editingChild
    ? (children.find(c => c.id === editingChild.id) ?? editingChild)
    : null
  const liveProgressChild = progressChild
    ? (children.find(c => c.id === progressChild.id) ?? progressChild)
    : null

  if (!user) return (
    <>
      <DashboardHeader title="Pengaturan" />
      <div className="p-6 text-center text-[#737373]">Loading...</div>
    </>
  )

  return (
    <>
      <DashboardHeader title="Pengaturan" />
      <div className="p-6 max-w-2xl mx-auto">

        {/* View: Edit anak — tabbed */}
        {view === 'edit' && liveEditingChild && (
          <EditChildView
            child={liveEditingChild}
            uid={user.uid}
            onBack={() => { setView('child-list'); setEditingChild(null) }}
          />
        )}

        {/* View: Pilih anak yang mau diedit */}
        {view === 'child-list' && (
          <ChildPickerList
            title="Pilih Anak"
            onBack={() => setView('menu')}
            onSelect={child => { setEditingChild(child); setView('edit') }}
          />
        )}

        {/* View: Progress Belajar — checklist per anak */}
        {view === 'progress' && liveProgressChild && (
          <ProgressBelajarView
            child={liveProgressChild}
            uid={user.uid}
            onBack={() => { setView('progress-child-list'); setProgressChild(null) }}
          />
        )}

        {/* View: Pilih anak buat Progress Belajar */}
        {view === 'progress-child-list' && (
          <ChildPickerList
            title="Pilih Anak"
            onBack={() => setView('menu')}
            onSelect={child => { setProgressChild(child); setView('progress') }}
          />
        )}

        {/* View: Menu utama */}
        {view === 'menu' && (
          <div className="space-y-5">
            <div>
              <h1 className="font-extrabold text-[22px]">Pengaturan</h1>
              <p className="text-[13px] text-[#737373] mt-0.5">Kelola profil dan preferensi</p>
            </div>

            <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
              <button
                onClick={() => setView('child-list')}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors text-left"
              >
                <span className="text-[24px] shrink-0">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px]">Edit Anak</p>
                  <p className="text-[12px] text-[#737373] mt-0.5">Profil, jadwal, topik, kode, reward</p>
                </div>
                <ChevronRight size={18} className="text-[#A8A8A8] shrink-0" />
              </button>
              <button
                onClick={() => setView('progress-child-list')}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors text-left"
              >
                <span className="text-[24px] shrink-0">🎯</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px]">Progress Belajar</p>
                  <p className="text-[12px] text-[#737373] mt-0.5">Sesuaikan materi yang udah diajarin di sekolah</p>
                </div>
                <ChevronRight size={18} className="text-[#A8A8A8] shrink-0" />
              </button>
              <button
                onClick={() => router.push('/onboarding')}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors text-left"
              >
                <span className="text-[24px] shrink-0">➕</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px]">Tambah Anak</p>
                  <p className="text-[12px] text-[#737373] mt-0.5">Daftarkan anak kedua atau ketiga</p>
                </div>
                <ChevronRight size={18} className="text-[#A8A8A8] shrink-0" />
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
