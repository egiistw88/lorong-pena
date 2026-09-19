# Yakin? — Perjalanan Hidup Zayd

> *Aplikasi Pembaca Web Interaktif untuk Naskah Novel Karya Eugui Sett (Bandung)*

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Tentang Karya

**"Yakin? — Perjalanan Hidup Zayd"** adalah novel karya **Eugui Sett** (Bandung) yang menelusuri perjalanan eksistensial, pergulatan batin, dan pencarian makna hidup tokoh Zayd. 

Aplikasi ini dirancang khusus sebagai wadah pembaca digital interaktif (*dedicated reading app*) yang mengedepankan atmosfer buku fisik, tipografi klasik berkualitas tinggi, dan kenyamanan membaca jarak jauh tanpa distraksi antarmuka modern yang berlebihan.

---

## ✨ Fitur & Keunggulan Antarmuka

Aplikasi dibangun dengan prinsip **kenyamanan membaca jangka panjang** (*extended reading comfort*):

- **🎨 3 Mode Tema Optik Khusus Buku**:
  - **Terang (Kertas Alami / Parchment)**: Kontras seimbang menyerupai kertas cetak berkualitas tinggi.
  - **Sepia Hangat**: Nuansa kuning-cokelat lembut yang mengurangi keletihan mata di sore atau senja hari.
  - **Gelap Lembut (Dark Slate)**: Skema gelap yang teduh dengan kontras rendah yang tidak menusuk mata.
- **🔤 Penyesuaian Tipografi & Geometri Baca**:
  - Pilihan jenis huruf: Klasik Serif (*Literata*), Humanist Serif (*Source Serif 4*), dan Modern Sans (*Plus Jakarta Sans*).
  - Skala ukuran huruf: 4 tingkat kenyamanan (*sm*, *md*, *lg*, *xl*).
  - Spasi baris (*line-height*): Rapat (1.5), Nyaman (1.75), hingga Lapang (2.0).
  - Lebar kolom teks terukur: Sedang (65–70 karakter per baris) dan Lebar (75–80 karakter).
  - Mode irama animasi: Tenang (minim gerakan) atau Hidup (animasi transisi halus).
- **🔊 Mesin Narasi Suara (Text-to-Speech / TTS)**:
  - Pemutar audio terintegrasi berbasis Web Speech API bawaan perangkat/peramban.
  - Pilihan karakter narasi sastra (*Hikayat*, *Renung*, dan *Wicara*).
  - Irama napas alami antar-kalimat, alinea, dan pemisah adegan (`• • •`), serta modulasi dialog tokoh.
  - Kendali tempo baca granular (0.75x – 1.3x) dan penanda posisi kalimat secara real-time.
- **📑 Daftar Isi Lengkap & Struktur Kanon**:
  - Menampung seluruh kerangka kanon 5 Bagian dan 48 Bab + Prolog.
  - Indikator status bab yang sudah tuntas dibaca vs bab naskah aktif.
  - Navigasi cepat antar-bab dengan animasi transisi yang tenang.
- **💾 Penyimpanan Status Otomatis (Local-First)**:
  - Posisi bab terakhir, progres baca, dan preferensi tipografi tersimpan otomatis di browser lokal pembaca tanpa perlu registrasi akun atau backend server.
- **📥 Manajemen & Pratinjau Naskah**:
  - Modal peninjauan draf naskah terstruktur untuk memeriksa struktur teks dan jumlah kata unit narasi.

---

## 🏗️ Struktur Proyek

