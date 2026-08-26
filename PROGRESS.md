# Arahami Web — Development Progress

> Created: Agustus 2026
> Last updated: 2026-08-26 (session 23 — Firestore composite index buat query topics, sisanya di ANDROID_PHASE2.md. OCR/Railway masih pending)
> Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Firebase · Groq AI

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
| Auth — Google Sign-In + protected routes | ✅ |
| AuthProvider context | ✅ |
| ChildContext — global selected child | ✅ |
| ChildSwitcher component — seragam dengan period filter | ✅ |
| lib/theme.ts — themeEmoji + themeGradient (handle format web & Android) | ✅ |

---

## Auth & Onboarding
| Screen | Status | Notes |
|---|---|---|
| Login Google (Firebase Auth) | ✅ | `initializeAuth` + `browserLocalPersistence` + `browserPopupRedirectResolver` — fix IndexedDB bug Firebase 12+ |
| Back navigation disabled di /login | ✅ | `useNoBackNavigation` hook — popstate guard |
| Onboarding Step 1 — Profil Anak | ✅ | Nama, kelas, gender, tema |
| Onboarding Step 2 — Jadwal Mapel | ✅ | Tabs per hari, min 2 mapel/hari, custom subject |
| Onboarding Step 3 — Path A: Kurikulum Merdeka | ✅ | AI Groq, loading dialog, fallback hardcoded |
| Onboarding Step 3 — Path B: Foto Buku | 🔶 | UI + OCR pipeline lokal selesai — Railway deploy pending |
| Onboarding Step 4 — Centang Topik | ✅ | Kurikulum per kelas, manual input |
| Onboarding Step 5 — Konfirmasi | ✅ | Edit buttons per section |
| Onboarding Step 6 — Selesai + Kode Anak | ✅ | 4-digit code + copy |

---

## Dashboard Parent
| Screen | Status | Notes |
|---|---|---|
| Layout dashboard (sidebar + main) | ✅ | |
| Back navigation disabled di semua dashboard pages | ✅ | `useNoBackNavigation` di layout — user tidak bisa back ke /login atau Google auth pages |
| Sidebar — list semua anak (clickable switch) | ✅ | Redesign dari pills ke list |
| Tab Beranda — multi-child card grid | ✅ | Card per anak: last session, topik progress, streak subtle, pending rewards |
| Tab Beranda — realtime pending rewards per anak | ✅ | onSnapshot per child |
| Tab Beranda — Parenting Tips Feed | ✅ | AI Groq + Firestore daily cache (`tips/{YYYY-MM-DD}`), skeleton loading, error state + retry |
| Login page redesign | ✅ | Split layout: left brand panel (gradient + logo besar) + right form |
| Sidebar logo + parent identity | ✅ | Text logo + parent name + "Parent's Mode" card |
| Belajar Weekend per anak | ✅ | Toggle di Tab Jadwal, jadwal Sabtu/Minggu terpisah, validasi (≥2 weekday, ≥1 weekend), dialog konfirmasi OFF, warning topik kosong di Tab Topik |
| Redirect ke /onboarding kalau belum ada anak | ✅ | |
| Tab Laporan — hasil kuis + chart + filter | ✅ | Real Firestore, Recharts, period filter + ChildSwitcher |
| Tab Laporan — detail per sesi (modal) | 🔶 | Modal klik session card → skor, benar/salah per soal. Teks soal + jawaban anak pending (butuh update data model Android — lihat Known Issues) |
| Tab Reward — approve/tolak hadiah | ✅ | Real Firestore, modal detail, session lazy fetch |
| Tab Pesan — Kabar + Chat | ✅ | Real Firestore, onSnapshot threads + chats |
| Tab Pengaturan | ✅ | Menu → pilih anak → tabbed edit (lihat Settings) |
| ChildSwitcher di Laporan/Reward/Pesan | ✅ | Sejajar title, style seragam filter |

---

