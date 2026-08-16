# Arahami Web — Development Progress

> Created: Agustus 2026
> Last updated: Agustus 2026 (session 18)
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
| **16** | **FCM Pesan — parent kirim kabar/chat → child notif + balasan child → parent notif** | ❌ Plan dulu |
| **17** | **Deploy OCR service ke Railway** | ❌ |
| **18** | **Mobile integration — Android hit web API routes** | ❌ |

---

## Phase AI (Web side)
| Item | Status |
|---|---|
| AI provider text: Groq llama-3.3-70b | ✅ |
| `/api/ai/generate-topics` | ✅ |
| `/api/ai/generate-quiz` | ✅ |
| `/api/ai/generate-tips` — Parenting Tips Feed harian | ✅ |
| `/api/ai/analyze-photo` — OCR pipeline | 🔶 lokal selesai, Railway pending |
| OCR stack: Python FastAPI + PaddleOCR + OpenCV | ✅ lokal |
| Deploy OCR ke Railway | ❌ |

---

## ⚠️ Known Issues / Tech Debt
| Item | Priority |
|---|---|
| API secret `arahami-secret-2026` hardcoded di client | 🔴 Fix sebelum production — pindah ke env var |
| Detail sesi kuis (teks soal + jawaban anak + jawaban benar) tidak tersedia | 🔴 Android hanya simpan `answers: ["CORRECT","WRONG",...]` ke Firestore. Perlu update Android agar simpan `{ questionText, userAnswer, correctAnswer, isCorrect }[]` per soal. Web modal sudah siap menampilkan jika data ada. |
| Kelas 6 MTK kadang generate topik tidak relevan | 🟡 Minor |
| `ind.traineddata` perlu di-gitignore | 🟢 Cleanup |

---

## ⚠️ Mobile — Dikerjakan setelah web selesai
| Item | Catatan |
|---|---|
| Android: lepas parent mode — web take over sepenuhnya | Mode ortu di Android diarahkan ke web |
| Android: swap `QuizRepositoryDummy` → `QuizRepositoryImpl` | Hit `/api/ai/generate-quiz` di Vercel |
| Android: `OnboardingViewModel` → hit `/api/ai/generate-topics` | Ganti dari hardcoded CurriculumData |
| Android: tambah `x-api-secret` header di setiap request | Nilai dari env, bukan hardcoded |
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