```text
├── .github/                     # Konfigurasi GitHub (Workflows CI, Template Issue & PR)
├── docs/                        # Dokumentasi arsitektur & panduan teknis
│   └── ARCHITECTURE.md          # Detail arsitektur komponen & aliran data
├── public/                      # Berkas statis
│   ├── cover.jpg                # Berkas sampul resmi novel "Yakin?"
│   └── favicon.svg              # Favicon resmi
├── src/
│   ├── components/              # Komponen antarmuka modular
│   │   ├── ChapterOrnamentDivider.tsx # Ornamen pembuka bab & pembatas naskah
│   │   ├── Header.tsx           # Navigasi atas & status unit aktif
│   │   ├── HomeView.tsx         # Beranda buku minimalis & aksi cepat baca
│   │   ├── IlluminatedDropCap.tsx # Drop cap klasik awal bab
│   │   ├── ManuscriptImportModal.tsx # Alat pratinjau struktur & draf naskah
│   │   ├── ReaderFooter.tsx     # Footer navigasi bab bawah
│   │   ├── ReaderView.tsx       # Lembar baca utama naskah
│   │   ├── SceneBreak.tsx       # Pemisah adegan sastra ('• • •')
│   │   ├── ScrollParagraph.tsx  # Paragraf naskah dengan penanda kalimat aktif
│   │   ├── SettingsDrawer.tsx   # Panel laci pengaturan tema & tipografi
│   │   ├── TableOfContentsModal.tsx # Modal daftar isi kanon 5 Bagian
│   │   └── TTSPlayerBar.tsx     # Bilah kontrol pemutar suara Text-to-Speech
│   ├── content/                 # Sumber naskah kanon & metadata
│   │   ├── meta.ts              # Metadata novel, pengarang, & rencana 5 Bagian
│   │   └── units/               # Berkas naskah kanon terpisah per-bab
│   │       ├── prolog.ts        # Teks naskah Prolog
│   │       ├── bab-1-1.ts       # Teks naskah Bab I.1
│   │       ├── ...              # Teks naskah Bab I.2 – Bab I.7
│   │       └── index.ts         # Agregator koleksi unit narasi
│   ├── lib/                     # Logika bisnis, parser, & penyimpanan
│   │   ├── readingTime.ts       # Kalkulasi estimasi durasi baca berbasis kata
│   │   ├── sentenceParser.ts    # Parser kalimat, dialog, dan jeda tanda baca
│   │   ├── storage.ts           # Abstraksi localStorage untuk preferensi & progres
│   │   └── useTTSPlayer.ts      # Custom hook pengelola mesin suara Web Speech
│   ├── types.ts                 # Definisi tipe data TypeScript kanon
│   ├── App.tsx                  # Orkestrator status aplikasi & tampilan
│   ├── main.tsx                 # Titik masuk aplikasi (DOM Mount)
│   └── index.css                # Konfigurasi Tailwind CSS v4 & variabel tema optik
├── index.html                   # Entry point HTML dengan metadata OpenGraph
├── metadata.json                # Metadata konfigurasi sistem AI Studio
├── package.json                 # Manifest dependensi & skrip proyek
├── tsconfig.json                # Konfigurasi kompilator TypeScript
└── vite.config.ts               # Konfigurasi bundler Vite
```

---

## 🚀 Memulai (Panduan Pengembang)

### Prasyarat

Pastikan lingkungan Anda telah terpasang:
- **Node.js**: Versi `>= 18.0.0`
- **npm** atau **bun**: Versi terbaru

### Langkah Instalasi

1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/username/yakin-novel-reader.git
   cd yakin-novel-reader
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan pada port lokal: `http://localhost:3000`.

4. **Pemeriksaan Tipe (Linting)**:
   ```bash
   npm run lint
   ```

5. **Kompilasi Produksi**:
   ```bash
   npm run build
   ```
   Hasil build siap saji akan dibuat di direktori `dist/`.

---

## 🔒 Kebijakan Integritas Naskah

1. **Larangan Modifikasi Isi Cerita**: Seluruh teks naskah novel yang tersimpan di dalam berkas `src/content/units/*.ts` merupakan karya orisinal dari **Eugui Sett**. Kontributor teknis dilarang mengubah, memparafrasekan, menyingkat, atau menambahkan kalimat cerita fiksi tanpa mandat tertulis dari penulis.
2. **Pemisahan Logika & Konten**: Logika antarmuka (*UI logic*) dipisahkan secara ketat dari konten naskah narasi (*narrative content*), sehingga pembaruan fitur teknis tidak akan pernah merusak keutuhan teks asli.

---

## 📄 Lisensi & Hak Cipta

- **Hak Cipta Naskah Novel**: Seluruh isi cerita, nama karakter, alur, dan teks novel *Yakin? — Perjalanan Hidup Zayd* adalah hak cipta © Eugui Sett, Bandung. Seluruh hak cipta dilindungi undang-undang (*All Rights Reserved*).
- **Kode Sumber Aplikasi**: Arsitektur kode sumber pembaca web ini dilisensikan di bawah [Lisensi MIT](LICENSE).

---

<p align="center">
  <em>Didedikasikan untuk pengalaman membaca yang tenang, mendalam, dan bermakna.</em>
</p>
