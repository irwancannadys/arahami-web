import { NextResponse } from 'next/server'
import { generateText, SUBJECT_LABELS, checkAuth, parseGeminiJson } from '@/lib/gemini'

// Batasan materi per kelas per mapel — mencegah soal terlalu susah/mudah
const GRADE_HINTS: Record<number, Record<string, string>> = {
  1: {
    MTK:       'Bilangan 1–20, penjumlahan/pengurangan maks 20, mengenal bentuk dasar',
    B_INDO:    'Huruf, suku kata, kata sederhana, kalimat pendek 1 baris',
    IPA:       'Bagian tubuh, hewan di sekitar, tumbuhan sederhana, siang/malam',
    IPS:       'Anggota keluarga, nama hari, lingkungan rumah dan sekolah',
    AGAMA:     'Rukun Islam & Iman dasar (hafalan), doa harian, huruf hijaiyah dasar',
    PANCASILA: 'Bunyi sila Pancasila, lambang sila, bendera & lagu kebangsaan',
    ENGLISH:   'Salam, angka 1–10, warna dasar, benda sekitar kelas',
    SENI:      'Warna primer, garis dan bentuk sederhana, lagu anak-anak',
    PJOK:      'Gerakan dasar (jalan, lompat, lempar), menjaga kebersihan diri',
  },
  2: {
    MTK:       'Bilangan 1–100, penjumlahan/pengurangan 2 angka, perkalian 1–5, mengenal uang',
    B_INDO:    'Kalimat sederhana, membaca lancar, cerita pendek 3–4 kalimat',
    IPA:       'Hewan dan habitat, pertumbuhan tanaman, benda padat/cair/gas',
    IPS:       'Jenis pekerjaan, aturan di rumah dan sekolah, denah sederhana',
    AGAMA:     'Rukun salat, kisah Nabi Muhammad dasar, akhlak terpuji sehari-hari',
    PANCASILA: 'Makna sila Pancasila, contoh pengamalan di kehidupan sehari-hari',
    ENGLISH:   'Angka 1–20, anggota keluarga, buah-buahan, nama binatang',
    SENI:      'Menggambar bebas, lagu daerah, gerakan dasar tari',
    PJOK:      'Permainan sederhana (lompat tali, dll), keseimbangan tubuh',
  },
  3: {
    MTK:       'Bilangan 1–1000, perkalian & pembagian (1–10), satuan panjang & waktu sederhana, keliling bangun datar',
    B_INDO:    'Paragraf sederhana, sinonim & antonim dasar, jenis kata (kata benda/kerja)',
    IPA:       'Cuaca & iklim, sumber daya alam sederhana, daur hidup hewan (katak, kupu-kupu)',
    IPS:       'Peta desa/kota sederhana, kerjasama masyarakat, kegiatan ekonomi dasar',
    AGAMA:     'Kewajiban shalat 5 waktu, kisah nabi lanjutan, adab berinteraksi',
    PANCASILA: 'Nilai-nilai Pancasila, norma dalam keluarga & masyarakat',
    ENGLISH:   'Hari & bulan, kegiatan sehari-hari (present tense sederhana), profesi',
    SENI:      'Unsur seni rupa (garis, bidang, warna), lagu bertanda birama 2/4 dan 3/4',
    PJOK:      'Atletik dasar (lari, lompat jauh), permainan bola, gizi seimbang',
  },
  4: {
    MTK:       'KPK & FPB, bilangan bulat (positif & negatif dasar), pecahan biasa & campuran, desimal, bangun ruang sederhana (kubus, balok)',
    B_INDO:    'Cerpen pendek & unsur intrinsiknya, kalimat majemuk, sinonim/antonim lanjut, pantun sederhana',
    IPA:       'Rangka & otot manusia, perubahan wujud benda (mencair, membeku, dll), gaya dan gerak, sumber energi',
    IPS:       'Peta Indonesia (letak geografis, nama provinsi), sumber daya alam, keragaman suku & budaya',
    AGAMA:     'Sifat-sifat Allah (asmaul husna dasar), akhlak terpuji, fiqih ibadah (thaharah, shalat)',
    PANCASILA: 'Hak & kewajiban warga negara, keberagaman dalam persatuan bangsa',
    ENGLISH:   'Simple past tense, mendeskripsikan orang/tempat, vocabulary sehari-hari lanjut',
    SENI:      'Teknik dasar melukis, irama dalam musik, apresiasi karya seni daerah',
    PJOK:      'Kebugaran jasmani, permainan bola besar & kecil (aturan dasar), renang dasar',
  },
  5: {
    MTK:       'Desimal & persen, luas & keliling bangun datar (persegi, segitiga, lingkaran), skala peta, bilangan prima, FPB/KPK lanjut',
    B_INDO:    'Pantun (syarat & ciri), teks iklan, laporan pengamatan, teks prosedur, kata hubung',
    IPA:       'Sistem pencernaan manusia, fotosintesis pada tumbuhan, rantai makanan & jaring-jaring makanan, pesawat sederhana, magnet',
    IPS:       'Kerajaan Nusantara (Hindu-Buddha & Islam), penjajahan Belanda & Jepang, kondisi geografis Asia Tenggara',
    AGAMA:     'Kisah sahabat Nabi, zakat & infak (pengertian & jenis), adab bertetangga & bertamu',
    PANCASILA: 'Sistem pemerintahan Indonesia, lembaga negara (eksekutif, legislatif, yudikatif), demokrasi Pancasila',
    ENGLISH:   'Present perfect tense, meminta & memberi petunjuk arah, reading comprehension sederhana',
    SENI:      'Gambar perspektif, tangga nada mayor & minor, kreasi seni budaya daerah Indonesia',
    PJOK:      'Bela diri dasar (pencak silat), renang gaya bebas, pertolongan pertama pada kecelakaan ringan',
  },
  6: {
    MTK:       'Aljabar sederhana, koordinat kartesius, statistika dasar (mean/median/modus), luas bangun gabungan, peluang sederhana, bilangan bulat & rasional',
    B_INDO:    'Teks editorial sederhana, debat (kalimat pendapat & argumen), majas (personifikasi, metafora, hiperbola), drama pendek, cerpen lanjut',
    IPA:       'Sistem peredaran darah manusia, perkembangbiakan makhluk hidup, listrik sederhana (rangkaian), tata surya & planet, perubahan lingkungan & dampaknya',
    IPS:       'Peran Indonesia di ASEAN, globalisasi & dampaknya, pembangunan nasional, kerjasama internasional (PBB, dll), sejarah proklamasi kemerdekaan RI',
    AGAMA:     'Iman kepada hari akhir & tanda-tandanya, ibadah haji & umrah, akhlak mulia dalam pergaulan, kisah nabi terakhir (Muhammad SAW) lengkap',
    PANCASILA: 'Hubungan antar lembaga negara, Pancasila sebagai ideologi & dasar negara, pokok-pokok UUD 1945, bela negara',
    ENGLISH:   'Passive voice sederhana, conditional sentence type 1, reading comprehension lanjut, menulis paragraf sederhana',
    SENI:      'Seni rupa 3 dimensi, harmoni & komposisi dalam musik, koreografi tari sederhana, apresiasi seni mancanegara',
    PJOK:      'Strategi permainan tim (sepak bola, basket), kebugaran jasmani lanjut (daya tahan, kekuatan), gaya hidup sehat & bahaya narkoba',
  },
}

