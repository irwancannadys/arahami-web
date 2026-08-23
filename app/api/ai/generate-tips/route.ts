import { NextResponse } from 'next/server'
import { generateText, checkAuth, parseGeminiJson } from '@/lib/gemini'

const PROMPT = `
Kamu adalah pakar parenting dan pendidikan anak SD Indonesia.

Buat 8 tips parenting yang praktis dan relevan untuk orang tua anak SD (kelas 1–6) di Indonesia.

Kategori yang harus ada (minimal 2 per kategori):
- "Parenting": tips seputar pengasuhan anak sehari-hari
- "Belajar": tips cara mendampingi anak belajar di rumah
- "Motivasi": tips memotivasi anak untuk semangat belajar

Grade level:
- "Semua Kelas": berlaku untuk semua kelas SD
- "Kelas 1–3": untuk anak kelas 1, 2, 3 (usia 6–9 tahun)
- "Kelas 4–6": untuk anak kelas 4, 5, 6 (usia 10–12 tahun)

Aturan:
- Bahasa Indonesia yang santai dan mudah dipahami orang tua
- 2–3 kalimat per tips, to-the-point dan actionable
- Pilih emoji yang relevan dengan isi tips
- Variasikan grade level secara merata
- JANGAN ulangi topik yang sama antar tips

Kembalikan HANYA JSON array (tanpa markdown, tanpa komentar):
[
  {
    "category": "Parenting",
    "grade": "Semua Kelas",
    "emoji": "🫂",
    "text": "isi tips di sini"
  }
]

Total: tepat 8 tips.
`.trim()

export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const raw   = await generateText(PROMPT)
    const items = parseGeminiJson<Array<{ category: string; grade: string; emoji: string; text: string }>>(raw)

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Response bukan array yang valid')
    }

    const tips = items.map((item, i) => ({ id: i + 1, ...item }))
    return NextResponse.json({ tips })
  } catch (e) {
    return NextResponse.json({ error: `Gagal generate tips: ${e}` }, { status: 500 })
  }
}