## Settings (Tab Pengaturan)
| Screen | Status | Notes |
|---|---|---|
| Menu utama Pengaturan | ✅ | Edit Anak + Tambah Anak |
| Pilih anak yang akan diedit | ✅ | List semua anak → klik → tabbed edit |
| Tab Profil — Edit nama, kelas, gender, tema | ✅ | Ganti kelas → auto-clear + regenerate topik via AI |
| Tab Jadwal — Edit mapel per hari | ✅ | Confirmation dialog jika hapus mapel yang ada topik |
| Tab Topik — Kelola topik kuis | ✅ | Add via AI per mapel / manual, delete per topik |
| Tab Kode Anak | ✅ | Display childCode + copy |
| Tab Setting Reward | ✅ | 20 preset toggle → simpan enabledRewards[] ke Firestore |
| Tambah Anak | ✅ | Redirect ke /onboarding |

---

## Reward Flow
| Item | Status |
|---|---|
| List reward request (PENDING/APPROVED/REJECTED) | ✅ |
| Approve + optional note ke anak | ✅ |
| Tolak + alasan | ✅ |
| Detail kuis yang menghasilkan reward | ✅ |

---

## Laporan
| Item | Status |
|---|---|
| Stat cards: total kuis, rata-rata skor, total XP | ✅ |
| Grafik XP harian (7 hari) — Recharts bar chart | ✅ |
| Progress topik per mapel (progress bar) | ✅ |
| Riwayat kuis (session cards, clickable) | ✅ |
| Filter periode (7 Hari / 30 Hari / Semua) | ✅ |
| Filter anak (ChildSwitcher) | ✅ |
| Detail per kuis — benar/salah per soal (modal) | ✅ |
| Detail per kuis — teks soal + jawaban anak + jawaban benar | ❌ Blocked: butuh update data model Android (lihat Known Issues) |

---

## Komunikasi (Tab Pesan)
| Item | Status |
|---|---|
| Kabar — kirim pengumuman ke anak | ✅ |
| Kabar — tampil thread + reply anak | ✅ |
| Chat — realtime messaging | ✅ |
| Chat — unread badge | ✅ |

---

## Plan Step by Step
| Step | Item | Status |
|---|---|---|
| 1 | Firebase setup + env + config | ✅ |
| 2 | Auth — Google Sign-In + protected routes | ✅ |
| 3 | Layout dashboard + design system | ✅ |
| 4 | Onboarding flow (6 step) | ✅ |
| 4b | AI Path A — Kurikulum Merdeka (Groq) | ✅ |
| 4c | Foto Buku Path B — UI + Python OCR service (lokal) | ✅ |
| 5 | Tab Beranda — multi-child grid + activity cards | ✅ |
| 6 | Tab Reward — approve/tolak real Firestore | ✅ |
| 7 | Tab Laporan — chart + history + filter | ✅ |
| 8 | Tab Pesan — Kabar + Chat real Firestore | ✅ |
| 9 | Tab Pengaturan — full (menu → child picker → tabbed edit) | ✅ |
| 10 | Multi-child UX — ChildSwitcher + sidebar list + Beranda grid | ✅ |
| 11 | Parenting Tips Feed — UI + AI Groq + Firestore daily cache | ✅ |
| 12 | Detail sesi kuis — modal benar/salah per soal | ✅ |
| 13 | FCM Foundation — service worker, token registration, Admin SDK, API route | ✅ |
| 14 | FCM Reward — parent approve/tolak → child dapat notif | ✅ |
| 15 | FCM Kuis — anak selesai kuis → parent dapat notif (Firestore listener) | ✅ |
| 16 | FCM Pesan — parent kirim kabar/chat/reply → child notif | ✅ |
| 17 | UI Polish — login redesign (split layout, logo besar), sidebar logo + parent card | ✅ |
| 18 | Belajar Weekend — toggle per anak, jadwal Sabtu/Minggu, validasi, warning topik kosong | ✅ |
| 19 | Generate quiz prompt improvement — chain-of-thought, grade hints, temperature 0.3 | ✅ |
| 20 | Security hardening — Firestore Rules scoped + API secret → Firebase ID Token (4/5 routes) | ✅ |
| 21 | Fix Groq model deprecated (`llama-3.3-70b-versatile` → `openai/gpt-oss-120b`) | ✅ |
| 22 | Deploy OCR service ke Railway | 🔶 File prep selesai (`requirements.txt` pinned, `Procfile`, `.python-version`) — belum di-deploy |
| 23 | Setup Vercel project + env vars + first deploy | ✅ Live di `arahami-web.vercel.app` |
| 24 | Fix `firebase-admin`/`jose` ESM crash di Vercel production (`generate-topics`/`analyze-photo`/`generate-tips`/`notifications/send` sempat 500 terus di production meski aman di lokal) | ✅ Fix: pin `jose@4.15.9` via `overrides` di `package.json` — lihat detail di bawah |
| 25 | Mobile integration — Android hit web API routes | ❌ |
| 26 | Firestore composite index buat query `topics` (`whereEqualTo("subject")` + `orderBy("order")`) — index-nya belum pernah dibuat sejak awal, bikin Android Home gagal load mapel hari ini (error ke-swallow, keliatannya kayak "jadwal kosong" padahal query-nya nge-crash) | ✅ Deploy via `firestore.indexes.json` + `firebase deploy --only firestore:indexes` (checked-in, bukan klik manual di console) |

