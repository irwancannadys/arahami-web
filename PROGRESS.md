# Arahami Web — Development Progress

> Created: Agustus 2026
> Last updated: Agustus 2026 (session 11)
> Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Firebase · Groq AI · Tesseract.js · Sharp

---

## Legend
- ✅ Done
- 🔶 Partial / In Progress
- ❌ Todo

---

## Setup & Foundation
| Item | Status |
|---|---|
| Next.js 16 App Router + TypeScript | ✅ |
| Tailwind CSS v4 | ✅ |
| shadcn/ui | ✅ |
| Firebase SDK (Auth + Firestore) | ✅ |
| Firebase config + env (.env.local) | ✅ |
| Folder structure | ✅ |
| Design system — warna, font Nunito (mirror mobile) | ✅ |
| Auth — Google Sign-In + protected routes (proxy.ts) | ✅ |
| AuthProvider context | ✅ |

---

## Auth & Onboarding
| Screen | Status | Notes |
|---|---|---|
| Login Google (Firebase Auth) | ✅ | setPersistence(browserLocalPersistence) fix IndexedDB |
| Onboarding Step 1 — Profil Anak | ✅ | Nama, kelas, gender, tema |
| Onboarding Step 2 — Jadwal Mapel | ✅ | Tabs per hari, min 2 mapel/hari, custom subject per hari |
| Onboarding Step 3 — Sumber Topik (Path A: Kurikulum Merdeka) | ✅ | AI Groq, loading dialog, fallback hardcoded |
| Onboarding Step 3 — Sumber Topik (Path B: Foto Buku) | 🔶 | UI accordion per mapel + OCR pipeline — in progress |
| Onboarding Step 4 — Centang Topik | ✅ | Kurikulum per kelas, manual input custom subject |
| Onboarding Step 5 — Konfirmasi | ✅ | Edit buttons per section, detail topik per mapel |
| Onboarding Step 6 — Selesai + Kode Anak | ✅ | Generate 4-digit code + copy |
| Bug fix: Step 4 state preserved saat navigasi back/forward | ✅ | |

---

## Dashboard Parent
| Screen | Status | Notes |
|---|---|---|
| Layout dashboard (sidebar + main) | ✅ | Nunito font, warna biru #0095F6 |
| Tab Beranda — child selector + overview | ✅ | Multi-child selector, XP/level/streak |
| Redirect ke /onboarding kalau belum ada anak | ✅ | |
| **Tab Laporan** — hasil kuis + progress | ❌ | |
| **Tab Reward** — approve/tolak hadiah | 🔶 | UI + dummy data selesai, switch ke Firestore next |
| **Tab Pesan** — kirim pesan ke anak | ❌ | |
| Tab Pengaturan | ❌ | |

---

## Settings
| Screen | Status | Notes |
|---|---|---|
| Edit Profil Anak | ❌ | |
| Edit Jadwal Mapel (custom per hari) | ❌ | |
| Manage Topik | ❌ | |
| Kode Anak — generate + share | ❌ | |
| Tambah Anak | ❌ | Onboarding baru |
| Setting Reward | ❌ | |

---

## Reward Flow
| Item | Status |
|---|---|
| List reward request masuk | 🔶 | UI + dummy data, Firestore switch next |
| Approve reward + optional note ke anak | 🔶 | UI selesai, Firestore switch next |
| Tolak reward + alasan | 🔶 | UI selesai, Firestore switch next |
| Riwayat reward (tab Disetujui/Ditolak) | 🔶 | UI selesai |
| Detail kuis yang menghasilkan reward | 🔶 | Tampil mapel, topik, skor di modal |
| Switch ke real Firestore data | ❌ | Ganti useState(DUMMY) → onSnapshot rewardsCol |

---

## Laporan
| Item | Status |
|---|---|
| Overview harian — mapel selesai, skor | ❌ |
| Detail per kuis (rincian soal) | ❌ |
| Grafik mingguan XP + streak | ❌ |
| Filter per mapel / per periode | ❌ |

---

## Komunikasi
| Item | Status |
|---|---|
| Thread — kirim kabar/pengumuman ke anak | ❌ |
| Chat — kirim pesan real-time | ❌ |

---

## Plan Step by Step

