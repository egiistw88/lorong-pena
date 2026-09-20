# Yakin? — Perjalanan Hidup Zayd

> *Aplikasi Pembaca Web Interaktif untuk Naskah Novel Karya Eugui Sett (Bandung)*

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Gemini_TTS-Live_Audio-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Persistent_Cache-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Tentang Karya

**"Yakin? — Perjalanan Hidup Zayd"** adalah novel karya **Eugui Sett** (Bandung) yang menelusuri perjalanan eksistensial, pergulatan batin, dan pencarian makna hidup tokoh Zayd.

Aplikasi ini dirancang khusus sebagai wadah pembaca digital interaktif (*dedicated reading web app*) yang mengedepankan atmosfer buku fisik, tipografi sastra berkualitas tinggi, dan kenyamanan membaca jangka panjang tanpa distraksi antarmuka modern yang berlebihan.

---

## ✨ Fitur & Keunggulan Antarmuka

Aplikasi dibangun dengan prinsip **kenyamanan membaca sastra & minim distraksi**:

- **🎨 4 Mode Tema Optik Khusus Buku**:
  - **Terang (Kertas Alami / Parchment)**: Kontras seimbang menyerupai lembaran kertas cetak berkualitas tinggi.
  - **Sepia Hangat**: Nuansa kuning-cokelat lembut yang mengurangi keletihan mata saat membaca di sore hari.
  - **Gelap Lembut (Dark Slate)**: Skema gelap teduh dengan kontras rendah yang tidak menusuk mata.
  - **OLED (Hitam Pekat AMOLED)**: Latar hitam murni (`#000000`) untuk efisiensi daya dan kenyamanan mata di malam hari.
- **🔤 Penyesuaian Tipografi & Geometri Baca**:
  - **Pilihan Jenis Huruf**: Klasik Serif (*Literata*), Humanist Serif (*Source Serif 4*), dan Modern Sans (*Plus Jakarta Sans*).
  - **Skala Ukuran Huruf**: 4 tingkat kenyamanan (*sm*, *md*, *lg*, *xl*).
  - **Spasi Baris (*line-height*)**: Rapat (1.55), Nyaman (1.70), hingga Lapang (1.90).
  - **Lebar Kolom Teks Terukur**: Sedang (62 karakter per baris) dan Lebar (72 karakter per baris).
  - **Mode Irama Animasi**: **Tenang** (bawaan, murni statis ala buku fisik) atau **Hidup** (sentuhan kaligrafi iluminasi stroke-draw pada huruf pembuka bab, stagger pembatas adegan `• • •`, dan reveal paragraf yang menghormati `prefers-reduced-motion`).
- **🎙️ Mesin Suara Narator Ganda (Gemini Audio Live + Fallback Web Speech)**:
  - **Gemini Live Generative TTS**: Sintesis suara alami berkualitas tinggi langsung dari Google Gemini (`gemini-2.5-flash-preview-tts` & `gemini-3.1-flash-tts-preview`) dengan format WAV 24kHz.
  - **Pilihan Profil Suara**: Beragam karakter suara ekspresif (*Puck*, *Charon*, *Kore*, *Fenrir*, *Aoede*).
  - **Mode Karakter Narator (*Storyteller Mode*)**:
    - *Tenang & Reflektif*: Artikulasi lembut, tempo lambat, dan jeda kontemplatif untuk narasi batin.
    - *Dramatis & Berjiwa*: Dinamika vokal lebih tinggi untuk adegan klimaks dan pergulatan hidup.
    - *Cepat & Ringkas*: Artikulasi lugas dan tempo lebih cepat untuk tinjauan alur.
    - *Khidmat & Klasik*: Irama narasi agung untuk prolog dan momen perenungan eksistensial.
  - **Sinkronisasi Kalimat & Prosodi**: Penanda sorot kalimat (*active sentence highlight*) otomatis bergeser selaras dengan suara pembaca, dilengkapi tombol loncat kalimat dan *auto-scroll*.
  - **Arsitektur Hemat Kuota Berlapis (Two-Tier Cache)**:
    - **L1 In-Memory Cache**: Respons instan (<2ms) untuk kalimat yang baru saja diputar.
    - **L2 Cloudflare R2 Persistent Cache**: Penyimpanan objek persisten via S3 protocol untuk menjamin audio tersimpan aman lintas *sleep/restart* server (misal pada free tier Render).
  - **Fallback Anggun (*Zero-Drop Continuity*)**: Jika koneksi terputus atau batas kuota tercapai, sistem secara otomatis beralih ke sintesis lokal peramban (*Web Speech API*) tanpa memotong narasi.
  - **Panel Telemetri Real-Time**: Dasbor monitor untuk memantau status kuota, latensi respons milidetik, rasio efisiensi cache, dan riwayat transaksi audio.
