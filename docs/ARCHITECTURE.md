# Dokumentasi Arsitektur Sistem

Dokumen ini menjelaskan rancangan arsitektur teknis lengkap aplikasi web pembaca novel **"Yakin? — Perjalanan Hidup Zayd"** (Lorong Pena).

---

## 🏛️ Gambaran Umum Arsitektur

Aplikasi dirancang dengan arsitektur **Full-Stack Hybrid (React 19 + Express.js + Gemini Audio + Cloudflare R2)** yang mengedepankan:
1. **Kecepatan & Performa Baca**: Aset teks naskah di-*bundle* secara efisien di sisi klien untuk navigasi halaman tanpa jeda jaringan (*zero-latency reading*).
2. **Kenyamanan Sastra & Audio Bertenaga AI**: Narasi suara realistis bersumber langsung dari model multimodal Google Gemini dengan kontrol tempo, modulasi dialog tokoh, dan gaya narator (*Storyteller Mode*).
3. **Arsitektur Hemat Biaya & Kuota Berlapis (Two-Tier Cache)**: Kombinasi cache memori (L1) dan penyimpanan objek persisten Cloudflare R2 (L2) untuk menjamin audio tersimpan aman lintas siklus *sleep/restart* server gratisan (seperti di Render).
4. **Resiliensi Narasi (*Zero-Drop Continuity*)**: Jika kuota harian Gemini mencapai batas atau terjadi gangguan koneksi, pemutar audio otomatis beralih seketika ke sintesis lokal peramban (*Web Speech API*) tanpa memotong pengalaman mendengar pembaca.
5. **Pemisahan Tegas Konten & Logika Teknis**: Seluruh naskah kanon terisolasi dalam struktur data yang terverifikasi tipenya tanpa pernah dimodifikasi oleh logika aplikasi.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER / CLIENT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ App.tsx (Orkestrator Status Utama) ]                                     │
│    ├── src/lib/storage.ts (Preferensi Tipografi & Progres Baca)             │
│    ├── src/lib/readingTime.ts (Perhitungan Estimasi Waktu Baca)             │
│    └── src/lib/useTTSPlayer.ts (Mesin Sinkronisasi Audio & Teks)            │
│          ├── Bounded Memory Cache (Maks 60 ObjectURL + Revocation)          │
│          └── Web Speech API Fallback (Offline / Kuota Terlampaui)           │
│                                                                             │
│  [ Tampilan Utama ]                                                         │
│    ├── HomeView.tsx (Beranda Minimalis & Quick-Resume)                      │
│    └── ReaderView.tsx (Lembar Baca Sastra & Active Sentence Highlight)      │
│                                                                             │
│  [ Komponen Penunjang ]                                                     │
│    ├── Header.tsx (Status Bab, Navigasi, & Pengaturan Cepat)                │
│    ├── TableOfContentsModal.tsx (Daftar Isi Kanon 5 Bagian)                 │
│    ├── SettingsDrawer.tsx (Laci Tipografi, Geometri, & 4 Tema Optik)        │
│    ├── TTSPlayerBar.tsx (Bilah Pemutar Audio, Prosodi, & Storyteller Mode)  │
│    └── TTSMonitorModal.tsx (Dasbor Telemetri Kuota & Latensi Real-Time)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / Streams (Port 3000)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        BACKEND SERVER (server.ts)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Express Server ]                                                         │
│    ├── Vite Dev Middleware (Development) / Static Server (Production)       │
│    ├── /api/health (Pemeriksaan Kesiapan Server & Kunci API)                │
│    ├── /api/tts/status (Telemetri Kuota, Status Rate Limit, & Metrik)       │
│    ├── /api/tts/test-connection (Pengujian Koneksi Live / Ping)             │
│    ├── /api/tts/clear-cache (Pengosongan Cache Memori & R2)                 │
│    └── /api/tts/synthesize (Endpoint Utama Sintesis Audio Sastra)           │
│          │                                                                  │
│          ├── 1. Periksa L1 Cache In-Memory (Map<MD5, WAV Buffer>) ──► [HIT] │
│          │                                                                  │
│          ├── 2. Periksa L2 Cache Persisten (Cloudflare R2 Bucket) ──► [HIT] │
│          │                                                                  │
│          └── 3. Panggil Gemini Audio API (@google/genai SDK)                │
│                ├── Prioritas 1: gemini-2.5-flash-preview-tts                │
│                └── Cadangan:   gemini-3.1-flash-tts-preview                 │
│                      │                                                      │
│                      ├── Konversi Header WAV (24kHz Mono 16-bit PCM)        │
│                      ├── Simpan ke L1 Cache (RAM Server)                    │
│                      └── Simpan ke L2 Cache (PutObject ke Cloudflare R2)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Model Data (Types & Schemas)

