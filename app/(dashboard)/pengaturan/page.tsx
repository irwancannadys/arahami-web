'use client'

const MENU_ITEMS = [
  { icon: '👤', label: 'Edit Profil Anak',    sub: 'Nama, kelas, gender, tema' },
  { icon: '📅', label: 'Edit Jadwal Mapel',   sub: 'Atur mapel per hari' },
  { icon: '📚', label: 'Kelola Topik',        sub: 'Tambah atau hapus topik kuis' },
  { icon: '🔑', label: 'Kode Anak',           sub: 'Lihat dan salin kode login anak' },
  { icon: '🎁', label: 'Setting Reward',      sub: 'Atur hadiah yang tersedia' },
  { icon: '➕', label: 'Tambah Anak',         sub: 'Daftarkan anak kedua atau ketiga' },
]

export default function PengaturanPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-extrabold text-[22px]">Pengaturan</h1>
        <p className="text-[13px] text-[#737373] mt-0.5">Kelola profil dan preferensi</p>
      </div>

      <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={i}
            className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA] transition-colors text-left"
          >
            <span className="text-[24px] shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px]">{item.label}</p>
              <p className="text-[12px] text-[#737373] mt-0.5">{item.sub}</p>
            </div>
            <span className="text-[#A8A8A8] text-[18px] shrink-0">›</span>
          </button>
        ))}
      </div>

      <p className="text-center text-[12px] text-[#A8A8A8]">
        Fitur pengaturan akan segera hadir 🚧
      </p>
    </div>
  )
}
