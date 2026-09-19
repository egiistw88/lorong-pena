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

- **🎨 4 Mode Tema Optik Khusus Buku**:
  - **Terang (Kertas Alami / Parchment)**: Kontras seimbang menyerupai kertas cetak berkualitas tinggi.
  - **Sepia Hangat**: Nuansa kuning-cokelat lembut yang mengurangi keletihan mata di sore atau senja hari.
  - **Gelap Lembut (Dark Slate)**: Skema gelap yang teduh dengan kontras rendah yang tidak menusuk mata.
  - **Hitam Pekat (OLED Pure Black)**: Kontras maksimal dengan efisiensi daya optimal untuk layar AMOLED/OLED.
- **🔤 Penyesuaian Tipografi & Geometri Baca**:
  - Pilihan jenis huruf: Klasik Serif (*Merriweather / Georgia*) dan Modern Sans (*Plus Jakarta Sans*).
  - Skala ukuran huruf: 14px hingga 26px dengan kendali granular.
  - Spasi baris (*line-height*): 1.5, 1.7, hingga 2.0.
  - Lebar kolom teks terukur (65–75 karakter per baris) untuk mencegah lelah mata akibat lompatan baris.
  - Perataan teks: Rata Kiri (*Left Align*) atau Rata Kiri-Kanan (*Justify* dengan tanda hubung kata).
- **🔊 Mesin Narasi Suara (Text-to-Speech / TTS)**:
  - Pemutar audio terintegrasi berbasis Web Speech API lokal (bebas kuota internet).
  - Deteksi otomatis suara Bahasa Indonesia berkualitas tinggi.
  - Kendali laju baca (*speed rate* 0.75x – 1.75x) dan penanda posisi kalimat secara real-time.
- **📑 Daftar Isi Lengkap & Struktur Kanon**:
  - Menampung seluruh kerangka kanon 5 Bagian dan 48 Bab + Prolog.
  - Indikator status bab yang sudah tuntas dibaca vs bab naskah aktif.
  - Navigasi cepat antar-bab dengan animasi transisi yang tenang.
- **💾 Penyimpanan Status Otomatis (Local-First)**:
  - Posisi bab terakhir, progres scroll, dan preferensi tipografi tersimpan otomatis di perangkat lokal pembaca tanpa perlu registrasi akun.
- **📥 Manajemen & Pembaruan Naskah**:
  - Modal manajemen naskah terstruktur untuk meninjau dan memperbarui isi bab kapan saja dari draf penulis asli.

---

## 🏗️ Struktur Proyek

```text
├── .github/                 # Konfigurasi GitHub (Workflows CI, Template Issue & PR)
├── docs/                    # Dokumentasi arsitektur & panduan teknis
│   └── ARCHITECTURE.md      # Detail arsitektur komponen & aliran data
├── public/                  # Berkas statis
│   ├── cover.jpg            # Berkas sampul resmi novel "Yakin?"
│   └── favicon.svg          # Favicon resmi
├── src/
│   ├── components/          # Komponen antarmuka modular
│   │   ├── Header.tsx       # Navigasi atas & status unit aktif
│   │   ├── HomeView.tsx     # Beranda buku minimalis & aksi cepat
│   │   ├── ReaderView.tsx   # Lembar baca utama (justifikasi, drop cap, margin)
│   │   ├── ReaderFooter.tsx # Footer mengambang mode baca (auto-hide)
│   │   ├── SettingsDrawer.tsx # Pengaturan tema, tipografi, & tata letak
│   │   ├── TableOfContentsModal.tsx # Daftar isi kanon 5 bagian
│   │   ├── TTSPlayer.tsx    # Pemutar audio Text-to-Speech terintegrasi
│   │   └── ManuscriptImportModal.tsx # Manajemen draf naskah
│   ├── content/             # Sumber naskah kanon & metadata
│   │   ├── meta.ts          # Metadata judul, pengarang, imprint, & daftar bagian
│   │   └── units.ts         # Data teks lengkap Prolog & Bab-Bab Bagian I
│   ├── hooks/               # Custom React hooks
│   │   ├── useLocalStorage.ts # Sinkronisasi state ke Web Storage
│   │   ├── useReadingProgress.ts # Kalkulasi progres baca per unit
│   │   └── useScrollDirection.ts # Deteksi arah scroll untuk auto-hide navigasi
│   ├── lib/                 # Fungsi utilitas
│   │   └── readingTime.ts   # Estimasi waktu baca berbasis jumlah kata
│   ├── types.ts             # Definisi tipe data TypeScript
│   ├── App.tsx              # Komponen orkestrasi utama
│   ├── main.tsx             # Titik masuk aplikasi (DOM Mount)
│   └── index.css            # Token desain Tailwind CSS & variabel tema optik
├── index.html               # Entry point HTML dengan metadata OpenGraph lengkap
├── metadata.json            # Metadata konfigurasi sistem aplikasi
├── package.json             # Manifest dependensi & skrip proyek
├── tsconfig.json            # Konfigurasi kompilator TypeScript
└── vite.config.ts           # Konfigurasi bundler Vite
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

1. **Larangan Modifikasi Isi Cerita**: Seluruh teks naskah novel yang tersimpan di dalam berkas `src/content/units.ts` merupakan karya orisinal dari **Eugui Sett**. Kontributor teknis dilarang mengubah, memparafrasekan, menyingkat, atau menambahkan kalimat cerita fiksi tanpa mandat tertulis dari penulis.
2. **Pemisahan Logika & Konten**: Logika antarmuka (*UI logic*) dipisahkan secara ketat dari konten naskah narasi (*narrative content*), sehingga pembaruan fitur teknis tidak akan pernah merusak keutuhan teks asli.

---

## 📄 Lisensi & Hak Cipta

- **Hak Cipta Naskah Novel**: Seluruh isi cerita, nama karakter, alur, dan teks novel *Yakin? — Perjalanan Hidup Zayd* adalah hak cipta © Eugui Sett, Bandung. Seluruh hak cipta dilindungi undang-undang (*All Rights Reserved*).
- **Kode Sumber Aplikasi**: Arsitektur kode sumber pembaca web ini dilisensikan di bawah [Lisensi MIT](LICENSE).

---

<p align="center">
  <em>Didedikasikan untuk pengalaman membaca yang tenang, mendalam, dan bermakna.</em>
</p>
