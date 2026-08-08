import { NextResponse } from 'next/server'
import { generateText, SUBJECT_LABELS, checkApiSecret, parseGeminiJson } from '@/lib/gemini'

export async function POST(req: Request) {
  if (!checkApiSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { kelas, subjects } = await req.json() as { kelas: number; subjects: string[] }

  if (!kelas || !subjects?.length) {
    return NextResponse.json({ error: 'kelas dan subjects wajib diisi' }, { status: 400 })
  }

  const subjectNames = subjects.map(s => SUBJECT_LABELS[s] ?? s).join(', ')

  const prompt = `
Kamu adalah asisten kurikulum SD Indonesia.
Buatkan daftar topik pembelajaran berdasarkan Kurikulum Merdeka untuk:
- Kelas: ${kelas} SD
- Mata pelajaran: ${subjectNames}

Kembalikan HANYA JSON dengan format berikut (tanpa kode markdown, tanpa penjelasan):
{
  "KODE_MAPEL": ["topik 1", "topik 2", "topik 3"],
  ...
}

Kode mapel: ${subjects.join(', ')}
Buat 5-8 topik per mata pelajaran, sesuai Kurikulum Merdeka SD kelas ${kelas}.
`.trim()

  try {
    const text = await generateText(prompt)
    const data = parseGeminiJson<Record<string, string[]>>(text)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: `Gagal generate topik: ${e}` }, { status: 500 })
  }
}
