'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, collection, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { childCodeDoc } from '@/lib/firebase/firestore-paths'
import { DAYS, getTopics, SUBJECT_LABELS } from '@/lib/curriculum'
import { StepProfile }     from '@/components/onboarding/StepProfile'
import { StepSchedule }    from '@/components/onboarding/StepSchedule'
import { StepTopicSource } from '@/components/onboarding/StepTopicSource'
import { StepTopics }      from '@/components/onboarding/StepTopics'
import { StepConfirm }     from '@/components/onboarding/StepConfirm'
import { StepDone }        from '@/components/onboarding/StepDone'
import { LoadingDialog, LoadingStep, TopicCount } from '@/components/onboarding/LoadingDialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingData = {
  childName:   string
  childGrade:  number
  childGender: string
  childTheme:  string
  schedules:           Record<string, string[]>
  customSubjectsByDay: Record<string, string[]>
  topicSource:       string
  photosBySubject:   Record<string, Array<{ imageBase64: string; mimeType: string }>>
  confirmedSubjects: string[]
  topics:                    Record<string, { name: string; selected: boolean }[]>
  manualTopicInputsBySubject: Record<string, string[]>
  childCode: string
  childId:   string
}

const INITIAL: OnboardingData = {
  childName: '', childGrade: 1, childGender: '', childTheme: '',
  schedules:           Object.fromEntries(DAYS.map(d => [d, []])),
  customSubjectsByDay: Object.fromEntries(DAYS.map(d => [d, []])),
  topicSource:       '',
  photosBySubject:   {},
  confirmedSubjects: [],
  topics:                    {},
  manualTopicInputsBySubject: {},
  childCode: '', childId: '',
}

type LoadingPhase = 'idle' | 'loading' | 'success' | 'error'

interface LoadingState {
  phase:        LoadingPhase
  title:        string
  description:  string
  steps:        LoadingStep[]
  progress:     number
  currentLabel: string
  topicCounts:  TopicCount[]
  totalTopics:  number
  errorMessage: string
  errorStopped: string
  errorProgress: number
}

const IDLE_LOADING: LoadingState = {
  phase: 'idle', title: '', description: '', steps: [],
  progress: 0, currentLabel: '',
  topicCounts: [], totalTopics: 0,
  errorMessage: '', errorStopped: '', errorProgress: 0,
}