export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { topicName, kelas, subject } = await req.json() as {
    topicName: string; kelas: number; subject: string
  }

  if (!topicName || !kelas || !subject) {
    return NextResponse.json({ error: 'topicName, kelas, subject wajib diisi' }, { status: 400 })
  }

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject
  const gradeHint    = GRADE_HINTS[kelas]?.[subject]
    ? `\nBatasan materi kelas ${kelas} untuk ${subjectLabel}: ${GRADE_HINTS[kelas][subject]}`
    : ''

  const prompt = `
Kamu adalah guru SD Indonesia berpengalaman yang membuat soal kuis AKURAT dan TERVERIFIKASI.
Mata pelajaran: ${subjectLabel} | Topik: "${topicName}" | Kelas: ${kelas} SD${gradeHint}

=== PROSES WAJIB untuk setiap soal multiple_choice ===
LANGKAH 1: Tentukan JAWABAN BENAR dahulu — pastikan 100% akurat secara faktual
LANGKAH 2: Buat 4 opsi yang mengandung jawaban benar di posisi acak + 3 pengecoh masuk akal
LANGKAH 3: Hitung posisi jawaban benar di array (0=opsi pertama, 1=kedua, 2=ketiga, 3=keempat)
LANGKAH 4: Set "correct" = angka dari langkah 3
LANGKAH 5: WAJIB verifikasi → options[correct] harus IDENTIK dengan jawaban benar di langkah 1

=== ATURAN FAKTUAL (semua mapel) ===
- Soal HARUS 100% akurat sesuai materi SD kelas ${kelas} (lihat batasan materi di atas)
- Matematika: HITUNG MANUAL dahulu, baru tulis soal dan opsi — JANGAN tebak
- IPA/IPS/Bahasa/Agama/dll: gunakan fakta yang pasti benar untuk level SD kelas ${kelas}
- JANGAN mengarang fakta. Kalau tidak yakin → buat soal yang lebih sederhana dan pasti benar
- Bahasa soal mudah dipahami anak SD kelas ${kelas}

=== ATURAN KHUSUS PER TIPE ===
- true_false: "correct" HARUS boolean true atau false — BUKAN string "true"/"false"
- tap_image: "correct" HARUS array index yang TEPAT — verifikasi setiap index

=== FORMAT OUTPUT — HANYA JSON array, tanpa markdown ===
[
  {
    "type": "multiple_choice",
    "question": "teks soal",
    "illustration": "emoji relevan atau null",
    "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
    "correct": 1,
    "explanation": "Karena options[1] yaitu '...' adalah jawaban benar karena ..."
  },
  {
    "type": "true_false",
    "question": "pernyataan benar atau salah",
    "illustration": "emoji atau null",
    "correct": true,
    "explanation": "penjelasan faktual singkat"
  },
  {
    "type": "tap_image",
    "question": "Pilih semua yang termasuk ...",
    "options": ["emoji1 label", "emoji2 label", "emoji3 label", "emoji4 label"],
    "correct": [0, 2],
    "explanation": "[nama opsi1] dan [nama opsi3] benar karena ... — JANGAN sebut angka index, gunakan nama opsinya"
  }
]

Buat TEPAT 6 soal dengan komposisi: 4 multiple_choice, 1 true_false, 1 tap_image.

=== CEK AKHIR SEBELUM OUTPUT ===
Untuk setiap multiple_choice: options[correct] == jawaban benar dari langkah 1? ✓
Semua fakta sudah diverifikasi sesuai level kelas ${kelas}? ✓
`.trim()

  try {
    // temperature 0.3 — lebih deterministik, kurangi hallucination untuk soal faktual
    const text = await generateText(prompt, 0.3)
    const data = parseGeminiJson<object[]>(text)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: `Gagal generate quiz: ${e}` }, { status: 500 })
  }
}
