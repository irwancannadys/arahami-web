import type { OnboardingData } from '@/app/onboarding/page'

const GRADES  = [1,2,3,4,5,6]
const GENDERS = [{ value: 'L', label: '👦 Laki-laki' }, { value: 'P', label: '👧 Perempuan' }]

const THEMES_BOY  = ['⚽ Sepak Bola','🤖 Robot','🎒 Petualang','🦕 Dinosaurus']
const THEMES_GIRL = ['👑 Princess','🐱 Kucing','🧁 Bakery','🧜‍♀️ Putri Duyung']

interface Props { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }

export function StepProfile({ data, onChange }: Props) {
  const themes = data.childGender === 'L' ? THEMES_BOY : data.childGender === 'P' ? THEMES_GIRL : []

  return (
    <div className="space-y-5">
      <h2 className="font-extrabold text-[18px]">Profil Anak</h2>

      {/* Name */}
      <div>
        <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Nama anak</label>
        <input
          type="text"
          value={data.childName}
          onChange={e => onChange({ childName: e.target.value })}
          placeholder="Masukkan nama anak"
          className="w-full border border-[#DBDBDB] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[#0095F6] transition-colors"
        />
      </div>

      {/* Grade */}
      <div>
        <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Kelas</label>
        <div className="flex gap-2 flex-wrap">
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => onChange({ childGrade: g, childTheme: '', topics: {}, manualTopicInputsBySubject: {} })}
              className={`px-4 py-2 rounded-xl border text-[14px] font-semibold transition-colors ${
                data.childGrade === g
                  ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]'
                  : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}
            >
              Kelas {g}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Jenis kelamin</label>
        <div className="flex gap-3">
          {GENDERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ childGender: value, childTheme: '' })}
              className={`flex-1 py-2.5 rounded-xl border text-[14px] font-semibold transition-colors ${
                data.childGender === value
                  ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]'
                  : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      {themes.length > 0 && (
        <div>
          <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">Tema favorit</label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map(theme => (
              <button
                key={theme}
                onClick={() => onChange({ childTheme: theme })}
                className={`py-2.5 rounded-xl border text-[14px] font-semibold transition-colors ${
                  data.childTheme === theme
                    ? 'bg-[#E0F2FE] border-[#0095F6] text-[#0095F6]'
                    : 'border-[#DBDBDB] hover:bg-[#F5F5F5]'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
