import type { OnboardingData } from '@/app/onboarding/page'

const SOURCES = [
  { value: 'AI',    label: '🤖 Kurikulum Merdeka (AI)', desc: 'Topik diambil otomatis dari kurikulum nasional' },
  { value: 'PHOTO', label: '📷 Foto Buku',              desc: 'Foto daftar isi buku — coming soon' },
]

interface Props { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }

export function StepTopicSource({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-extrabold text-[18px]">Sumber Topik</h2>
        <p className="text-[13px] text-[#737373] mt-0.5">Dari mana topik kuis anak diambil?</p>
      </div>

      <div className="space-y-3">
        {SOURCES.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => value !== 'PHOTO' && onChange({ topicSource: value })}
            disabled={value === 'PHOTO'}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${
              data.topicSource === value
                ? 'bg-[#E0F2FE] border-[#0095F6]'
                : value === 'PHOTO'
                  ? 'border-[#DBDBDB] opacity-50 cursor-not-allowed'
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
    </div>
  )
}
