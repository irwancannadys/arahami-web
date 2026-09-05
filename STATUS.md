# Arahami — Project Status

> Last updated: 2026-09-06
> File ini satu-satunya sumber status project (gabungan Android + Web, dua repo terpisah, konten identik di keduanya). Untuk arsitektur/konvensi teknis lihat `CLAUDE.md` (Android) / `AGENTS.md` (Web). Untuk konsep produk awal lihat `KONSEP.md`.

---

## 0. Gambaran Platform

| Platform | Repo | Peran |
|---|---|---|
| **Android** | `Arahami` | **Mode Anak doang** — login PIN, kuis, hasil, achievement, reward request, pesan. Tidak ada UI ortu sama sekali. |
| **Web** | `arahami-web` | **Mode Ortu doang** — onboarding, dashboard (beranda/laporan/reward/pesan/pengaturan). Live di `arahami-web.vercel.app`. |

Backend sepenuhnya shared: **Firebase** (Auth, Firestore, FCM) + **AI Groq** (`openai/gpt-oss-120b`) dipanggil lewat Next.js API routes di web (Android hit endpoint yang sama, bukan Cloud Functions).

---

## 1. ✅ Done

### Android — Mode Anak
- Login PIN 4-digit (dua panel tablet, animasi "login duo", FCM token + Firebase Anonymous Auth abis login)
- Home: Status Card (ring progress + streak/level/XP), Quick Actions, badge notif real (Pesan/Hadiah/Pencapaian), jadwal weekend/holiday
- Quiz: 4 tipe soal (Multiple Choice, True/False, Tap Image + Drag Drop placeholder), TTS "Bacain soalnya" (Android TextToSpeech offline id-ID), timer, animasi slide dua panel
- QuizResult: score ring, bintang, XP, rincian jawaban per soal
- Achievement: badge wall (10 badge statis + "Master [Mapel]" dinamis)
- RewardRequest: preset grid (filter `enabledRewards` dari web) + custom text
- MessageChild: Kabar + Chat, Tab Switcher dengan transisi animasi
- Gamifikasi (XP/level/streak/totalQuizzes/perfectScores) persist server-side via Firestore transaction
- AI generate-quiz **real**, auth Firebase Anonymous Auth + Bearer ID Token (bukan shared-secret lagi)
- FCM: token registration + notifikasi foreground
- Parent mode (`ui/parent/*`, `ui/modeselect/*`) **dihapus total** — udah gak ada jejak di Android
- **Progress Belajar (topic pacing manual)** — `Topic.isUnlocked` (default `true`), ortu toggle per topik di web. Bottom sheet pilih topik: topik yang di-uncentang ortu **tetap keliatan** (fair, anak tau ke depannya bakal belajar apa) tapi abu-abu + ikon gembok, non-interactive. Halaman baru `ui/child/progress/ProgressBelajarScreen` — progress per mapel per hari (tab hari Senin–Minggu/weekend, grid 3-kolom niru `SubjectGrid` Home), entry point tile ke-4 di `HomeChildQuickActionsRow`. Home grid "susulan": mapel yang belum kelar dari hari sebelumnya numpang tampil hari ini juga (selama masih ada topik `isUnlocked` & belum `isDone`), ditandai strip section "↩ Susulan" nempel di tepi bawah kartu (bg ungu muda), ring progress "hari ini" tetap cuma ngitung mapel yang emang dijadwalin hari itu

### Web — Mode Ortu
- Login Google Sign-In + protected routes
- Onboarding 6 step (profil, jadwal, sumber topik AI/foto, centang topik, konfirmasi, kode anak)
- Dashboard: Beranda (multi-child grid, pending rewards realtime, Parenting Tips Feed AI), Laporan (chart + histori + filter + detail per soal), Reward (approve/tolak + note), Pesan (Kabar + Chat realtime), Pengaturan (edit anak lengkap + Setting Reward 20 preset)
- Belajar Weekend per anak (toggle + jadwal Sabtu/Minggu + validasi)
- FCM: reward approve/tolak → anak, kuis selesai → ortu
- Live di Vercel, build production bersih
- **Progress Belajar** — menu baru di Pengaturan (sejajar Edit Anak/Tambah Anak, bukan tab nempel), alur Pilih Anak → checklist topik per mapel. Staged-changes di state lokal dulu (`pending`), baru `writeBatch` sekali pas Simpan (hindari race condition), tombol Simpan/Batal selalu keliatan (disabled kalau gak ada perubahan), dialog konfirmasi & validasi custom (bukan `alert()`/`confirm()` bawaan browser), validasi block kalau mau uncheck topik terakhir yang tercentang di satu mapel
- Loading states dibenerin merata — Beranda sempet bolong total (skeleton Tips Parenting section gak ada sama sekali di branch `isLoading`), tombol Reward (Setujui/Tolak) & Logout & upload topik sekarang pakai spinner + teks asli (bukan ganti jadi teks lain), copy kode anak dikasih feedback "✓ Tersalin!"