Definisi model data terpusat di `src/types.ts`:

### 1. `UnitNarasi`
Mewakili satu unit bacaan naskah (Prolog atau Bab):
- `id`: Pengenal unik (misal: `'prolog'`, `'bab-1-1'`).
- `bagian`: Nomor Bagian buku (0 untuk Prolog, 1 untuk Bagian I, dst.).
- `urutan_dalam_bagian`: Nomor urut di dalam bagian terkait.
- `urutan_global`: Urutan global linear (1-indexed).
- `nomor`: Penomoran bab resmi (misal: `'Prolog'`, `'I.1'`, `'I.2'`).
- `judul`: Judul bab kanon.
- `status`: `'draft' | 'direvisi' | 'final'`.
- `jumlah_kata`: Jumlah kata aktual untuk kalkulasi durasi baca.
- `adegan`: Kumpulan adegan (`Adegan[]`), tiap adegan memuat barisan paragraf (`string[]`).

### 2. `ReaderSettings`
Mewakili preferensi visual pembaca:
- `theme`: `'terang' | 'sephia' | 'gelap' | 'oled'`
- `fontFamily`: `'literata' | 'source-serif' | 'sans'`
- `fontSize`: `'sm' | 'md' | 'lg' | 'xl'`
- `lineHeight`: `'rapat' | 'nyaman' | 'lapang'`
- `columnWidth`: `'sedang' | 'lebar'`
- `modeAnimasi`: `'tenang' | 'hidup'`

### 3. `TTSSettings` & `StorytellerMode`
Konfigurasi audio dan sintesis sastra:
- `voice`: Profil suara Gemini (*Puck*, *Charon*, *Kore*, *Fenrir*, *Aoede*).
- `rate`: Kecepatan baca (0.8x – 1.3x).
- `storytellerMode`:
  - `'tenang-reflektif'`: Irama lambat, artikulasi hangat dan teduh untuk narasi perenungan batin Zayd.
  - `'dramatis-berjiwa'`: Dinamika ekspresi vokal tinggi untuk konflik dan adegan emosional.
  - `'cepat-ringkas'`: Tempo efisien untuk meninjau peristiwa cerita.
  - `'khidmat-klasik'`: Tempo agung dan wibawa klasik untuk prolog dan renungan eksistensial.
- `autoScroll`: Pengguliran otomatis dokumen mengikuti kalimat aktif.
- `naturalPauses`: Jeda napas manusiawi setelah tanda koma, titik, tanda tanya, dan pemisah adegan.
- `dialogueModulation`: Modulasi intonasi dinamis untuk kalimat di dalam tanda kutip percakapan.

### 4. `TTSMonitorStats` & `TTSTransaction`
Struktur data telemetri real-time:
- `status`: `'online' | 'rate_limited' | 'error' | 'no_key'`
- `hasPersistentCache`: Boolean status keterhubungan bucket Cloudflare R2.
- `metrics`: Total permintaan, jumlah hit cache memori/R2, panggilan API berhasil vs gagal, persentase penghematan kuota, dan latensi respons milidetik.
- `recentTransactions`: Riwayat transaksi audio real-time beserta cuplikan teks, durasi pemrosesan, dan kode status HTTP.

---

## 🎨 Sistem Desain & Variabel Tema Optik

