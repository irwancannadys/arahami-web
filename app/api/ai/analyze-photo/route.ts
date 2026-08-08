import { NextResponse } from 'next/server'
import { generateTextWithImage, SUBJECT_LABELS, checkApiSecret, parseGeminiJson } from '@/lib/gemini'

export async function POST(req: Request) {
  if (!checkApiSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageBase64, mimeType, subject, kelas } = await req.json() as {
    imageBase64: string; mimeType: string; subject: string; kelas: number
  }

  if (!imageBase64 || !subject || !kelas) {
    return NextResponse.json({ error: 'imageBase64, subject, kelas wajib diisi' }, { status: 400 })
  }

  const prompt = `
Ini adalah foto daftar isi buku pelajaran ${SUBJECT_LABELS[subject] ?? subject} SD kelas ${kelas}.
Ekstrak semua topik/bab/materi yang ada.

Kembalikan HANYA JSON array (tanpa kode markdown):
["topik 1", "topik 2", "topik 3"]

Jika tidak ada daftar isi yang jelas, kembalikan: []
`.trim()

  try {
    const text = await generateTextWithImage(prompt, imageBase64, mimeType ?? 'image/jpeg')
    const data = parseGeminiJson<string[]>(text)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: `Gagal analisis foto: ${e}` }, { status: 500 })
  }
}