### Integrasi Android ↔ Web (yang paling sering jadi sumber bug, semua udah beres)
- **Detail sesi kuis** — Android simpan `{questionText, userAnswer, correctAnswer, correct}[]` per soal ke Firestore, field name match persis sama tipe TypeScript web, modal Laporan udah nampilin
- **enabledRewards** — Android baca dari child doc, filter preset reward sesuai yang di-toggle ortu di web
- **Auth API AI** — 5 route (`generate-quiz`, `generate-topics`, `generate-tips`, `analyze-photo`, `notifications/send`) semua konsisten pakai Firebase ID Token via `checkAuth`, tidak ada lagi shared-secret `x-api-secret`
- **`@DocumentId` id integrity** — `Child`/`Topic`/`Schedule.id` dulu balik kosong gara-gara SDK buang field ber-anotasi `@DocumentId` pas nulis; fix: id dipaksa dari `doc.id`/path di titik baca, bukan dari field literal
- **Firestore composite index** untuk query `topics` (`subject` + `order`) — sempet bikin Android Home "jadwal kosong" palsu (error ke-swallow), sekarang deploy via `firestore.indexes.json` (checked-in)

---

## 2. 🔶 In Progress / Partial

| Item | Status |
|---|---|
| Foto Buku (OCR) — kamera → extract topik | Kode + auth selesai (Python FastAPI + PaddleOCR lokal, deploy-ready). **Platform hosting belum diputusin** — Railway trial abis ($5/bln upgrade), lagi dibandingin sama DigitalOcean/Render/Fly.io. Belum ada yang nge-block fitur lain, cuma fitur ini sendiri nonaktif sampai deploy. |

---

## 3. ❌ Pending / Todo

Urut prioritas:

| # | Item | Platform | Catatan |
|---|---|---|---|
| 1 | **Firestore Security Rules masih `allow read, write: if true`** | Shared | 🔴 Kritikal sebelum production. Anonymous Auth Android belum otomatis benerin ini — UID anonymous gak terikat ke `childId` tertentu, jadi rules gak bisa langsung scope pakai `request.auth.uid`. Butuh desain terpisah (misal custom claims childId↔UID). Data parent (`/users/{uid}`) sudah aman, yang belum ini subtree `/children/{childId}/**`. **Sengaja dibiarin dulu per keputusan user (2026-09-04).** |
| 2 | Deploy OCR service ke hosting | Web | Keputusan platform pending (lihat §2) |
| 3 | Phone-specific layout: QuizResult, RewardRequest, MessageChild | Android | Sekarang passthrough ke layout tablet di HP — fungsional, belum optimal. (Home/Quiz/Login sudah punya layout HP proper, jangan disamain sama 3 ini) |
| 4 | Quiz — Drag & Drop | Android | Ditunda, AI belum generate tipe soal ini (nampilin placeholder "segera hadir" kalau ke-trigger) |
| 5 | Tema Favorit (theme-aware UI di Laporan/Reward/Pesan) | Web | `themeGradient()` udah ada di `lib/theme.ts`, tinggal diaplikasikan |
| 6 | FCM: Parent kirim kabar/chat → notif ke anak | Web | Belum di-plan detail |
| 7 | FCM: Anak reply/chat/request reward → notif ke ortu | Android | Defer |
| 8 | Sound effect (SFX tap/klik, di luar TTS) | Android | Post-MVP, low priority |

---

## 4. Fix Terakhir

