# Arahami Web — Development Progress

> Created: Agustus 2026
> Last updated: Agustus 2026
> Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Firebase

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
| Onboarding Step 3 — Sumber Topik | ✅ | AI atau Foto (foto coming soon) |
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
| **Tab Laporan** — hasil kuis + progress | ❌ | Next |
| **Tab Reward** — approve/tolak hadiah | ❌ | KRITIS |
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
| List reward request masuk | ❌ |
| Approve reward + notif ke anak | ❌ |
| Tolak reward + alasan | ❌ |
| Riwayat reward | ❌ |

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
| 5 | Tab Beranda — child selector + overview | ✅ |
| **6** | **Reward — approve/tolak** | ❌ |
| 7 | Tab Laporan (harian + grafik) | ❌ |
| 8 | Tab Pesan (Thread + Chat) | ❌ |
| 9 | Tab Pengaturan | ❌ |
| 10 | FCM — notifikasi ke anak dari web | ❌ |

### Phase AI (Web side)
| Item | Status |
|---|---|
| AI provider: Groq (llama-3.3-70b) — gratis, no billing | ✅ |
| API route `/api/ai/generate-topics` — Kurikulum Merdeka | ✅ |
| API route `/api/ai/generate-quiz` — generate soal kuis | ✅ |
| API route `/api/ai/analyze-photo` — stub (Groq tidak support vision) | 🔶 |
| Onboarding Step 3 Path A: loading dialog + call `generate-topics` | ❌ Next |
| Onboarding Step 3 Path B: upload foto per mapel (semua wajib) + AI analyze | ❌ |
| Onboarding Step 3 Path B: Firebase Storage — simpan foto setelah onboarding | ❌ |
| Onboarding Step 4: tampilkan topik dari AI (bukan hardcoded) | ❌ |

### ⚠️ Mobile — Defer sampai web selesai
| Item | Catatan |
|---|---|
| Android `QuizRepositoryImpl` → hit `/api/ai/generate-quiz` di Vercel | Ganti dari Firebase Functions ke Next.js API route |
| Android `OnboardingViewModel.loadTopicsForStep4()` → hit `/api/ai/generate-topics` | Ganti dari hardcoded CurriculumData |
| Android: tambah `API_SECRET` header di setiap request ke API routes | `x-api-secret: arahami-secret-2026` |
| Perlu update `RepositoryModule.kt`: swap `QuizRepositoryDummy` → `QuizRepositoryImpl` | Setelah Vercel deployed |
| Catatan: Foto Buku di mobile butuh Gemini Vision — defer sampai ada solusi billing | |

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
