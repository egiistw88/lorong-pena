# Panduan Kontribusi (Contributing Guidelines)

Terima kasih atas minat Anda untuk berkontribusi pada pengembangan aplikasi web pembaca novel **"Yakin? — Perjalanan Hidup Zayd"**.

Dokumen ini menjelaskan alur kerja, standar kode, dan batasan ketat mengenai integritas naskah sastra dalam repositori ini.

---

## ⚠️ Perhatian Khusus: Integritas Naskah Novel

1. **Hak Eksklusif Pengarang**: Seluruh teks cerita, dialog, bab, dan alur narasi novel adalah karya cipta intelektual milik **Eugui Sett**.
2. **Larangan Modifikasi Teks Cerita**:
   - Kontributor dilarang mengubah, memperbaiki gaya bahasa, memparafrasekan, atau menambahkan kalimat pada berkas `src/content/units.ts` atau berkas naskah lainnya.
   - Perbaikan teks (misalnya perbaikan salah ketik / typo) **hanya boleh diajukan** melalui *Issue* dengan referensi jelas ke naskah fisik asli dan memerlukan konfirmasi langsung dari penulis sebelum diubah.

---

## 🛠️ Standar Pengembangan Perangkat Lunak

### 1. Prinsip Desain Antarmuka
- **Minim Distraksi**: Aplikasi ini adalah wadah membaca buku sastra, bukan portal media atau dashboard analitik yang ramai. Hindari penambahan animasi berlebihan, banner promosi, atau ornamen visual yang mengganggu konsentrasi pembaca.
- **Tipografi & Aksesibilitas**: Pastikan rasio kontras teks memenuhi standar WCAG AA di semua mode tema (Terang, Sepia, Gelap, dan Hitam Pekat).

### 2. Standar Kode
- **Bahasa**: TypeScript dalam mode `strict`. Hindari penggunaan tipe `any`.
- **Komponen**: Fungsional React dengan *hooks*, modular, dan terbagi rapi ke dalam folder `src/components/`.
- **Gaya Tampilan**: Menggunakan utilitas Tailwind CSS v4 dengan variabel tema CSS native (`var(--...)`) yang telah didefinisikan di `src/index.css`.
- **Ikon**: Seluruh ikon wajib diimpor dari paket `lucide-react`.

---

## 🌿 Alur Kerja Git & Pull Request

1. **Fork & Buat Branch**:
   ```bash
   git checkout -b feat/nama-fitur-baru
   # atau
   git checkout -b fix/perbaikan-bug
   ```

2. **Verifikasi Sebelum Komit**:
   Sebelum membuat komit, pastikan seluruh kode lolos kompilasi dan linting:
   ```bash
   npm run lint
   npm run build
   ```

3. **Format Pesan Komit**:
   Gunakan format *Conventional Commits*:
   - `feat: tambah pintasan keyboard untuk navigasi bab`
   - `fix: perbaiki perataan teks pada layar tablet`
   - `docs: perbarui panduan arsitektur komponen`
   - `style: rapikan margin kontainer pembaca`

4. **Pengajuan Pull Request**:
   - Berikan deskripsi yang jelas mengenai masalah yang diselesaikan atau fitur yang ditambahkan.
   - Sertakan tangkapan layar (*screenshot*) jika terdapat perubahan tampilan visual.
