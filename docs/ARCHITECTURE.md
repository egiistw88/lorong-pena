# Dokumentasi Arsitektur Sistem

Dokumen ini menjelaskan rancangan arsitektur teknis aplikasi web pembaca novel **"Yakin? — Perjalanan Hidup Zayd"**.

---

## 🏛️ Gambaran Umum Arsitektur

Aplikasi dirancang sebagai *Single Page Application (SPA)* berbasis React 19, TypeScript, dan Tailwind CSS v4, dengan penekanan pada:
1. **Kecepatan & Performa**: Zero external runtime overhead; aset teks di-*bundle* secara efisien oleh Vite.
2. **Offline-First & Local Persistence**: Pembaca dapat membaca secara luring tanpa ketergantungan pada backend server eksternal.
3. **Pemisahan Tegas Data & Presentasi**: Naskah kanon terisolasi dalam struktur data yang terverifikasi tipenya.

```text
[ Berkas Naskah Asli ]
         ↓
 [ src/content/units/*.ts ] ← [ src/content/meta.ts ]
         ↓
 [ App.tsx (Orkestrator Status) ]
   ├── [ src/lib/storage.ts (Preferensi & Progres localStorage) ]
   ├── [ src/lib/readingTime.ts (Hitung Durasi Baca) ]
   └── [ src/lib/useTTSPlayer.ts (Mesin Narasi Web Speech) ]
         ↓
 ┌───────────────────────┬────────────────────────┐
 │   Mode Beranda        │      Mode Membaca      │
 │  (HomeView.tsx)       │   (ReaderView.tsx)     │
 └───────────────────────┴────────────────────────┘
         │                          │
 ┌───────┴──────────────────────────┴─────────────┐
 │ Komponen Global / Penunjang:                   │
 │ - Header.tsx (Indikator Bab & Navigasi)        │
 │ - TableOfContentsModal.tsx (Daftar Isi Kanon)  │
 │ - SettingsDrawer.tsx (Tipografi & Tema Optik)  │
 │ - TTSPlayerBar.tsx (Bilah Pemutar Suara TTS)   │
 │ - ManuscriptImportModal.tsx (Pratinjau Draf)   │
 └────────────────────────────────────────────────┘
```

---

## 💾 Model Data (Types & Schemas)

Definisi model data utama berada di `src/types.ts`:

### 1. `UnitNarasi`
Mewakili satu unit bacaan (Prolog atau Bab tertentu):
- `id`: Pengenal unik (misal: `'prolog'`, `'bab-1-1'`).
- `bagian`: Nomor Bagian buku (0 untuk Prolog, 1 untuk Bagian I, dst.).
- `urutan_dalam_bagian`: Urutan di dalam bagian terkait.
- `urutan_global`: Urutan global (1-indexed).
- `nomor`: Penomoran bab (misal: `'Prolog'`, `'I.1'`, `'I.2'`).
- `judul`: Judul bab resmi.
- `status`: `'draft' | 'direvisi' | 'final'`.
- `jumlah_kata`: Jumlah kata aktual untuk penghitungan estimasi waktu baca.
- `adegan`: Kumpulan adegan (`Adegan[]`), tiap adegan berisi daftar paragraf.

### 2. `ReaderSettings`
Mewakili preferensi visual pembaca:
- `theme`: `'terang' | 'gelap' | 'sephia'`
- `fontFamily`: `'literata' | 'source-serif' | 'sans'`
- `fontSize`: `'sm' | 'md' | 'lg' | 'xl'`
- `lineHeight`: `'rapat' | 'nyaman' | 'lapang'`
- `columnWidth`: `'sedang' | 'lebar'`
- `modeAnimasi`: `'tenang' | 'hidup'`

---

## 🎨 Sistem Desain & Variabel Tema Optik

Tema optik dikelola murni menggunakan variabel CSS native di `src/index.css` yang diaktifkan melalui atribut `data-theme` pada elemen `<html>`:

| Token CSS | Terang (Parchment) | Sepia Hangat | Gelap Lembut |
|---|---|---|---|
| `--bg-page` | `#FBF9F5` | `#F4ECD8` | `#1A1B1E` |
| `--bg-panel` | `#FFFFFF` | `#EFE4CD` | `#24262B` |
| `--text-primary` | `#1C1917` | `#3D2B1F` | `#E4E4E7` |
| `--text-secondary` | `#57534E` | `#6E5D4F` | `#A1A1AA` |
| `--accent-color` | `#96572A` | `#8C4B1E` | `#D97736` |
| `--quote-accent` | `#B45309` | `#92400E` | `#F59E0B` |

---

## 🔊 Mesin Suara (Text-to-Speech Architecture)

Komponen `TTSPlayerBar.tsx` dan hook `src/lib/useTTSPlayer.ts` memanfaatkan `window.speechSynthesis` tanpa dependensi pihak ketiga:
- **Segmentasi Kalimat & Prosodi (`sentenceParser.ts`)**: Teks naskah diparsing menjadi unit kalimat lengkap dengan atribut tanda baca penutup, deteksi dialog tokoh, penanda akhir alinea, dan pemisah adegan (`• • •`).
- **Pembersihan Teks Suara**: Tanda baca penanda kutip dialog atau simbol sastra dibersihkan secara fonetik agar lafal suara terdengar wajar dan tidak mengeja tanda baca secara literal.
- **Deteksi Suara Bahasa**: Memfilter suara berlabel `id-ID` atau `id` dari daftar suara sistem operasi pengguna secara dinamis dan memprioritaskan profil suara natural/WaveNet.
