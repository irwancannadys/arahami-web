'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, collection, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { childCodeDoc } from '@/lib/firebase/firestore-paths'
import { DAYS, getTopics } from '@/lib/curriculum'
import { StepProfile }     from '@/components/onboarding/StepProfile'
import { StepSchedule }    from '@/components/onboarding/StepSchedule'
import { StepTopicSource } from '@/components/onboarding/StepTopicSource'
import { StepTopics }      from '@/components/onboarding/StepTopics'
import { StepConfirm }     from '@/components/onboarding/StepConfirm'
import { StepDone }        from '@/components/onboarding/StepDone'

export type OnboardingData = {
  // Step 1
  childName:   string
  childGrade:  number
  childGender: string
  childTheme:  string
  // Step 2
  schedules:           Record<string, string[]>
  customSubjectsByDay: Record<string, string[]>
  // Step 3
  topicSource: string
  // Step 4
  topics:                   Record<string, { name: string; selected: boolean }[]>
  manualTopicInputsBySubject: Record<string, string[]>  // untuk custom subjects
  // Step 6 result
  childCode: string
  childId:   string
}

const INITIAL: OnboardingData = {
  childName: '', childGrade: 1, childGender: '', childTheme: '',
  schedules:           Object.fromEntries(DAYS.map(d => [d, []])),
  customSubjectsByDay: Object.fromEntries(DAYS.map(d => [d, []])),
  topicSource: '',
  topics:                    {},
  manualTopicInputsBySubject: {},
  childCode: '', childId: '',
}

const TOTAL_STEPS = 6

export default function OnboardingPage() {
  const { user }        = useAuthContext()
  const router          = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function update(patch: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...patch }))
  }

  function jumpTo(s: number) { setStep(s) }

  function next() {
    if (step === 3) {
      const allSubjects = [...new Set(Object.values(data.schedules).flat())]

      // Preserve state yang sudah ada — hanya init/drop subject yang berubah
      const updatedTopics = { ...data.topics }
      const updatedManual = { ...data.manualTopicInputsBySubject }

      // Drop subjects yang sudah tidak ada di jadwal
      Object.keys(updatedTopics).forEach(s => {
        if (!allSubjects.includes(s)) delete updatedTopics[s]
      })
      Object.keys(updatedManual).forEach(s => {
        if (!allSubjects.includes(s)) delete updatedManual[s]
      })

      // Init hanya subjects yang BARU (belum pernah diinit sebelumnya)
      allSubjects.forEach(subject => {
        if (!(subject in updatedTopics)) {
          const list = getTopics(data.childGrade, subject)
          updatedTopics[subject] = list.map(name => ({ name, selected: false }))
          if (list.length === 0) updatedManual[subject] = ['']
        }
      })

      update({ topics: updatedTopics, manualTopicInputsBySubject: updatedManual })
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function prev() { setStep(s => Math.max(s - 1, 1)) }

  async function save() {
    if (!user) return
    setLoading(true); setError(null)
    try {
      // Generate unique 4-digit code
      let code = ''
      for (let i = 0; i < 20; i++) {
        const candidate = String(Math.floor(1000 + Math.random() * 9000))
        const { getDoc } = await import('firebase/firestore')
        const snap = await getDoc(childCodeDoc(candidate))
        if (!snap.exists()) { code = candidate; break }
      }
      if (!code) throw new Error('Gagal generate kode unik')

      const batch             = writeBatch(db)
      const allCustomSubjects = [...new Set(Object.values(data.customSubjectsByDay).flat())]

      const childRef = doc(collection(db, 'users', user.uid, 'children'))
      batch.set(childRef, {
        id: childRef.id, parentId: user.uid,
        name:           data.childName.trim(),
        kelas:          data.childGrade,
        gender:         data.childGender,
        theme:          data.childTheme,
        childCode:      code,
        customSubjects: allCustomSubjects,
        xp: 0, level: 1, streak: 0, lastActiveDate: '',
        createdAt: new Date(),
      })

      DAYS.forEach(day => {
        if (data.schedules[day].length > 0) {
          const sRef = doc(collection(db, 'users', user.uid, 'children', childRef.id, 'schedules'), day)
          batch.set(sRef, { id: day, day, subjects: data.schedules[day] })
        }
      })

      Object.entries(data.topics).forEach(([subject, list]) => {
        list.filter(t => t.selected).forEach((t, idx) => {
          const tRef = doc(collection(db, 'users', user.uid, 'children', childRef.id, 'topics'))
          batch.set(tRef, {
            id: tRef.id, subject, topicName: t.name,
            source: data.topicSource, isDone: false, order: idx,
          })
        })
      })

      batch.set(childCodeDoc(code), { uid: user.uid, childId: childRef.id })

      await batch.commit()
      update({ childCode: code, childId: childRef.id })
      setStep(6)
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const canNext = (() => {
    if (step === 1) return !!(data.childName.trim() && data.childGender && data.childTheme)
    if (step === 2) return DAYS.every(d => data.schedules[d].length >= 2)
    if (step === 3) return !!data.topicSource
    if (step === 4) {
      const allSubjects = [...new Set(Object.values(data.schedules).flat())]
      return allSubjects.every(s => {
        const isCustom = s in data.manualTopicInputsBySubject
        if (isCustom) {
          // Custom subject valid kalau sudah ada topik yang dikonfirmasi dan dipilih
          return (data.topics[s]?.length ?? 0) > 0 && data.topics[s].some(t => t.selected)
        }
        return data.topics[s]?.some(t => t.selected) ?? false
      })
    }
    return true
  })()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🎒</span>
        <div>
          <h1 className="font-extrabold text-xl">Setup Profil Anak</h1>
          <p className="text-[13px] text-[#737373]">Langkah {step} dari {TOTAL_STEPS}</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-[#0095F6]' : 'bg-[#DBDBDB]'}`} />
        ))}
      </div>

      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6">
        {step === 1 && <StepProfile     data={data} onChange={update} />}
        {step === 2 && <StepSchedule    data={data} onChange={update} />}
        {step === 3 && <StepTopicSource data={data} onChange={update} />}
        {step === 4 && <StepTopics      data={data} onChange={update} />}
        {step === 5 && <StepConfirm     data={data} onJumpTo={jumpTo} />}
        {step === 6 && <StepDone code={data.childCode} onGoToDashboard={() => router.push('/beranda')} />}
      </div>

      {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}

      {step < 6 && (
        <div className="flex justify-between mt-6">
          <button
            onClick={prev}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-xl border border-[#DBDBDB] text-[14px] font-semibold disabled:opacity-40 hover:bg-[#F5F5F5] transition-colors"
          >
            Kembali
          </button>
          {step < 5 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className="px-6 py-2.5 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
            >
              Lanjut →
            </button>
          ) : (
            <button
              onClick={save}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Selesai ✓'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
