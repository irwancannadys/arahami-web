import { NextResponse } from 'next/server'
import { generateText, SUBJECT_LABELS, checkApiSecret, parseGeminiJson } from '@/lib/gemini'

interface PhotoInput {
  imageBase64: string
  mimeType:    string
}

function buildPrompt(rawText: string, subjectName: string, kelas: number): string {
  return `
Ini adalah hasil OCR dari foto daftar isi buku pelajaran ${subjectName} SD kelas ${kelas}.
Teks mengandung noise OCR: titik-titik (....), nomor halaman, kapitalisasi aneh, dan karakter tidak sempurna.

Tugasmu:
1. Ekstrak HANYA nama Bab utama dan sub-topik materi pembelajaran
2. BUANG semua entri berikut (bukan materi pelajaran):
   - Asesmen / Evaluasi / Latihan Soal / Uji Kompetensi / Refleksi
   - Glosarium / Daftar Istilah / Kosakata
   - Prakata / Kata Pengantar / Sambutan
   - Daftar Gambar / Daftar Tabel / Daftar Pustaka / Daftar Kredit
   - Indeks / Informasi Penerbit / Hak Cipta / Informasi Perbukuan
   - Capaian Pembelajaran / Jelajah Isi Buku / Petunjuk Penggunaan
3. BUANG entry yang jelas terpotong / tidak lengkap (kurang dari 3 kata bermakna)
4. Kalau ada baris yang merupakan lanjutan dari baris sebelumnya (misal judul panjang terpecah 2 baris), gabungkan menjadi satu topik
5. Bersihkan: hapus titik-titik (....), nomor halaman, kode huruf di depan (A. B. C. Bab 1 dst)
6. Perbaiki kapitalisasi yang salah akibat OCR — gunakan Title Case normal
7. Kembalikan topik yang benar-benar bisa dijadikan materi kuis untuk anak SD

Kembalikan HANYA JSON array string, tanpa markdown, tanpa penjelasan:
["Topik 1", "Topik 2", "Topik 3"]

Raw OCR text:
${rawText}
`.trim()
}

export async function POST(req: Request) {
  if (!checkApiSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    images:  PhotoInput[]
    subject: string
    kelas:   number
  }

  const { images, subject, kelas } = body

  if (!images?.length || !subject || !kelas) {
    return NextResponse.json({ error: 'images, subject, kelas wajib diisi' }, { status: 400 })
  }

  const subjectName  = SUBJECT_LABELS[subject] ?? subject
  const ocrServiceUrl = process.env.PYTHON_OCR_URL ?? 'http://localhost:8000'
  const ocrSecret     = process.env.OCR_SECRET ?? 'arahami-ocr-secret-2026'

  try {
    // Step 1: call Python OCR service → raw text
    const ocrRes = await fetch(`${ocrServiceUrl}/ocr`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ocr-secret': ocrSecret,
      },
      body: JSON.stringify({ images }),
    })

    if (!ocrRes.ok) {
      const err = await ocrRes.text()
      throw new Error(`OCR service error: ${err}`)
    }

    const { text: rawText } = await ocrRes.json() as { text: string }

    if (!rawText.trim()) {
      return NextResponse.json([])
    }

    // Step 2: Groq parse raw text → clean topic list
    const prompt   = buildPrompt(rawText, subjectName, kelas)
    const response = await generateText(prompt)
    const topics   = parseGeminiJson<string[]>(response)

    // Step 3: filter & deduplicate
    const unique = [...new Set(
      topics.filter(t => typeof t === 'string' && t.trim().length > 0)
    )]

    return NextResponse.json(unique)
  } catch (e) {
    console.error('[analyze-photo]', e)
    return NextResponse.json({ error: `Gagal analisis foto: ${e}` }, { status: 500 })
  }
}
