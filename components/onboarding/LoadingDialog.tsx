'use client'

import { useEffect, useState } from 'react'

export interface LoadingStep {
  label:   string
  status:  'done' | 'active' | 'pending'
  detail?: string
}

export interface TopicCount {
  subjectLabel: string
  count:        number
}

interface Props {
  phase: 'loading' | 'success' | 'error'
  // ── loading ──
  title?:        string
  description?:  string
  steps?:        LoadingStep[]
  progress?:     number
  currentLabel?: string
  // ── success ──
  topicCounts?: TopicCount[]
  totalTopics?: number
  kelas?:       number
  // ── error ──
  errorMessage?:  string
  errorStopped?:  string
  errorProgress?: number
  // ── actions ──
  onCancel?:   () => void
  onContinue?: () => void
  onRetry?:    () => void
}

function Spinner() {
  return (
    <div className="relative w-[88px] h-[88px]">
      <div className="w-[88px] h-[88px] rounded-full bg-[#EFF6FF]" />
      <div className="absolute inset-0 rounded-full border-[5px] border-[#BFDBFE] border-t-[#0095F6] animate-spin" />
    </div>
  )
}

function StepItem({ label, status, detail }: LoadingStep) {
  const icon = {
    done: (
      <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0">
        <span className="text-white text-[13px] font-bold">✓</span>
      </div>
    ),
    active: (
      <div className="w-8 h-8 rounded-full border-[2.5px] border-[#0095F6] shrink-0" />
    ),
    pending: (
      <div className="w-8 h-8 rounded-full bg-[#E5E7EB] shrink-0" />
    ),
  }[status]

  return (
    <div className={`flex items-start gap-3.5 py-4 border-b border-[#E5E7EB] last:border-0 transition-opacity duration-300 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
      {icon}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold leading-snug ${status === 'pending' ? 'text-[#374151]' : 'text-[#0A0A0A]'}`}>
          {label}
        </p>
        {detail && (
          <p className={`text-[12px] mt-1 ${status === 'done' ? 'text-[#737373]' : 'text-[#0095F6]'}`}>
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ value, color = '#0095F6' }: { value: number; color?: string }) {
  return (
    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-linear"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}

function useAnimatedProgress(target: number, active: boolean) {
  const [display, setDisplay] = useState(target)

  // Snap ke atas kalau target naik (checkpoint tercapai)
  useEffect(() => {
    setDisplay(prev => Math.max(prev, target))
  }, [target])

  // Auto-increment saat loading — makin lambat mendekati 95%
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setDisplay(prev => {
        if (prev >= 95) return prev
        const speed = Math.max(0.08, (95 - prev) * 0.006)
        return Math.min(prev + speed, 95)
      })
    }, 100)
    return () => clearInterval(id)
  }, [active])

  return display
}

function InfoNote() {
  return (
    <div className="flex gap-2.5 items-start bg-white border border-[#E5E7EB] rounded-xl p-3.5">
      <div className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        i
      </div>
      <p className="text-[12px] text-[#374151] leading-relaxed">
        Topiknya masih bisa dicentang atau diubah di langkah berikutnya.
      </p>
    </div>
  )
}

export function LoadingDialog({
  phase,
  title = '', description = '', steps = [], progress = 0, currentLabel = '',
  topicCounts = [], totalTopics = 0, kelas,
  errorMessage = '', errorStopped = '', errorProgress = 0,
  onCancel, onContinue, onRetry,
}: Props) {
  const animatedProgress = useAnimatedProgress(progress, phase === 'loading')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      {/* ── LOADING ── */}
      {phase === 'loading' && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row md:h-[480px]">
          {/* Left panel */}
          <div className="flex-1 p-8 flex flex-col gap-5">
            <Spinner />
            <div>
              <h2 className="font-extrabold text-[22px] text-[#0A0A0A] leading-snug">{title}</h2>
              <p className="text-[13px] text-[#737373] mt-2 leading-relaxed">{description}</p>
            </div>
            <div className="space-y-1.5">
              <ProgressBar value={animatedProgress} />
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[#737373]">{currentLabel}</span>
                <span className="text-[13px] font-semibold text-[#0A0A0A]">{Math.round(animatedProgress)}%</span>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="self-start px-5 py-2 rounded-xl border border-[#DBDBDB] text-[14px] font-semibold hover:bg-[#F5F5F5] transition-colors"
              >
                Batalkan
              </button>
            )}
          </div>

          {/* Right panel — TAHAPAN, tinggi mengikuti modal, steps scrollable */}
          <div className="md:w-[280px] bg-[#F3F4F6] border-t md:border-t-0 md:border-l border-[#E5E7EB] p-5 flex flex-col gap-4 min-h-0">
            <p className="text-[11px] font-bold text-[#9CA3AF] tracking-widest uppercase shrink-0">Tahapan</p>
            {/* Scrollable steps */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {steps.map((s, i) => <StepItem key={i} {...s} />)}
            </div>
            {/* Info note pinned di bottom */}
            <InfoNote />
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {phase === 'success' && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto">
            <span className="text-[#22C55E] text-2xl font-bold">✓</span>
          </div>
          <div>
            <h2 className="font-extrabold text-[22px] text-[#0A0A0A]">
              {totalTopics} topik siap dipakai
            </h2>
            <p className="text-[13px] text-[#737373] mt-1">
              Dari {topicCounts.length} mapel · Kelas {kelas} SD
            </p>
          </div>
          <div className="border border-[#DBDBDB] rounded-xl overflow-hidden text-left">
            {topicCounts.map((t, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-[#F9FAFB] last:border-0">
                <span className="text-[13px] text-[#737373]">{t.subjectLabel}</span>
                <span className="text-[13px] font-semibold text-[#0A0A0A]">{t.count} topik</span>
              </div>
            ))}
          </div>
          <InfoNote />
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold hover:bg-[#0074CC] transition-colors"
          >
            Lihat & Centang Topik →
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center mx-auto">
            <span className="text-[#D97706] text-xl font-bold">!</span>
          </div>
          <div className="text-center">
            <h2 className="font-extrabold text-[18px] text-[#0A0A0A]">Analisis sebagian gagal</h2>
            <p className="text-[13px] text-[#737373] mt-1.5 leading-relaxed">{errorMessage}</p>
          </div>
          <div className="space-y-1.5">
            <ProgressBar value={errorProgress} color="#D97706" />
            {errorStopped && (
              <p className="text-[12px] text-[#D97706]">{errorStopped}</p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            {onContinue && (
              <button
                onClick={onContinue}
                className="flex-1 py-2.5 rounded-xl border border-[#DBDBDB] text-[13px] font-semibold hover:bg-[#F5F5F5] transition-colors"
              >
                Pakai yang Ada
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-2.5 rounded-xl bg-[#0095F6] text-white text-[13px] font-semibold hover:bg-[#0074CC] transition-colors"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