| Step | Item | Status |
|---|---|---|
| 1 | Firebase setup + env + config | ✅ |
| 2 | Auth — Google Sign-In + protected routes | ✅ |
| 3 | Layout dashboard + design system | ✅ |
| 4 | Onboarding flow (6 step) + bug fixes | ✅ |
| 4b | AI integrasi onboarding Path A — Kurikulum Merdeka (Groq, loading, fallback) | ✅ |
| **4c** | **Foto Buku Path B — UI accordion + Python OCR service (PaddleOCR + OpenCV + Groq)** | ✅ |
| 5 | Tab Beranda — child selector + overview | ✅ |
| **6** | **Reward — approve/tolak** | 🔶 UI selesai, real data next |
| 7 | Tab Laporan (harian + grafik) | ❌ |
| 8 | Tab Pesan (Thread + Chat) | ❌ |
| 9 | Tab Pengaturan | ❌ |
| 10 | FCM — notifikasi ke anak dari web | ❌ |

### Phase AI (Web side)
| Item | Status | Catatan |
|---|---|---|
| AI provider text: Groq llama-3.3-70b | ✅ | Gratis, no billing |
| AI provider vision: OpenRouter | ❌ Deprecated | Kualitas OCR jelek di semua model free |
| AI provider OCR: Tesseract.js | ❌ Deprecated | Kualitas kurang untuk foto HP — diganti Python PaddleOCR |
| `/api/ai/generate-topics` | ✅ | Seed + AI, smart iteration |
| `/api/ai/generate-quiz` | ✅ | 6 soal MC/TF/TapImage |
| `/api/ai/analyze-photo` — OCR pipeline | 🔶 | Next.js route → call Python FastAPI (PaddleOCR + OpenCV) → Groq parse |
| Smart iteration kelas 4&6 (3x run + curation) | ✅ | Kelas 1-3,5 = 1 run saja |
| Grade hints: KPK/FPB kelas 4, Aljabar/Koordinat kelas 6, IPS kelas 6 | ✅ | |
| Curation fallback jika step ke-4 gagal | ✅ | Pakai run terakhir |
| Grade change clear topics (Bug 3 fix) | ✅ | Ganti kelas → AI dipanggil ulang |
| Min 5 topik per mapel enforced (Bug 1 fix) | ✅ | |
| Onboarding Step 3 Path A: loading dialog + AI call | ✅ | |
| Onboarding Step 4: topics dari AI + fallback hardcoded | ✅ | |
| Onboarding Step 3 Path B: upload foto per mapel (UI) | ✅ | Accordion per mapel, max 4 foto, confirm per card, tips box |
| Onboarding Step 3 Path B: generateTopicsFromPhotos() + loading dialog | ✅ | Loop per mapel, call API, fallback curriculum |
| Onboarding Step 3 Path B: Python OCR Service (FastAPI + PaddleOCR + OpenCV) | ✅ | Lokal: `uvicorn main:app --port 8000`, Railway saat production |
| Onboarding Step 3 Path B: Next.js route → call Python service | ✅ | `PYTHON_OCR_URL` + `OCR_SECRET` env vars |
| Firebase Storage untuk foto buku | ❌ | Tidak dipakai — foto hanya diproses di memory |

### ⚠️ Known Issues / Tech Debt
| Item | Priority |
|---|---|
| API secret `arahami-secret-2026` hardcoded di client (browser-visible) | Perlu di-env-var sebelum production |
| Kelas 6 MTK kadang muncul `Geometri Sederhana` yang tidak perlu | Minor, bisa di-refine seed |
| `ind.traineddata` (Tesseract lang file) perlu di-gitignore | Ada di root, tidak perlu di-commit |

### ✅ Step 4c — Foto Buku OCR Pipeline (Selesai — lokal)

**Stack final yang diputuskan:**
- `Python FastAPI` (monorepo: `ocr-service/`) — OCR service, deploy ke Railway
- `OpenCV (Python)` — preprocessing: grayscale, deskew, adaptive threshold
- `PaddleOCR lang='id'` — OCR engine, menang vs EasyOCR & Tesseract.js di test nyata
- `Groq llama-3.3-70b` — tetap di Next.js, parse raw OCR text → clean topics

**Kenapa bukan Tesseract.js:** Sudah ditest, kualitas jelek untuk foto HP (kata pecah, salah baca).
**Kenapa bukan EasyOCR:** Sudah ditest head-to-head, PaddleOCR menang (tidak ada noise kolom kanan, baca baris utuh).
**Kenapa Python terpisah:** Library OCR terbaik (PaddleOCR) hanya ada di Python ekosistem, tidak support Node.js.

**Sub-step implementasi:**