Aplikasi menghindari warna sintetis yang mencolok (*anti-slop*) dan berpegang pada palet optik kertas sastra dan batu sabak. Tema dikelola murni via variabel CSS di `src/index.css` yang diaktifkan melalui atribut `data-theme` pada elemen root `<html>`:

| Token CSS | Terang (Parchment) | Sepia Hangat | Gelap Lembut (Dark Slate) | OLED (Hitam Pekat) |
|---|---|---|---|---|
| `--bg-page` | `#FBF9F5` | `#F4ECD8` | `#1A1B1E` | `#000000` |
| `--bg-panel` | `#FFFFFF` | `#EFE4CD` | `#24262B` | `#0A0A0A` |
| `--bg-surface` | `#F5F1E8` | `#E8DAC0` | `#2D3036` | `#141414` |
| `--text-primary` | `#1C1917` | `#3D2B1F` | `#E4E4E7` | `#EDEDED` |
| `--text-secondary` | `#57534E` | `#6E5D4F` | `#A1A1AA` | `#888888` |
| `--accent-color` | `#96572A` | `#8C4B1E` | `#D97736` | `#D97736` |
| `--border-color` | `#E7E5E4` | `#DFD5BE` | `#3F3F46` | `#262626` |
| `--border-subtle` | `#F0ECE1` | `#E8DCBE` | `#2E3035` | `#1A1A1A` |

---

## 🔊 Mesin Suara & Arsitektur Gemini TTS

### 1. Segmentasi Kalimat & Prosodi Sastra (`sentenceParser.ts`)
Teks naskah tidak dibaca secara sekaligus dalam satu bongkahan besar, melainkan dipenggal menjadi kalimat-kalimat utuh (`SentenceUnit`):
- Mempertahankan integritas singkatan dan gelar tanpa memotong kalimat sembarangan.
- Mendeteksi dialog kutip percakapan (`isDialogue: true`).
- Menandai kalimat penutup paragraf (`isParagraphEnd: true`) dan jeda babak (`isSceneBreak: true`) untuk menyisipkan jeda kesenyapan yang proporsional (500ms – 1200ms).
- Melakukan normalisasi fonetik agar simbol kutip dan tanda estetika tidak dibaca secara harfiah oleh mesin.

### 2. Lapisan Caching Dua Tingkat (Two-Tier Caching)
- **Lapisan 1 (In-Memory LRU Cache)**:
  - Disimpan di RAM server `server.ts` menggunakan kunci `MD5(cleanText + voice + rate)`.
  - Kapasitas: 600 kalimat terakhir.
  - Waktu akses: **<2 milidetik**.
- **Lapisan 2 (Cloudflare R2 Object Storage)**:
  - Menyimpan berkas audio biner (`audio/wav`) di bucket S3 Cloudflare R2 dengan jalur `tts-cache/${cacheKey}.wav`.
  - Operasi simpan berjalan secara asinkron (*fire-and-forget*) tanpa memperlambat respons audio pertama pembaca.
  - Mempertahankan berkas audio secara permanen meskipun instance server di-deploy ulang atau tidur (*sleep*) di platform hosting gratis seperti Render.

### 3. Keamanan Kunci API
Sesuai prinsip arsitektur yang aman:
- `GEMINI_API_KEY` dan kredensial R2 **hanya berada di sisi server** (`server.ts`) dan tidak pernah dikirimkan atau bocor ke kode browser klien.
- Seluruh permintaan dari antarmuka pengguna dialirkan melalui rute internal `/api/tts/*`.

---

## 🔒 Integritas Naskah & Etika Teknis

1. **Prinsip Bebas Halusinasi (Zero-Hallucination)**: Pengembang dan asisten kode dilarang merekayasa teks cerita atau mengubah struktur naskah novel *Yakin? — Perjalanan Hidup Zayd*.
2. **Kanon Data**: Berkas `src/content/units/*.ts` adalah sumber kebenaran tunggal untuk seluruh teks cerita yang ditampilkan kepada pembaca.