- **📑 Kerangka Kanon Lengkap**:
  - Menampung struktur 5 Bagian dan 48 Bab + Prolog naskah "Yakin?".
  - Penanda progres baca, riwayat bab terakhir, dan navigasi loncat bab instan.
- **💾 Penyimpanan Status Otomatis (Local-First)**:
  - Posisi baca, preferensi tipografi, dan bab terakhir tersimpan otomatis di penyimpanan lokal pembaca (`localStorage`) tanpa memerlukan login.

---

## 🏗️ Struktur Proyek

```text
├── .env.example                 # Dokumentasi variabel lingkungan (Gemini API & Cloudflare R2)
├── .github/                     # Konfigurasi GitHub Workflows & Template
├── docs/                        # Dokumentasi arsitektur & panduan teknis
│   └── ARCHITECTURE.md          # Spesifikasi detail arsitektur full-stack & aliran data
├── public/                      # Berkas statis
│   ├── cover.jpg                # Berkas sampul resmi novel "Yakin?"
│   └── favicon.svg              # Favicon aplikasi
├── server.ts                    # Server backend Express: proxy Gemini TTS, cache L1/L2, & telemetri
├── src/
│   ├── components/              # Komponen antarmuka modular
│   │   ├── ChapterOrnamentDivider.tsx # Ornamen pembuka bab & pembatas naskah
│   │   ├── Header.tsx           # Navigasi atas & status unit aktif
│   │   ├── HomeView.tsx         # Beranda buku minimalis & aksi cepat baca
│   │   ├── IlluminatedDropCap.tsx # Drop cap klasik awal bab
│   │   ├── ManuscriptImportModal.tsx # Alat pratinjau struktur & draf naskah
│   │   ├── ReaderFooter.tsx     # Navigasi bab sebelumnya / berikutnya
│   │   ├── ReaderView.tsx       # Lembar baca utama naskah novel
│   │   ├── SceneBreak.tsx       # Pemisah adegan sastra ('• • •')
│   │   ├── ScrollParagraph.tsx  # Paragraf naskah dengan penanda kalimat aktif
│   │   ├── SettingsDrawer.tsx   # Panel laci pengaturan tema & tipografi
│   │   ├── TableOfContentsModal.tsx # Modal daftar isi kanon 5 Bagian
│   │   ├── TTSMonitorModal.tsx  # Modal telemetri & status kuota real-time Gemini
│   │   └── TTSPlayerBar.tsx     # Bilah kontrol pemutar suara Text-to-Speech
│   ├── content/                 # Sumber naskah kanon & metadata novel
│   │   ├── meta.ts              # Metadata novel, pengarang, & rencana 5 Bagian
│   │   └── units/               # Berkas naskah kanon terpisah per-bab
│   │       ├── prolog.ts        # Teks naskah Prolog
│   │       ├── bab-1-1.ts       # Teks naskah Bab I.1
│   │       ├── ...              # Teks naskah Bab I.2 – Bab I.7
│   │       └── index.ts         # Agregator koleksi unit narasi
│   ├── lib/                     # Utilitas logika bisnis & parser
│   │   ├── readingTime.ts       # Kalkulasi estimasi durasi baca berbasis kata
│   │   ├── sentenceParser.ts    # Parser kalimat sastra, dialog, dan jeda tanda baca
│   │   ├── storage.ts           # Abstraksi localStorage untuk preferensi & progres
│   │   └── useTTSPlayer.ts      # Custom hook pengelola mesin suara (Gemini + Web Speech)
│   ├── types.ts                 # Definisi tipe TypeScript kanon & telemetri
│   ├── App.tsx                  # Orkestrator status aplikasi & tampilan
│   ├── main.tsx                 # Titik masuk aplikasi frontend (DOM Mount)
│   └── index.css                # Konfigurasi Tailwind CSS v4 & variabel tema optik
├── index.html                   # Entry point HTML dengan metadata OpenGraph
├── metadata.json                # Metadata konfigurasi container AI Studio
├── package.json                 # Manifest dependensi & skrip proyek
├── tsconfig.json                # Konfigurasi kompilator TypeScript
└── vite.config.ts               # Konfigurasi bundler Vite
```

