import { NextResponse } from 'next/server'
import { generateText, SUBJECT_LABELS, checkAuth, parseGeminiJson } from '@/lib/gemini'
import { getTopics } from '@/lib/curriculum'

// Kelas yang butuh iterasi karena AI sering drop level
const ITERATION_GRADES = [4, 6]

// Hint khusus per kelas per mapel untuk perkuat seed
const GRADE_HINTS: Record<number, Record<string, string>> = {
  4: {
    MTK:   'WAJIB ada: KPK & FPB, bilangan bulat, pecahan biasa & campuran, desimal, bangun ruang sederhana',
  },
  6: {
    MTK:    'WAJIB ada: aljabar sederhana, koordinat kartesius, luas & keliling bangun gabungan, peluang, bilangan bulat & rasional',
    IPA:    'WAJIB ada: sistem peredaran darah, perkembangbiakan, listrik sederhana, tata surya, perubahan lingkungan',
    B_INDO: 'WAJIB ada: cerpen, drama pendek, teks editorial, debat, majas & ungkapan',
    IPS:    'WAJIB ada: peran Indonesia di ASEAN, globalisasi, pembangunan nasional, kerjasama internasional, sejarah perjuangan',
  },
}

function buildPrompt(kelas: number, subjects: string[], seedData: Record<string, string[]>): string {
  const seedSection = Object.entries(seedData)
    .map(([s, topics]) => {
      const hint = GRADE_HINTS[kelas]?.[s] ? `\n   [${GRADE_HINTS[kelas][s]}]` : ''
      return `${SUBJECT_LABELS[s] ?? s}: ${topics.join(', ')}${hint}`
    })
    .join('\n')

  const subjectNames = subjects.map(s => SUBJECT_LABELS[s] ?? s).join(', ')

  return `
Kamu adalah pakar kurikulum SD Indonesia yang memahami Kurikulum Merdeka secara mendalam.

Berikut topik TERVALIDASI untuk SD kelas ${kelas} berdasarkan Kurikulum Merdeka:
${seedSection || '(Tidak ada data seed — generate sesuai Kurikulum Merdeka)'}

Tugasmu:
1. Verifikasi dan pastikan semua topik sesuai level TEPAT kelas ${kelas} SD
2. Tambahkan topik penting yang belum ada, terutama yang ada di tag [WAJIB ada]
3. HAPUS topik yang levelnya terlalu rendah atau terlalu tinggi untuk kelas ${kelas}
4. JANGAN turunkan level: contoh "Bilangan Bulat" itu SMP, bukan SD kelas ${kelas}
5. JANGAN mengarang topik yang tidak ada di Kurikulum Merdeka. Gunakan nama topik yang tepat dan baku.

Mata pelajaran: ${subjectNames}
Kelas: ${kelas} SD | Kurikulum: Kurikulum Merdeka

Kembalikan HANYA JSON (tanpa markdown):
{
  "KODE_MAPEL": ["topik 1", "topik 2", ...],
  ...
}

Kode mapel: ${subjects.join(', ')}
Target: 5-8 topik per mapel, spesifik dan sesuai level kelas ${kelas} SD.
`.trim()
}

export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { kelas, subjects } = await req.json() as { kelas: number; subjects: string[] }

  if (!kelas || !subjects?.length) {
    return NextResponse.json({ error: 'kelas dan subjects wajib diisi' }, { status: 400 })
  }

  // Seed dari hardcoded curriculum sebagai anchor
  const seedData: Record<string, string[]> = {}
  for (const subject of subjects) {
    const seed = getTopics(kelas, subject)
    if (seed.length > 0) seedData[subject] = seed
  }

  const prompt  = buildPrompt(kelas, subjects, seedData)
  const maxRuns = ITERATION_GRADES.includes(kelas) ? 3 : 1

  try {
    if (maxRuns === 1) {
      // Kelas 1-3 dan 5 — cukup 1 run, sudah konsisten
      const text = await generateText(prompt)
      const data = parseGeminiJson<Record<string, string[]>>(text)
      return NextResponse.json(data)
    }

    // Kelas 4 dan 6 — 3 runs, merge, lalu AI curate yang terbaik
    const allResults: Record<string, string[]>[] = []
    for (let i = 0; i < maxRuns; i++) {
      try {
        const text = await generateText(prompt)
        allResults.push(parseGeminiJson<Record<string, string[]>>(text))
      } catch {
        // skip failed run
      }
    }

    if (allResults.length === 0) throw new Error('Semua run gagal')
    if (allResults.length === 1) return NextResponse.json(allResults[0])

    // Merge semua topik dari semua runs (deduplicated)
    const merged: Record<string, string[]> = {}
    for (const result of allResults) {
      for (const [subject, topics] of Object.entries(result)) {
        const existing = new Set(merged[subject] ?? [])
        topics.forEach(t => existing.add(t))
        merged[subject] = [...existing]
      }
    }

    // Final curation — AI pilih 5-8 terbaik dari pool gabungan
    // Wrapped in try/catch — fallback ke run terbaik jika curation gagal
    let finalResult = allResults[allResults.length - 1] // default: last run
    try {
    const curatePrompt = `
Kamu adalah kurator topik kurikulum SD kelas ${kelas} Kurikulum Merdeka.

Berikut daftar topik gabungan dari beberapa sumber untuk kelas ${kelas} SD:
${Object.entries(merged).map(([s, t]) => `${SUBJECT_LABELS[s] ?? s}: ${t.join(' | ')}`).join('\n')}

Pilih 5-8 topik TERBAIK per mapel yang:
- Paling sesuai level kelas ${kelas} SD (tidak terlalu mudah/sulit)
- Sesuai Kurikulum Merdeka terkini
- Spesifik dan tidak tumpang tindih
${subjects.map(s => GRADE_HINTS[kelas]?.[s] ? `- ${SUBJECT_LABELS[s]}: ${GRADE_HINTS[kelas][s]}` : '').filter(Boolean).join('\n')}

PENTING: Setiap mapel WAJIB memiliki minimal 5 topik, maksimal 8.
Kembalikan HANYA JSON (tanpa markdown):
{"KODE_MAPEL": ["topik 1", "topik 2", "topik 3", "topik 4", "topik 5"], ...}
Kode mapel: ${subjects.join(', ')}
    `.trim()

    const curateText = await generateText(curatePrompt)
      finalResult = parseGeminiJson<Record<string, string[]>>(curateText)
    } catch {
      // Curation gagal — pakai run terakhir yang berhasil
    }
    return NextResponse.json(finalResult)

  } catch (e) {
    return NextResponse.json({ error: `Gagal generate topik: ${e}` }, { status: 500 })
  }
}
