import { NextResponse } from 'next/server'
import { generateText, SUBJECT_LABELS, checkApiSecret, parseGeminiJson } from '@/lib/gemini'

export async function POST(req: Request) {
  if (!checkApiSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { topicName, kelas, subject } = await req.json() as {
    topicName: string; kelas: number; subject: string
  }

  if (!topicName || !kelas || !subject) {
    return NextResponse.json({ error: 'topicName, kelas, subject wajib diisi' }, { status: 400 })
  }

  const prompt = `
Buat TEPAT 6 soal kuis Bahasa Indonesia untuk anak SD kelas ${kelas}.
Mata pelajaran: ${SUBJECT_LABELS[subject] ?? subject}
Topik: "${topicName}"

Kembalikan HANYA JSON array (tanpa kode markdown):
[
  {
    "type": "multiple_choice",
    "question": "...",
    "illustration": "emoji atau null",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "penjelasan singkat"
  },
  {
    "type": "true_false",
    "question": "pernyataan...",
    "illustration": "emoji atau null",
    "correct": true,
    "explanation": "penjelasan"
  },
  {
    "type": "tap_image",
    "question": "Pilih semua yang...",
    "options": ["emoji1", "emoji2", "emoji3", "emoji4"],
    "correct": [0, 2],
    "explanation": "penjelasan"
  }
]

Minimal 3 multiple_choice, 1 true_false, 1 tap_image. Bahasa mudah untuk SD kelas ${kelas}.
`.trim()

  try {
    const text = await generateText(prompt)
    const data = parseGeminiJson<object[]>(text)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: `Gagal generate quiz: ${e}` }, { status: 500 })
  }
}