| Sub-step | Item | Status |
|---|---|---|
| 4c-1 | UI: StepTopicSource accordion per mapel + tips box | ✅ |
| 4c-2 | UI: OnboardingData type + `photosBySubject` + `confirmedSubjects` | ✅ |
| 4c-3 | UI: canNext — semua mapel harus confirmed | ✅ |
| 4c-4 | Client: `generateTopicsFromPhotos()` + loading dialog per mapel | ✅ |
| 4c-5 | Research & test OCR: Tesseract.js → EasyOCR vs PaddleOCR → PaddleOCR menang | ✅ |
| 4c-6 | Python: `ocr-service/preprocess.py` — OpenCV grayscale + deskew + denoise | ✅ |
| 4c-7 | Python: `ocr-service/main.py` — FastAPI /ocr + /health, singleton PaddleOCR | ✅ |
| 4c-8 | Test FastAPI lokal dengan curl + foto nyata | ✅ Hasil: 17 topik bersih |
| 4c-9 | Next.js: `analyze-photo/route.ts` → call Python service → Groq parse | ✅ |
| 4c-10 | Next.js: `PYTHON_OCR_URL` + `OCR_SECRET` di `.env.local` | ✅ |
| 4c-11 | Test end-to-end: browser → Next.js → Python → Groq → topics | ✅ |
| 4c-12 | Cleanup: remove `tesseract.js` dari `package.json` | ✅ |
| 4c-13 | UX: Loading dialog redesign (spinner + TAHAPAN + progress animated + success/error) | ✅ |
| 4c-14 | UX: Confirmation dialog (reuse vs regenerate) saat balik dari Step 5 | ✅ |
| 4c-15 | UX: StepTopics — Select All toggle + manual input semua mapel | ✅ |
| 4c-16 | Deploy Python service ke Railway | ❌ Future (saat production) |

### ⚠️ Mobile — Defer sampai web selesai
| Item | Catatan |
|---|---|
| Android `QuizRepositoryImpl` → hit `/api/ai/generate-quiz` di Vercel | Ganti dari Firebase Functions ke Next.js API route |
| Android `OnboardingViewModel.loadTopicsForStep4()` → hit `/api/ai/generate-topics` | Ganti dari hardcoded CurriculumData |
| Android: tambah `API_SECRET` header di setiap request ke API routes | `x-api-secret: arahami-secret-2026` |
| Perlu update `RepositoryModule.kt`: swap `QuizRepositoryDummy` → `QuizRepositoryImpl` | Setelah Vercel deployed |
| Catatan: Foto Buku di mobile butuh call ke Python OCR service (Railway URL) | Defer sampai web selesai |

---

## 🔮 Future / Notes

### Tema Favorit (Child Theme)
- Saat ini: tersimpan di Firestore (`child.theme`) tapi hanya digunakan sebagai identifier
- **Rencana implementasi di web:**
  - Tampilkan emoji tema di sebelah nama anak (identifikasi visual untuk multi-child)
  - Warna aksen dashboard berubah sesuai tema anak yang sedang dipantau
  - Avatar/icon di laporan dan reward menggunakan icon sesuai tema
- **Tema laki-laki:** ⚽ Sepak Bola · 🤖 Robot · 🎒 Petualang · 🦕 Dinosaurus
- **Tema perempuan:** 👑 Princess · 🐱 Kucing · 🧁 Bakery · 🧜‍♀️ Putri Duyung
- Tema dikunci setelah onboarding (tidak bisa diubah) — sesuai behavior mobile

### Multi-child
- Child selector di Beranda sudah ada (tabs)
- Semua halaman lain (Laporan, Reward, Pesan) perlu child context — akan pakai React Context atau URL param

### Data Sync Mobile ↔ Web
- Semua data real-time via Firestore onSnapshot
- Child writes (quiz, reward request, chat) dari mobile app
- Parent reads + writes (approve reward, send message) dari web

---

## Design System Reference (mirror mobile)

| Token | Value |
|---|---|
| Primary | `#0095F6` (biru) |
| Primary Dark | `#0074CC` |
| Primary Light | `#E0F2FE` |
| Background | `#FAFAFA` |
| Surface | `#FFFFFF` |
| Border | `#DBDBDB` |
| Text Primary | `#0A0A0A` |
| Text Secondary | `#737373` |
| Success | `#22C55E` |
| Error | `#EF4444` |
| XP Gold | `#FBBF24` |
| Font | Nunito (400/500/600/700/800) |
