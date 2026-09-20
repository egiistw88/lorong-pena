# Panduan Kontribusi (Contributing Guidelines)

Terima kasih atas minat Anda untuk berkontribusi pada pengembangan aplikasi web pembaca novel **"Yakin? — Perjalanan Hidup Zayd"** (Lorong Pena).

Dokumen ini menjelaskan alur kerja, standar kode, keamanan, dan batasan ketat mengenai integritas naskah sastra dalam repositori ini.

---

## ⚠️ Perhatian Khusus: Integritas Naskah Novel

1. **Hak Eksklusif Pengarang**: Seluruh teks cerita, dialog, bab, dan alur narasi novel adalah karya cipta intelektual milik **Eugui Sett** (Bandung).
2. **Larangan Keras Modifikasi Teks Cerita**:
   - Kontributor dilarang mengubah, memperbaiki gaya bahasa, memparafrasekan, meringkas, atau menambahkan kalimat pada berkas naskah di `src/content/units/*.ts`.
   - Perbaikan teks (misalnya perbaikan salah ketik / typo naskah) **hanya boleh diajukan** melalui *Issue* dengan referensi jelas ke naskah fisik asli dan memerlukan konfirmasi langsung dari penulis sebelum diperbarui.
3. **Larangan Pembuatan Teks Palsu / AI Hallucination**:
   - Untuk pengujian tampilan, gunakan data uji netral yang jelas ditandai sebagai mock/placeholder. Jangan membuat cerita rekaan yang meniru tokoh atau dunia Zayd.

---

## 🛠️ Standar Pengembangan Perangkat Lunak

### 1. Prinsip Desain Antarmuka & UX
- **Nuansa Buku Sastra (Bukan Dashboard SaaS)**: Aplikasi ini adalah wadah membaca buku fiksi yang tenang dan reflektif. Hindari penambahan animasi berlebihan, efek neon, gradien mencolok, banner promosi, atau ornamen visual yang mengganggu konsentrasi pembaca.
- **Tipografi & Aksesibilitas**: Pastikan rasio kontras teks memenuhi standar WCAG AA di semua 4 mode tema (Terang, Sepia, Gelap Lembut, dan OLED Hitam Pekat).
- **Responsif & Sentuhan**: Elemen tombol minimal 44px pada layar sentuh, dan tata letak membaca tetap proporsional pada rentang ponsel cerdas hingga monitor lebar.

### 2. Standar Kode & Arsitektur
- **TypeScript Penuh**: Mode `strict` aktif. Hindari penggunaan tipe `any`.
- **Frontend**: Komponen fungsional React 19 dengan hooks, terbagi modular di `src/components/`.
- **Backend**: Express di `server.ts` yang menangani rute proxy audio `/api/tts/*`, health check `/api/health`, dan manajemen cache.
- **Keamanan Kunci & Rahasia API**:
  - `GEMINI_API_KEY` dan kredensial Cloudflare R2 **wajib tersimpan di sisi server**.
  - **DILARANG KERAS** mengekspos kunci API atau rahasia ke kode klien (`src/`), bundel statis, atau repositori Git.
- **Gaya Tampilan**: Utilitas Tailwind CSS v4 dengan variabel tema CSS native (`var(--...)`) yang didefinisikan di `src/index.css`.
- **Ikon**: Seluruh ikon antarmuka wajib diimpor dari paket resmi `lucide-react`.

---

## 🌿 Alur Kerja Git & Pull Request

1. **Buat Branch Fitur / Perbaikan**:
   ```bash
   git checkout -b feat/nama-fitur-baru
   # atau
   git checkout -b fix/perbaikan-bug
   ```

2. **Verifikasi Kualitas Kode**:
   Sebelum mengajukan komit, pastikan seluruh verifikasi lulus tanpa galat:
   ```bash
   npm run lint   # Memastikan 0 error pada TypeScript compiler
   npm run build  # Memastikan bundle statis dan dist/server.cjs berhasil dibuat
   ```

3. **Format Pesan Komit**:
   Gunakan format *Conventional Commits*:
   - `feat: tambah tombol navigasi kalimat pada bar tts`
   - `fix: perbaiki perataan teks pada layar tablet`
   - `docs: perbarui panduan arsitektur sistem`
   - `style: sesuaikan padding kontainer membaca tema oled`

4. **Pengajuan Pull Request (PR)**:
   - Jelaskan secara konkret masalah atau fitur yang dikerjakan.
   - Sertakan tangkapan layar (*screenshot*) jika menyangkut perubahan tampilan visual.