---

## Phase AI (Web side)
| Item | Status |
|---|---|
| AI provider text: Groq `openai/gpt-oss-120b` (ganti dari `llama-3.3-70b-versatile` yang di-retire Groq, 2026-08-23) | ✅ |
| `/api/ai/generate-topics` | ✅ auth: Firebase ID Token |
| `/api/ai/generate-quiz` | ✅ auth: shared secret (dipanggil Android, belum ada identitas Firebase — lihat Known Issues) |
| `/api/ai/generate-tips` — Parenting Tips Feed harian | ✅ auth: Firebase ID Token |
| `/api/ai/analyze-photo` — OCR pipeline | 🔶 kode + auth (ID Token) selesai, model vision (OpenRouter) masih aktif — Railway deploy pending |
| OCR stack: Python FastAPI + PaddleOCR + OpenCV | ✅ lokal, deploy-ready (requirements pinned, Procfile, .python-version) |
| Deploy OCR service — platform hosting | ❌ **Belum putus** — Railway trial abis (butuh upgrade $5/bln). Riset alternatif (2026-08-23): DigitalOcean App Platform $5/bln (basic-xxs, brand lebih established) vs Railway $5/bln (project udah ada, tinggal upgrade) vs Render $7/bln vs Fly.io realistanya $8-25/bln. ⚠️ Perlu dicek: tier RAM termurah (512MB) mungkin kurang buat PaddleOCR, belum ditest langsung. Konfirmasi: foto TIDAK disimpan di Firebase Storage maupun di service-nya sendiri (cuma numpang lewat pas diproses) — jadi gak ada storage cost/bloat, keputusan platform murni soal compute (RAM/CPU) doang. |
| Vision model OpenRouter (`generateTextWithImage` di `lib/gemini.ts`) | ⚠️ Dead code — sengaja gak dipake (OpenRouter berpotensi berbayar), makanya pendekatan Python OCR (self-hosted, gratis) yang dipilih. Boleh dihapus kapan-kapan sebagai cleanup, gak urgent. |

---

## ⚠️ Known Issues / Tech Debt
| Item | Priority |
|---|---|
| ~~API secret `arahami-secret-2026` hardcoded di client~~ | ✅ Fixed 2026-08-23 — 4 route parent-facing pindah ke Firebase ID Token, secret literal dihapus dari semua client call site |
| `generate-quiz` masih pakai shared-secret (`API_SECRET`) | 🟡 Residual risk — dipanggil Android yang belum punya identitas Firebase (login masih 4-digit code tanpa Auth). Baru bisa dibenerin total kalau Android migrasi ke Firebase Custom Auth Token (child tetap input 4-digit code, tapi backend-nya mint custom token — lihat catatan di Android `ANDROID_PHASE2.md`/plan session 2026-08-23). Sampai itu terjadi, seseorang yang nemu secret ini cuma bisa boros-in kuota Groq, TIDAK bisa akses data. |
| Firestore Rules baru di-scope, belum 100% aman untuk child subtree | 🟡 Sama akar masalah dengan di atas — `/children/{childId}/**` masih `allow read, write: if true` karena Android child login gak punya `request.auth`. Parent data (`/users/{uid}`) sudah dikunci penuh ke owner. |
| Detail sesi kuis (teks soal + jawaban anak + jawaban benar) tidak tersedia | 🔴 Android hanya simpan `answers: ["CORRECT","WRONG",...]` ke Firestore. Perlu update Android agar simpan `{ questionText, userAnswer, correctAnswer, isCorrect }[]` per soal. Web modal sudah siap menampilkan jika data ada. |
| Kelas 6 MTK kadang generate topik tidak relevan | 🟡 Minor |
| `ind.traineddata` perlu di-gitignore | ✅ Sudah di-`.gitignore`, gak pernah ke-commit — false alarm, dicek ulang 2026-08-22 |
| Kualitas konten `openai/gpt-oss-120b` (Bahasa Indonesia) belum di-evaluasi mendalam | 🟡 Cuma dicek format JSON valid, belum baca kualitas isi tips/topik secara teliti |
| ~~`firebase-admin`/`jose` ESM crash di production~~ | ✅ Fixed 2026-08-23 — `verifyIdToken()` (dipakai `checkAuth`) crash `ERR_REQUIRE_ESM` di Vercel meski jalan normal di `next dev`/`next build`+`next start` lokal. Sebab: `jwks-rsa` (dependency `firebase-admin/auth`) pakai `require('jose')`, tapi `jose@6.x` pure ESM. `serverExternalPackages: ['firebase-admin']` doang TIDAK cukup. Fix final: pin `"overrides": { "jose": "4.15.9" }` di `package.json` (versi terakhir yang masih ada build CJS). Verifikasi paling akurat: cek `.next/server/app/api/<route>/route.js.nft.json` — harus nunjuk ke `jose/dist/node/cjs/index.js`, bukan `dist/webapi/index.js`. |