const TOTAL_STEPS = 6

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const { user }        = useAuthContext()
  const router          = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [showReuseDialog, setShowReuseDialog] = useState(false)
  const [ls, setLs]                     = useState<LoadingState>(IDLE_LOADING)

  function update(patch: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...patch }))
  }

  function patchLs(patch: Partial<LoadingState>) {
    setLs(prev => ({ ...prev, ...patch }))
  }

  function jumpTo(s: number) { setStep(s) }
  function prev() { setStep(s => Math.max(s - 1, 1)) }

  // ── Navigation ─────────────────────────────────────────────────────────

  async function next() {
    if (step === 3) {
      const allSubjects = [...new Set(Object.values(data.schedules).flat())]

      if (data.topicSource === 'PHOTO') {
        const hasAllTopics = allSubjects.every(s => s in data.topics && data.topics[s].length > 0)
        if (hasAllTopics) {
          setShowReuseDialog(true)
          return
        }
        await generateTopicsFromPhotos(allSubjects)
        return
      }

      // AI path — only call if new subjects
      const newSubjects = allSubjects.filter(s => !(s in data.topics))
      if (newSubjects.length > 0) {
        await generateTopicsFromAI(allSubjects)
        return
      }

      prepareTopics(allSubjects)
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  // ── AI: Kurikulum Merdeka ───────────────────────────────────────────────

  async function generateTopicsFromAI(allSubjects: string[]) {
    setError(null)
    const n       = allSubjects.length
    const estSecs = Math.max(10, n * 4)

    const initSteps: LoadingStep[] = [
      { label: `Membaca kurikulum kelas ${data.childGrade}`, status: 'active', detail: 'Sedang berjalan...' },
      { label: 'Menyusun daftar topik', status: 'pending' },
      { label: 'Finalisasi', status: 'pending' },
    ]
    setLs({
      phase: 'loading',
      title: 'Menyusun Topik dari Kurikulum Merdeka',
      description: `Kelas ${data.childGrade} SD · ${n} mapel · Perkiraan ${estSecs} detik. Anda bisa menunggu di halaman ini.`,
      steps: initSteps, progress: 15,
      currentLabel: 'Membaca kurikulum...',
      topicCounts: [], totalTopics: 0,
      errorMessage: '', errorStopped: '', errorProgress: 0,
    })

    // Step 1 → done after brief moment
    await new Promise(r => setTimeout(r, 600))
    patchLs({
      steps: [
        { label: `Membaca kurikulum kelas ${data.childGrade}`, status: 'done', detail: 'Selesai' },
        { label: 'Menyusun daftar topik', status: 'active', detail: 'Sedang berjalan...' },
        { label: 'Finalisasi', status: 'pending' },
      ],
      progress: 40, currentLabel: 'Menyusun daftar topik...',
    })

    try {
      const res = await fetch('/api/ai/generate-topics', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': 'arahami-secret-2026' },
        body: JSON.stringify({ kelas: data.childGrade, subjects: allSubjects }),
      })
      if (!res.ok) throw new Error('Gagal mendapatkan topik dari AI')

      const aiTopics: Record<string, string[]> = await res.json()

      patchLs({
        steps: [
          { label: `Membaca kurikulum kelas ${data.childGrade}`, status: 'done', detail: 'Selesai' },
          { label: 'Menyusun daftar topik', status: 'done', detail: 'Selesai' },
          { label: 'Finalisasi', status: 'active', detail: 'Sedang berjalan...' },
        ],
        progress: 88, currentLabel: 'Finalisasi...',
      })

      const updatedTopics = { ...data.topics }
      const updatedManual = { ...data.manualTopicInputsBySubject }
      Object.keys(updatedTopics).forEach(s => { if (!allSubjects.includes(s)) delete updatedTopics[s] })
      allSubjects.forEach(subject => {
        if (!(subject in updatedTopics)) {
          const aiList = aiTopics[subject]
          if (aiList?.length) {
            updatedTopics[subject] = aiList.map(name => ({ name, selected: false }))
          } else {
            const fallback = getTopics(data.childGrade, subject)
            updatedTopics[subject] = fallback.map(name => ({ name, selected: false }))
            if (fallback.length === 0) updatedManual[subject] = ['']
          }
        }
      })

      update({ topics: updatedTopics, manualTopicInputsBySubject: updatedManual })

      const counts: TopicCount[] = allSubjects.map(s => ({
        subjectLabel: SUBJECT_LABELS[s] ?? s,
        count: updatedTopics[s]?.length ?? 0,
      }))
      const total = counts.reduce((sum, t) => sum + t.count, 0)

      await new Promise(r => setTimeout(r, 300))
      patchLs({ phase: 'success', progress: 100, topicCounts: counts, totalTopics: total })
    } catch (e: any) {
      setError(`Gagal generate topik: ${e.message}. Menggunakan kurikulum bawaan.`)
      prepareTopics(allSubjects)
      setLs(IDLE_LOADING)
      setStep(s => Math.min(s + 1, TOTAL_STEPS))
    }
  }

  // ── PHOTO: Foto Buku ────────────────────────────────────────────────────

  async function generateTopicsFromPhotos(allSubjects: string[]) {
    setError(null)
    const total   = allSubjects.length
    const estSecs = Math.max(10, total * 12)

    const initSteps: LoadingStep[] = allSubjects.map(s => ({
      label: SUBJECT_LABELS[s] ?? s, status: 'pending',
    }))
    setLs({
      phase: 'loading',
      title: 'Menganalisis Foto Buku',
      description: `${total} mapel · Perkiraan ~${estSecs} detik. Anda bisa menunggu di halaman ini.`,
      steps: initSteps, progress: 0, currentLabel: '',
      topicCounts: [], totalTopics: 0,
      errorMessage: '', errorStopped: '', errorProgress: 0,
    })

    const updatedTopics: typeof data.topics = {}
    const updatedManual = { ...data.manualTopicInputsBySubject }
    const successCounts: TopicCount[] = []
    let failedSubject = ''

    for (let i = 0; i < allSubjects.length; i++) {
      const subject   = allSubjects[i]
      const label     = SUBJECT_LABELS[subject] ?? subject
      const startTime = Date.now()

      // Mark current as active — progress min 5% agar tidak terlihat stuck
      patchLs({
        steps: allSubjects.map((s, idx) => ({
          label: SUBJECT_LABELS[s] ?? s,
          status: idx < i ? 'done' : idx === i ? 'active' : 'pending',
          detail: idx < i && successCounts[idx]
            ? `${successCounts[idx].count} topik · ${0}d` : undefined,
        })),
        progress: Math.max(5, Math.round((i / total) * 90)),
        currentLabel: `Menganalisis foto ${label}...`,
      })

      const photos = data.photosBySubject[subject] ?? []
      let topicsForSubject: string[] = []

      try {
        const res = await fetch('/api/ai/analyze-photo', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': 'arahami-secret-2026' },
          body: JSON.stringify({ images: photos, subject, kelas: data.childGrade }),
        })
        if (res.ok) {
          const parsed: string[] = await res.json()
          if (parsed.length > 0) topicsForSubject = parsed
        }
      } catch { /* fallback below */ }

      const elapsed = Math.round((Date.now() - startTime) / 1000)

      if (topicsForSubject.length > 0) {
        updatedTopics[subject] = topicsForSubject.map(name => ({ name, selected: false }))
        successCounts.push({ subjectLabel: label, count: topicsForSubject.length })
      } else {
        const fallback = getTopics(data.childGrade, subject)
        updatedTopics[subject] = fallback.map(name => ({ name, selected: false }))
        if (fallback.length === 0) { updatedManual[subject] = [''] }
        successCounts.push({ subjectLabel: label, count: fallback.length })
        if (photos.length > 0 && topicsForSubject.length === 0 && !failedSubject) {
          failedSubject = label
        }
      }

      // Mark as done with detail + update progress ke post-step
      setLs(prev => ({
        ...prev,
        progress: Math.round(((i + 1) / total) * 90),
        steps: allSubjects.map((s, idx) => {
          if (idx < i) return prev.steps[idx]
          if (idx === i) return {
            label: SUBJECT_LABELS[s] ?? s, status: 'done' as const,
            detail: `${successCounts[i]?.count ?? 0} topik · ${elapsed}d`,
          }
          return { label: SUBJECT_LABELS[s] ?? s, status: 'pending' as const }
        }),
      }))
    }

    update({ topics: updatedTopics, manualTopicInputsBySubject: updatedManual })

    const totalTopics = successCounts.reduce((sum, t) => sum + t.count, 0)
    await new Promise(r => setTimeout(r, 300))

    if (failedSubject) {
      patchLs({
        phase: 'error',
        errorMessage: `${successCounts.filter(t => t.count > 0).length} dari ${total} mapel berhasil dianalisis. ${failedSubject} menggunakan topik kurikulum bawaan.`,
        errorStopped: `Gagal analisis OCR: ${failedSubject}`,
        errorProgress: Math.round(((total - 1) / total) * 100),
        topicCounts: successCounts,
        totalTopics,
        progress: 100,
      })
    } else {
      patchLs({ phase: 'success', progress: 100, topicCounts: successCounts, totalTopics })
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function prepareTopics(allSubjects: string[]) {
    const updatedTopics = { ...data.topics }
    const updatedManual = { ...data.manualTopicInputsBySubject }
    Object.keys(updatedTopics).forEach(s => { if (!allSubjects.includes(s)) delete updatedTopics[s] })
    Object.keys(updatedManual).forEach(s => { if (!allSubjects.includes(s)) delete updatedManual[s] })
    allSubjects.forEach(subject => {
      if (!(subject in updatedTopics)) {
        const list = getTopics(data.childGrade, subject)
        updatedTopics[subject] = list.map(name => ({ name, selected: false }))
        if (list.length === 0) updatedManual[subject] = ['']
      }
    })
    update({ topics: updatedTopics, manualTopicInputsBySubject: updatedManual })
  }

  function onLoadingContinue() {
    setLs(IDLE_LOADING)
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function onLoadingRetry() {
    const allSubjects = [...new Set(Object.values(data.schedules).flat())]
    setLs(IDLE_LOADING)
    // Re-run photo generation (clear existing topics so it regenerates)
    update({ topics: {} })
    setTimeout(() => generateTopicsFromPhotos(allSubjects), 100)
  }

  function onLoadingCancel() {
    setLs(IDLE_LOADING)
    // Stay at step 3
  }

  // ── Dev preview helpers (dev-only) ────────────────────────────────────────
  function previewLoading() {
    setLs({
      phase: 'loading',
      title: 'Menganalisis Foto Buku',
      description: '7 mapel · Perkiraan ~84 detik. Anda bisa menunggu di halaman ini.',
      steps: [
        { label: 'Matematika',          status: 'done',    detail: '9 topik · 8d' },
        { label: 'Pend. Pancasila',     status: 'done',    detail: '7 topik · 11d' },
        { label: 'Bahasa Indonesia',    status: 'active',  detail: 'Sedang berjalan...' },
        { label: 'IPA',                 status: 'pending' },
        { label: 'IPS',                 status: 'pending' },
        { label: 'Bahasa Inggris',      status: 'pending' },
        { label: 'Agama',               status: 'pending' },
      ],
      progress: 35, currentLabel: 'Menganalisis foto Bahasa Indonesia...',
      topicCounts: [], totalTopics: 0,
      errorMessage: '', errorStopped: '', errorProgress: 0,
    })
  }

  function previewSuccess() {
    setLs({
      phase: 'success',
      title: '', description: '', steps: [], progress: 100, currentLabel: '',
      topicCounts: [
        { subjectLabel: 'Matematika',       count: 9  },
        { subjectLabel: 'Pend. Pancasila',  count: 8  },
        { subjectLabel: 'Bahasa Indonesia', count: 11 },
      ],
      totalTopics: 28,
      errorMessage: '', errorStopped: '', errorProgress: 0,
    })
  }

  function previewError() {
    setLs({
      phase: 'error',
      title: '', description: '', steps: [], progress: 0, currentLabel: '',
      topicCounts: [], totalTopics: 0,
      errorMessage: '9 topik berhasil dari 2 mapel. Bahasa Indonesia gagal dianalisis, menggunakan kurikulum bawaan.',
      errorStopped: 'Berhenti di Bahasa Indonesia',
      errorProgress: 67,
    })
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function save() {
    if (!user) return
    setLoading(true); setError(null)
    try {
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
        name: data.childName.trim(), kelas: data.childGrade,
        gender: data.childGender, theme: data.childTheme,
        childCode: code, customSubjects: allCustomSubjects,
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

  // ── canNext ──────────────────────────────────────────────────────────────

  const canNext = (() => {
    if (step === 1) return !!(data.childName.trim() && data.childGender && data.childTheme)
    if (step === 2) return DAYS.every(d => data.schedules[d].length >= 2)
    if (step === 3) {
      if (!data.topicSource) return false
      if (data.topicSource === 'PHOTO') {
        const allSubjects = [...new Set(Object.values(data.schedules).flat())]
        return allSubjects.length > 0 && allSubjects.every(s => data.confirmedSubjects.includes(s))
      }
      return true
    }
    if (step === 4) {
      const allSubjects = [...new Set(Object.values(data.schedules).flat())]
      return allSubjects.every(s => {
        const isCustom = s in data.manualTopicInputsBySubject
        if (isCustom) return (data.topics[s]?.length ?? 0) > 0 && data.topics[s].some(t => t.selected)
        return data.topics[s]?.some(t => t.selected) ?? false
      })
    }
    return true
  })()

  const isLoadingActive = ls.phase !== 'idle'
  const isSaving        = loading  // alias supaya lebih jelas di JSX

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Loading / Success / Error dialog */}
      {isLoadingActive && (
        <LoadingDialog
          phase={ls.phase as 'loading' | 'success' | 'error'}
          title={ls.title}
          description={ls.description}
          steps={ls.steps}
          progress={ls.progress}
          currentLabel={ls.currentLabel}
          topicCounts={ls.topicCounts}
          totalTopics={ls.totalTopics}
          kelas={data.childGrade}
          errorMessage={ls.errorMessage}
          errorStopped={ls.errorStopped}
          errorProgress={ls.errorProgress}
          onCancel={ls.phase === 'loading' ? onLoadingCancel : undefined}
          onContinue={onLoadingContinue}
          onRetry={ls.phase === 'error' ? onLoadingRetry : undefined}
        />
      )}

      {/* Save loading overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#BFDBFE] border-t-[#0095F6] animate-spin mx-auto" />
            <div>
              <p className="font-extrabold text-[16px]">Menyimpan Data Anak</p>
              <p className="text-[13px] text-[#737373] mt-1">Sebentar ya, lagi diproses...</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog — reuse existing photo topics */}
      {showReuseDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-3xl text-center">📷</div>
            <div className="text-center">
              <h3 className="font-extrabold text-[17px]">Foto Sudah Dianalisis</h3>
              <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">
                Topik dari foto sebelumnya sudah tersimpan. Mau pakai yang ada atau ganti foto dan analisis ulang?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReuseDialog(false)
                  // Clear topics so user can re-generate after editing
                  update({ topics: {}, confirmedSubjects: [] })
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-colors"
              >
                🔄 Ganti Foto
              </button>
              <button
                onClick={() => {
                  setShowReuseDialog(false)
                  setStep(s => Math.min(s + 1, TOTAL_STEPS))
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-bold hover:bg-[#0074CC] transition-colors"
              >
                Lanjut Pakai Ini →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev-only preview buttons */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-1.5">
          <p className="text-[10px] text-center text-gray-400 font-mono">DEV PREVIEW</p>
          <button onClick={previewLoading} className="px-3 py-1.5 bg-blue-600 text-white text-[11px] rounded-lg font-mono">Loading</button>
          <button onClick={previewSuccess} className="px-3 py-1.5 bg-green-600 text-white text-[11px] rounded-lg font-mono">Success</button>
          <button onClick={previewError}   className="px-3 py-1.5 bg-red-600   text-white text-[11px] rounded-lg font-mono">Error</button>
          <button onClick={() => setLs(IDLE_LOADING)} className="px-3 py-1.5 bg-gray-600 text-white text-[11px] rounded-lg font-mono">Close</button>
        </div>
      )}

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
            disabled={step === 1 || isLoadingActive}
            className="px-5 py-2.5 rounded-xl border border-[#DBDBDB] text-[14px] font-semibold disabled:opacity-40 hover:bg-[#F5F5F5] transition-colors"
          >
            Kembali
          </button>
          {step < 5 ? (
            <button
              onClick={next}
              disabled={!canNext || isLoadingActive}
              className="px-6 py-2.5 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#0074CC] transition-colors"
            >
              {isLoadingActive ? 'Memproses...' : 'Lanjut →'}
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
