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
 [ src/content/units.ts ] ← [ src/content/meta.ts ]
         ↓
 [ App.tsx (Orkestrator Status) ]
   ├── [ useLocalStorage (Preferensi & Progres) ]
   ├── [ useReadingProgress (Hitung Persentase) ]
   └── [ useScrollDirection (Navigasi Mengambang) ]
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
 │ - TTSPlayer.tsx (Mesin Narasi Web Speech API)  │
 │ - ManuscriptImportModal.tsx (Sinkronisasi Draf)│
 └────────────────────────────────────────────────┘
```

---

## 💾 Model Data (Types & Schemas)

Definisi model data utama berada di `src/types.ts`:

### 1. `UnitNarasi`
Mewakili satu unit bacaan (Prolog atau Bab tertentu):
- `id`: Pengenal unik (misal: `'prolog'`, `'bab-1'`).
- `bagian`: Nomor Bagian buku (0 untuk Prolog, 1 untuk Bagian I, dst.).
- `nomor`: Penomoran bab (misal: `'Prolog'`, `'I.1'`, `'I.2'`).
- `judul`: Judul bab resmi.
- `isi_teks`: Teks naskah lengkap dalam format paragraf terpisah (`\n\n`).
- `jumlah_kata`: Jumlah kata aktual untuk penghitungan estimasi waktu baca.
- `catatan_kaki`: Daftar catatan penjelasan kaki opsional (`Footnote[]`).

### 2. `ReaderPreferences`
Mewakili preferensi visual pembaca:
- `theme`: `'light' | 'sepia' | 'dark' | 'black'`
- `fontSize`: Skala ukuran huruf (14px – 26px, default: 18px).
- `lineHeight`: Jarak spasi antar-baris (1.5, 1.7, atau 2.0).
- `fontFamily`: `'serif' | 'sans'`
- `textAlign`: `'left' | 'justify'`

---

## 🎨 Sistem Desain & Variabel Tema Optik

Tema optik dikelola murni menggunakan variabel CSS native di `src/index.css` yang diaktifkan melalui atribut `data-theme` pada elemen `<html>`:

| Token CSS | Terang (Parchment) | Sepia Hangat | Gelap Lembut | Hitam Pekat (OLED) |
|---|---|---|---|---|
| `--bg-page` | `#FBF9F5` | `#F4ECD8` | `#1A1B1E` | `#000000` |
| `--bg-panel` | `#FFFFFF` | `#EFE4CD` | `#24262B` | `#0D0E11` |
| `--text-primary` | `#1C1917` | `#3D2B1F` | `#E4E4E7` | `#EEEEEE` |
| `--text-secondary` | `#57534E` | `#6E5D4F` | `#A1A1AA` | `#A0A0A0` |
| `--accent-color` | `#96572A` | `#8C4B1E` | `#D97736` | `#D97736` |
| `--quote-accent` | `#B45309` | `#92400E` | `#F59E0B` | `#F59E0B` |

---

## 🔊 Mesin Suara (Text-to-Speech Architecture)

Komponen `TTSPlayer.tsx` memanfaatkan `window.speechSynthesis` tanpa dependensi pihak ketiga:
- **Segmentasi Kalimat**: Teks naskah dipecah menjadi unit-unit kalimat logis menggunakan tanda baca (`.`, `!`, `?`).
- **Pembersihan Teks**: Karakter format non-alfanumerik (seperti tanda pemisah adegan `* * *`) dilewati agar pelafalan suara terdengar alami.
- **Deteksi Suara Bahasa**: Memfilter suara berlabel `id-ID` atau `id` dari daftar suara sistem operasi pengguna secara dinamis.