---

## 🚀 Panduan Menjalankan & Pengembangan

### Prasyarat Lingkungan

- **Node.js**: Versi `>= 18.0.0` (disarankan Node.js 20 LTS atau 22)
- **npm** atau **bun**: Versi terbaru
- **Kunci Gemini API (Opsional untuk fitur TTS Alami)**: Dapatkan dari [Google AI Studio](https://aistudio.google.com/). Jika tidak diisi, aplikasi tetap berfungsi normal dengan sintesis suara lokal (*Web Speech API*).

### 1. Kloning Repositori & Instalasi

```bash
git clone https://github.com/egiistw88/lorong-pena.git
cd lorong-pena
npm install
```

### 2. Konfigurasi Lingkungan (`.env`)

Salin berkas percontohan konfigurasi:
```bash
cp .env.example .env
```

Buka berkas `.env` dan sesuaikan nilainya:
```env
# Kunci Gemini API (Wajib untuk suara Gemini TTS bertenaga AI)
GEMINI_API_KEY=AIzaSy...

# Konfigurasi Cloudflare R2 (Opsional tapi SANGAT disarankan untuk produksi)
# Menyimpan berkas audio persisten agar tidak hilang saat server tidur/restart di Render
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=lorong-pena-audio
```

### 3. Menjalankan Mode Pengembangan (Development)

```bash
npm run dev
```
Aplikasi full-stack (Express + Vite) akan aktif pada port `http://localhost:3000`.

### 4. Pemeriksaan Kualitas Kode (Linting)

```bash
npm run lint
```
Memverifikasi validitas tipe TypeScript di seluruh aplikasi (`tsc --noEmit`).

### 5. Kompilasi Produksi (Build & Start)

```bash
npm run build
npm start
```
Perintah `build` akan mengompilasi aset antarmuka statis dengan Vite ke direktori `dist/` serta membundel server backend menjadi berkas mandiri `dist/server.cjs` menggunakan esbuild. Perintah `start` kemudian akan mengeksekusi `node dist/server.cjs`.

---

## 🌐 Panduan Deployment (Render.com)

Aplikasi ini dapat di-deploy secara langsung ke platform komputasi awan seperti **Render** (tersedia *free tier*):

1. **Buat Web Service Baru di Render**:
   - Hubungkan ke repositori GitHub `egiistw88/lorong-pena`.
2. **Pengaturan Konfigurasi**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
3. **Pengaturan Environment Variables**:
   - Tambahkan secret `GEMINI_API_KEY`.
   - (Jika mengaktifkan R2) Tambahkan `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, dan `R2_BUCKET_NAME`.
4. **Verifikasi**:
   - Buka URL yang diberikan oleh Render.
   - Buka salah satu bab dan tekan tombol **Monitor** pada bilah pemutar TTS untuk memeriksa status `hasPersistentCache` dan koneksi Gemini.

---

## 🔒 Kebijakan Integritas Naskah

1. **Larangan Modifikasi Isi Cerita**: Seluruh teks naskah novel yang tersimpan di dalam berkas `src/content/units/*.ts` merupakan karya orisinal dari **Eugui Sett**. Kontributor teknis dilarang mengubah, memparafrasekan, menyingkat, atau menambahkan kalimat cerita fiksi tanpa mandat tertulis dari penulis.
2. **Pemisahan Logika & Konten**: Logika antarmuka (*UI logic*) dan mesin audio dipisahkan secara ketat dari konten naskah narasi (*narrative content*), sehingga pembaruan fitur teknis tidak akan pernah merusak keutuhan teks asli.

---

## 📄 Lisensi & Hak Cipta

- **Hak Cipta Naskah Novel**: Seluruh isi cerita, nama karakter, alur, dan teks novel *Yakin? — Perjalanan Hidup Zayd* adalah hak cipta © Eugui Sett, Bandung. Seluruh hak cipta dilindungi undang-undang (*All Rights Reserved*).
- **Kode Sumber Aplikasi**: Arsitektur kode sumber pembaca web ini dilisensikan di bawah [Lisensi MIT](LICENSE).

---

<p align="center">
  <em>Didedikasikan untuk pengalaman membaca yang tenang, mendalam, dan bermakna.</em>
</p>