---

## ⚠️ Mobile — Dikerjakan setelah web selesai
| Item | Catatan |
|---|---|
| Android: lepas parent mode — web take over sepenuhnya | Mode ortu di Android diarahkan ke web |
| Android: swap `QuizRepositoryDummy` → `QuizRepositoryImpl` | Hit `/api/ai/generate-quiz` di Vercel |
| Android: `OnboardingViewModel` → hit `/api/ai/generate-topics` | Ganti dari hardcoded CurriculumData |
| Android: tambah `x-api-secret` header (cuma untuk `generate-quiz`, 4 route lain sekarang pakai Firebase ID Token) | Nilai dari env (`BuildConfig.API_SECRET`), bukan hardcoded — sudah begini di Android |
| Android: Foto Buku → call Python OCR service (Railway URL) | Setelah Railway deploy |
| Android: baca `enabledRewards[]` dari child doc untuk filter preset reward | Agar Setting Reward di web efektif |
| Android: update QuizSession Firestore — simpan detail per soal | Fix agar web bisa tampilkan teks soal + jawaban di detail sesi |

---

## 🔮 Planned Features

### FCM Push Notifications
| Notifikasi | Trigger | Status |
|---|---|---|
| Parent approve reward → child notif | Web (reward page) | ✅ |
| Parent tolak reward → child notif | Web (reward page) | ✅ |
| Anak selesai kuis → parent notif | Firestore listener (dashboard layout) | ✅ |
| Parent kirim kabar → child notif | Web (pesan page) | ❌ Plan dulu |
| Parent kirim chat → child notif | Web (pesan page) | ❌ Plan dulu |
| Anak reply kabar → parent notif | Android trigger | ❌ Defer Android |
| Anak kirim chat → parent notif | Android trigger | ❌ Defer Android |
| Anak request reward → parent notif | Android trigger | ❌ Defer Android |

### Tema Favorit — Theme-aware UI
- Warna aksen di Laporan/Reward/Pesan berubah sesuai tema anak yang dipilih
- Sudah ada `themeGradient()` di `lib/theme.ts` — tinggal diaplikasikan
- **Status:** ❌ Todo

---

## Design System Reference
| Token | Value |
|---|---|
| Primary | `#0095F6` |
| Primary Dark | `#0074CC` |
| Primary Light | `#E0F2FE` |
| Background | `#F5F7FA` |
| Surface | `#FFFFFF` |
| Border | `#DBDBDB` / `#E8EAF0` |
| Text Primary | `#0A0A0A` |
| Text Secondary | `#737373` / `#9CA3AF` |
| Success | `#22C55E` |
| Error | `#EF4444` |
| XP Gold | `#FBBF24` |
| Font | Nunito (400/500/600/700/800) |
| Subject colors | MTK `#8B5CF6` · B_INDO `#0095F6` · IPA `#22C55E` · IPS `#F59E0B` · AGAMA `#7C3AED` · SENI `#EC4899` · PJOK `#F97316` |
