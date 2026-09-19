import { NovelMeta } from '../types';

export const NOVEL_METADATA: NovelMeta = {
  judul: 'Yakin?',
  subjudul: 'Perjalanan Hidup Zayd',
  penulis: 'Eugui Sett',
  kota: 'Bandung',
  coverUrl: '/cover.jpg',
  total_bagian: 5,
  total_rencana_unit: 49, // 1 Prolog + 48 Bab
  bagian: [
    {
      nomor: 1,
      romawi: 'I',
      judul: 'Bagian I',
      deskripsi: 'Usia 17 tahun — Prolog + 7 Bab (Tuntas ditulis)',
      target_bab: 7,
      status: 'tuntas',
    },
    {
      nomor: 2,
      romawi: 'II',
      judul: 'Bagian II',
      deskripsi: '10 Bab',
      target_bab: 10,
      status: 'belum_mulai',
    },
    {
      nomor: 3,
      romawi: 'III',
      judul: 'Bagian III',
      deskripsi: '12 Bab',
      target_bab: 12,
      status: 'belum_mulai',
    },
    {
      nomor: 4,
      romawi: 'IV',
      judul: 'Bagian IV',
      deskripsi: '11 Bab',
      target_bab: 11,
      status: 'belum_mulai',
    },
    {
      nomor: 5,
      romawi: 'V',
      judul: 'Bagian V',
      deskripsi: '8 Bab — Hingga usia protagonis 40 tahun',
      target_bab: 8,
      status: 'belum_mulai',
    },
  ],
};