### Sesi 2026-09-06
- **Android** — Bug dari testing device/emulator asli buat halaman `ProgressBelajarScreen`: kartu per-mapel kegedean (`aspectRatio(1f)` maksa kotak penuh di grid 3-kolom, banyak ruang kosong) — dihapus, layout diganti `Row` (icon sejajar nama, bukan numpuk) biar tinggi ngikutin konten. Font kekecilan di tab hari (13sp→17sp) & kartu mapel (15sp→18sp) dibesarin.
- **Android** — Susulan footer strip di Home (`SubjectGridCard`) di-porting dari mockup ke kode asli: sebelumnya masih nempel teks inline di subtitle ("↩ Susulan · N topik"), sekarang jadi strip section sendiri nempel di tepi bawah kartu (bg ungu muda, teks "↩ Susulan" doang), kartu tetap tinggi 200dp.
- **Android** — Label Home "Yuk Belajar Hari Ini! 📚" dibesarin & bold (22sp ExtraBold, warna teks utama) biar lebih menarik, casing diganti dari ALL CAPS ke Title Case.

### Sesi 2026-09-04
- **Android** — Card test TTS ("Bacain soalnya" tanpa lewat Quiz) di `HomeChildScreen.kt` ternyata gak di-gate `BuildConfig.DEBUG`, ikut nempel di APK **release/production**. Sudah dihapus total + 8 import unused ikut dibersihin.
- **Android** — `.kotlin/` build cache dulu sempet ke-track di git (3 file cache nyempil). Sudah di-`.gitignore` + untrack.

---

## 5. Known Issues / Tech Debt (minor, gak urgent)

- **Web eslint** — `ocr-service/venv/` (virtualenv Python) belum di-exclude dari `eslint.config.mjs`, bikin `npm run lint` lokal nunjukin puluhan error palsu dari file vendor. Gak ngaruh ke `next build`/deploy.
- **Web `laporan/page.tsx:304`** — `Date.now()` dipanggil langsung di render body (bukan di effect/memo), React 19 flag sebagai "impure function during render". Gak crash sekarang, tapi berpotensi masalah kalau nanti React Compiler beneran dipake.
- **Web** — ~20 `no-explicit-any` + beberapa unescaped quote/apostrophe di JSX, kosmetik/type-safety, low priority.
- **Web** — `generateTextWithImage` (OpenRouter vision di `lib/gemini.ts`) dead code, sengaja gak dipake (self-hosted OCR dipilih karena gratis). Boleh dihapus kapan-kapan.
- **Web** — kualitas konten Bahasa Indonesia dari `openai/gpt-oss-120b` belum dievaluasi mendalam (baru dicek format JSON valid). Kelas 6 MTK kadang generate topik kurang relevan.

---

## 6. Ide / Backlog (belum diprioritaskan — dipindah dari `PROGRESS.md` lama biar gak ilang)

| Ide | Platform | Catatan |
|---|---|---|
| Co-parent (Ayah + Bunda) | Web | `Child.parentId` → `guardians: Map<String,String>`. Butuh invite flow, update Firestore rules, switcher UI di Pesan. |
| Komunikasi — emoji reactions di Kabar/Chat | Web + Android | Reactions subcollection di `ThreadMessage` |
| Komunikasi — typing indicator | Web + Android | Presence system (`isTyping` field) |
| Komunikasi — quiz result embed di thread Kabar | Web | Parent share card `QuizSession` langsung di dalam thread |
| Komunikasi — read receipts UI | Web | Data-nya (`ChatMessage.isRead`) udah ada, tinggal bikin UI-nya |
| Design System proper (Card/Button/Dialog/TextField variants) | Web | Rencana lama: dikerjain "setelah child mode selesai" |

---

## 7. Peta Docs

| File | Isi |
|---|---|
| **`STATUS.md`** (file ini, identik di kedua repo) | Status terkini — satu-satunya sumber, gantiin `ANDROID_PHASE2.md`/`PROGRESS.md` yang lama (dihapus 2026-09-04) |
| `CLAUDE.md` (Android) / `AGENTS.md` (Web) | Instruksi agent, arsitektur, konvensi kode — bukan status progress |
| `KONSEP.md` (Android) | Konsep produk awal |
| `app/globals.css` (Web) | Source of truth design tokens (warna/font) — bukan lagi tabel statis di docs |
