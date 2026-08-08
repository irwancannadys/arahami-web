// Mirror dari Android CurriculumData.kt
const topics: Record<string, string[]> = {
  '1_PANCASILA': ['Mengenal simbol Pancasila','Aturan di rumah','Kebersamaan dalam keluarga','Gotong royong'],
  '2_PANCASILA': ['Makna sila Pancasila','Hak & kewajiban anak','Keberagaman di sekolah','Aturan di sekolah'],
  '3_PANCASILA': ['Norma & aturan','Keberagaman budaya','Persatuan dalam keberagaman','Hak & kewajiban warga'],
  '4_PANCASILA': ['Nilai-nilai Pancasila','Keberagaman suku bangsa','Sistem pemerintahan desa','Musyawarah & mufakat'],
  '5_PANCASILA': ['NKRI & kebhinekaan','Hak asasi manusia','Sistem pemerintahan Indonesia','Kerjasama antar negara'],
  '6_PANCASILA': ['Pancasila sebagai dasar negara','Pemilu & demokrasi','Peran Indonesia di dunia','Nilai persatuan & kesatuan'],

  '1_MTK': ['Bilangan 1–10','Penjumlahan dasar','Pengurangan dasar','Bilangan 11–20','Pengenalan bangun datar'],
  '2_MTK': ['Penjumlahan dua angka','Pengurangan dua angka','Perkalian dasar','Pembagian dasar','Pengukuran panjang'],
  '3_MTK': ['Bilangan hingga 1.000','Perkalian & pembagian','Pecahan sederhana','Keliling & luas bangun datar','Waktu & kalender'],
  '4_MTK': ['Bilangan bulat','KPK & FPB','Pecahan biasa & campuran','Desimal','Bangun ruang'],
  '5_MTK': ['Operasi hitung campuran','Persentase','Skala & perbandingan','Volume bangun ruang','Statistika dasar'],
  '6_MTK': ['Bilangan bulat & rasional','Aljabar sederhana','Koordinat kartesius','Luas & keliling gabungan','Peluang'],

  '1_B_INDO': ['Mengenal huruf abjad','Membaca suku kata','Menulis kalimat sederhana','Mendengarkan cerita','Kata tanya'],
  '2_B_INDO': ['Membaca nyaring','Menulis paragraf','Kosakata tematik','Teks narasi pendek','Tanda baca'],
  '3_B_INDO': ['Teks deskripsi','Kalimat efektif','Sinonim & antonim','Teks petunjuk','Surat sederhana'],
  '4_B_INDO': ['Teks nonfiksi','Teks fiksi pendek','Ejaan & tanda baca','Paragraf padu','Puisi anak'],
  '5_B_INDO': ['Teks laporan','Teks persuasi','Pantun','Iklan & poster','Berpidato singkat'],
  '6_B_INDO': ['Teks editorial sederhana','Drama pendek','Cerpen','Debat singkat','Majas & ungkapan'],

  '1_IPA': ['Anggota tubuh','Hewan di sekitar kita','Tumbuhan di sekitar kita','Cuaca sehari-hari','Benda padat & cair'],
  '2_IPA': ['Siklus hidup hewan','Bagian tumbuhan','Sumber cahaya','Sifat benda','Kesehatan & kebersihan'],
  '3_IPA': ['Gerak benda','Energi panas & cahaya','Perubahan wujud benda','Ekosistem sederhana','Kesehatan lingkungan'],
  '4_IPA': ['Rantai makanan','Gaya & gerak','Energi & perubahannya','Struktur tumbuhan','Organ tubuh manusia'],
  '5_IPA': ['Sistem pencernaan','Perpindahan panas','Zat campuran','Adaptasi makhluk hidup','Bumi & antariksa'],
  '6_IPA': ['Sistem peredaran darah','Perkembangbiakan','Listrik sederhana','Tata surya','Perubahan lingkungan'],

  '1_IPS': ['Keluarga & anggota keluarga','Lingkungan rumah','Pekerjaan di sekitar kita','Denah sederhana'],
  '2_IPS': ['Kehidupan bertetangga','Aturan di rumah & sekolah','Jenis pekerjaan','Jual beli sederhana'],
  '3_IPS': ['Peta & denah wilayah','Sumber daya alam','Keragaman suku & budaya','Sejarah lingkungan sekitar'],
  '4_IPS': ['Kondisi geografis Indonesia','Keberagaman budaya','Pahlawan nasional','Kegiatan ekonomi'],
  '5_IPS': ['NKRI & wilayah Indonesia','Perjuangan kemerdekaan','Kegiatan ekonomi & perdagangan','Interaksi sosial'],
  '6_IPS': ['Peran Indonesia di ASEAN','Globalisasi','Pembangunan nasional','Kerjasama internasional'],

  '1_AGAMA': ['Rukun Islam','Rukun Iman','Doa sehari-hari','Asmaul Husna','Kisah nabi'],
  '2_AGAMA': ['Tata cara shalat','Membaca Al-Qur\'an','Akhlak terpuji','Kisah sahabat nabi'],
  '3_AGAMA': ['Sifat-sifat Allah','Thaharah','Shalat berjamaah','Zakat fitrah'],
  '4_AGAMA': ['Iman kepada malaikat','Membaca & menulis huruf hijaiyah','Akhlak mulia','Kisah nabi & rasul'],
  '5_AGAMA': ['Iman kepada kitab suci','Shalat sunnah','Puasa Ramadan','Adab & etika Islam'],
  '6_AGAMA': ['Iman kepada hari kiamat','Qada & qadar','Haji & umrah dasar','Muamalah sederhana'],

  '1_SENI': ['Menggambar bebas','Menyanyi lagu anak','Menari sederhana','Membuat prakarya'],
  '2_SENI': ['Menggambar dengan pola','Lagu daerah','Gerak tari dasar','Prakarya dari bahan alam'],
  '3_SENI': ['Melukis sederhana','Musik ritmis','Tari kreasi','Kerajinan tangan'],
  '4_SENI': ['Seni rupa daerah','Alat musik tradisional','Tari daerah','Batik sederhana'],
  '5_SENI': ['Desain & ilustrasi','Ansambel musik','Koreografi dasar','Kerajinan tekstil'],
  '6_SENI': ['Pameran karya','Pertunjukan musik','Drama & pentas seni','Kerajinan kreatif'],

  '1_PJOK': ['Gerak dasar locomotor','Permainan tradisional','Kebersihan diri','Keselamatan diri'],
  '2_PJOK': ['Gerak dasar non-locomotor','Olahraga sederhana','Pola hidup sehat','Istirahat & tidur'],
  '3_PJOK': ['Permainan bola kecil','Renang dasar','Kebugaran jasmani','Pertolongan pertama'],
  '4_PJOK': ['Permainan bola besar','Atletik dasar','Senam lantai','Gizi & kesehatan'],
  '5_PJOK': ['Bola basket & voli','Renang gaya bebas','Senam irama','Pencegahan penyakit'],
  '6_PJOK': ['Olahraga pilihan','Kebugaran fisik','P3K','Persiapan fisik remaja'],

  '1_ENGLISH': ['Greetings','Numbers 1-20','Colors & shapes','Family members'],
  '2_ENGLISH': ['Animals & plants','Daily activities','Days & months','Simple sentences'],
  '3_ENGLISH': ['My school','Food & drinks','Present tense','Simple questions'],
  '4_ENGLISH': ['Hobbies & sports','Past tense','Reading comprehension','Writing simple paragraphs'],
  '5_ENGLISH': ['Narrative text','Descriptive text','Modal verbs','Dialogue & conversation'],
  '6_ENGLISH': ['Procedure text','Report text','Future tense','Public speaking basics'],
}

export function getTopics(grade: number, subject: string): string[] {
  return topics[`${grade}_${subject}`] ?? []
}

export const SUBJECTS = ['PANCASILA','B_INDO','MTK','ENGLISH','IPA','IPS','AGAMA','SENI','PJOK']

export const SUBJECT_LABELS: Record<string, string> = {
  PANCASILA: 'Pend. Pancasila',
  B_INDO:    'Bahasa Indonesia',
  MTK:       'Matematika',
  ENGLISH:   'Bahasa Inggris',
  IPA:       'IPA',
  IPS:       'IPS',
  AGAMA:     'Pend. Agama',
  SENI:      'Seni Budaya',
  PJOK:      'PJOK',
}

export const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Senin', TUESDAY: 'Selasa', WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis', FRIDAY: 'Jumat',
}
