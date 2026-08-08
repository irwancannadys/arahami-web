# Arahami Web — Development Progress

> Created: Agustus 2026
> Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Firebase

---

## Legend
- ✅ Done
- 🔶 Partial / In Progress
- ❌ Todo

---

## Setup & Foundation
| Item | Status |
|---|---|
| Next.js 14 App Router + TypeScript | ✅ |
| Tailwind CSS | ✅ |
| shadcn/ui | ✅ |
| Firebase SDK (Auth + Firestore) | ❌ |
| Firebase config + env | ❌ |
| Folder structure | ❌ |
| Design system (warna, font) — sesuai mobile | ❌ |
| Auth middleware (protected routes) | ❌ |

---

## Auth & Onboarding
| Screen | Status | Notes |
|---|---|---|
| Landing page | ❌ | |
| Login Google (Firebase Auth) | ❌ | Same Firebase project as mobile |
| Onboarding Step 1 — Profil Anak | ❌ | |
| Onboarding Step 2 — Jadwal Mapel | ❌ | |
| Onboarding Step 3 — Sumber Topik | ❌ | |
| Onboarding Step 4 — Centang Topik | ❌ | |
| Onboarding Step 5 — Konfirmasi | ❌ | |
| Onboarding Step 6 — Selesai + Kode Anak | ❌ | |

---

## Dashboard Parent
| Screen | Status | Notes |
|---|---|---|
| Layout dashboard (sidebar + main) | ❌ | Instagram-style |
| Tab Beranda — overview anak | ❌ | |
| **Tab Laporan** — hasil kuis + progress | ❌ | Grafik mingguan/bulanan |
| **Tab Pesan** — kirim pesan ke anak | ❌ | Thread + Chat, pakai CommunicationRepository |
| **Tab Reward** — approve/tolak hadiah | ❌ | KRITIS — mobile reward loop belum selesai tanpa ini |
| Tab Pengaturan — edit jadwal, topik | ❌ | |

---

## Settings
| Screen | Status | Notes |
|---|---|---|
| Edit Profil Anak | ❌ | |
| Edit Jadwal Mapel (custom per hari) | ❌ | P1 — belum ada di mobile settings |
| Manage Topik | ❌ | |
| Kode Anak — generate + share | ❌ | |
| Tambah Anak | ❌ | |
| Setting Reward (rules/limits) | ❌ | |

---

## Reward Flow
| Item | Status | Notes |
|---|---|---|
| List reward request masuk | ❌ | |
| Approve reward + kirim notif ke anak | ❌ | Update Firestore status → FCM |
| Tolak reward + alasan | ❌ | |
| Riwayat reward | ❌ | |

---

## Laporan
| Item | Status | Notes |
|---|---|---|
| Overview harian — mapel selesai, skor | ❌ | |
| Detail per kuis (rincian soal) | ❌ | |
| Grafik mingguan XP + streak | ❌ | |
| Grafik bulanan progress | ❌ | |
| Filter per mapel / per periode | ❌ | |

---

## Komunikasi
| Item | Status | Notes |
|---|---|---|
| Thread — kirim kabar/pengumuman ke anak | ❌ | ThreadMessage collection |
| Thread — lihat balasan anak | ❌ | |
| Chat — kirim pesan real-time | ❌ | ChatMessage collection |
| Chat — baca balasan anak | ❌ | |

---

## Plan Step by Step

| Step | Item | Status |
|---|---|---|
| 1 | Firebase setup + env + config | ❌ Next |
| 2 | Auth — Google Sign-In + protected routes | ❌ |
| 3 | Layout dashboard + design system | ❌ |
| 4 | Onboarding flow (6 step) | ❌ |
| 5 | Tab Beranda — overview | ❌ |
| 6 | **Reward approve/tolak** | ❌ |
| 7 | Tab Laporan (harian + grafik) | ❌ |
| 8 | Tab Pesan (Thread + Chat) | ❌ |
| 9 | Tab Pengaturan | ❌ |
| 10 | FCM — notifikasi ke anak dari web | ❌ |

---

## Data Flow — Mobile ↔ Web

```
FIREBASE FIRESTORE (shared)
  ↓ write               ↓ read/write
Mobile (Child)         Web (Parent)
- Kuis selesai     →   Lihat laporan
- Minta hadiah     →   Approve/tolak
- Kirim chat       →   Baca + balas
- Baca thread      ←   Kirim thread
```

Semua data real-time via Firestore listeners di kedua platform.

---

## Design System

Mengikuti mobile app — Instagram-style untuk ortu:
- **Primary:** #0095F6 (biru)
- **Background:** #FAFAFA
- **Border:** #DBDBDB  
- **Text Primary:** #0A0A0A
- **Text Secondary:** #737373
- **Font:** Inter (web equivalent of Nunito)
