import { useState } from 'react'

interface Props { code: string; onGoToDashboard: () => void }

export function StepDone({ code, onGoToDashboard }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="text-center space-y-6 py-4">
      <div className="text-5xl">🎉</div>

      <div>
        <h2 className="font-extrabold text-[20px]">Setup selesai!</h2>
        <p className="text-[13px] text-[#737373] mt-1">
          Berikan kode ini ke anak untuk masuk ke app
        </p>
      </div>

      {/* Code */}
      <div className="bg-[#E0F2FE] rounded-2xl px-8 py-6 inline-block">
        <p className="text-[11px] font-bold text-[#737373] uppercase tracking-wide mb-2">Kode Anak</p>
        <p className="text-5xl font-extrabold text-[#0095F6] tracking-[0.2em]">{code}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={copyCode}
          className="w-full py-2.5 rounded-xl border border-[#0095F6] text-[#0095F6] text-[14px] font-semibold hover:bg-[#E0F2FE] transition-colors"
        >
          {copied ? '✓ Tersalin!' : 'Salin Kode'}
        </button>
        <button
          onClick={onGoToDashboard}
          className="w-full py-2.5 rounded-xl bg-[#0095F6] text-white text-[14px] font-bold hover:bg-[#0074CC] transition-colors"
        >
          Ke Dashboard →
        </button>
      </div>
    </div>
  )
}
