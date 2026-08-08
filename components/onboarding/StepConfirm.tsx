import type { OnboardingData } from '@/app/onboarding/page'
import { DAY_LABELS, SUBJECT_LABELS } from '@/lib/curriculum'

interface Props {
  data:      OnboardingData
  onJumpTo:  (step: number) => void
}

export function StepConfirm({ data, onJumpTo }: Props) {
  const selectedTopics = Object.entries(data.topics).flatMap(([subject, list]) =>
    list.filter(t => t.selected).map(t => ({ subject, name: t.name }))
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-extrabold text-[18px]">Konfirmasi Data</h2>
        <p className="text-[13px] text-[#737373] mt-0.5">Cek semua data sebelum disimpan</p>
      </div>

      <Section title="Profil Anak" onEdit={() => onJumpTo(1)}>
        <Row label="Nama"   value={data.childName} />
        <Row label="Kelas"  value={`Kelas ${data.childGrade}`} />
        <Row label="Gender" value={data.childGender === 'L' ? 'Laki-laki' : 'Perempuan'} />
        <Row label="Tema"   value={data.childTheme} />
      </Section>

      <Section title="Jadwal Mapel" onEdit={() => onJumpTo(2)}>
        {Object.entries(data.schedules)
          .filter(([, s]) => s.length > 0)
          .map(([day, subjects]) => (
            <Row
              key={day}
              label={DAY_LABELS[day]}
              value={subjects.map(s => SUBJECT_LABELS[s] ?? s).join(', ')}
            />
          ))}
      </Section>

      <Section title="Sumber Topik" onEdit={() => onJumpTo(3)}>
        <Row
          label="Sumber"
          value={data.topicSource === 'AI' ? 'Kurikulum Merdeka (AI)' : 'Foto Buku'}
        />
      </Section>

      <Section title="Topik yang Dipilih" onEdit={() => onJumpTo(4)}>
        {selectedTopics.length === 0 ? (
          <p className="text-[13px] text-[#A8A8A8]">Belum ada topik dipilih</p>
        ) : (
          Object.entries(
            selectedTopics.reduce((acc, { subject, name }) => {
              acc[subject] = [...(acc[subject] ?? []), name]
              return acc
            }, {} as Record<string, string[]>)
          ).map(([subject, names]) => (
            <div key={subject} className="mb-2 last:mb-0">
              <p className="text-[13px] font-semibold text-[#0A0A0A]">
                {SUBJECT_LABELS[subject] ?? subject}
              </p>
              {names.map(name => (
                <p key={name} className="text-[12px] text-[#737373] pl-3">• {name}</p>
              ))}
            </div>
          ))
        )}
      </Section>
    </div>
  )
}

function Section({
  title, onEdit, children,
}: {
  title: string; onEdit: () => void; children: React.ReactNode
}) {
  return (
    <div className="border border-[#DBDBDB] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-[#DBDBDB]">
        <p className="text-[13px] font-semibold">{title}</p>
        <button
          onClick={onEdit}
          className="text-[13px] text-[#0095F6] font-semibold hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[13px]">
      <span className="text-[#737373] w-24 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
