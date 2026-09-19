/**
 * Model Konten & Data untuk Lorong Pena
 * Sesuai Bagian 6 & 8 PRD "Lorong Pena" (18 September 2026)
 */

export type StatusUnit = 'draft' | 'direvisi' | 'final';

export interface Adegan {
  /** Paragraf-paragraf dalam satu adegan */
  paragraf: string[];
}

export interface UnitNarasi {
  /** ID unik unit narasi, misal: "prolog", "bab-1-1" */
  id: string;
  /** Nomor bagian buku (0 untuk Prolog, 1 untuk Bagian I, dst.) */
  bagian: number;
  /** Urutan di dalam bagian terkait (1-indexed) */
  urutan_dalam_bagian: number;
  /** Urutan global untuk memudahkan navigasi bab sebelumnya/selanjutnya */
  urutan_global: number;
  /** Label nomor unit (misal: "Prolog", "I.1", "I.2") */
  nomor: string;
  /** Judul unit narasi */
  judul: string;
  /** Status unit naskah */
  status: StatusUnit;
  /** Jumlah kata dalam unit */
  jumlah_kata: number;
  /** Kumpulan adegan (tiap adegan dipisahkan oleh '• • •') */
  adegan: Adegan[];
  /** Catatan struktural (misal: "Plot Point 1, penutup Bagian I", opsional) */
  catatan?: string;
}

export interface BagianMeta {
  nomor: number;
  judul: string;
  romawi: string;
  deskripsi: string;
  target_bab: number;
  status: 'tuntas' | 'dalam_penulisan' | 'belum_mulai';
}

export interface NovelMeta {
  judul: string;
  subjudul?: string;
  penulis: string;
  kota?: string;
  coverUrl?: string;
  total_bagian: number;
  total_rencana_unit: number; // 49 (Prolog + 48 Bab)
  bagian: BagianMeta[];
}

export type ThemeMode = 'terang' | 'gelap' | 'sephia' | 'oled';
export type FontFamilyOption = 'literata' | 'source-serif' | 'sans';
export type FontSizeOption = 'sm' | 'md' | 'lg' | 'xl';
export type LineHeightOption = 'rapat' | 'nyaman' | 'lapang';
export type ColumnWidthOption = 'sedang' | 'lebar';
export type ModeAnimasiOption = 'tenang' | 'hidup';

export interface ReaderSettings {
  theme: ThemeMode;
  fontFamily: FontFamilyOption;
  fontSize: FontSizeOption;
  lineHeight: LineHeightOption;
  columnWidth: ColumnWidthOption;
  modeAnimasi?: ModeAnimasiOption;
}

export interface ReadingProgress {
  currentUnitId: string;
  completedUnitIds: string[];
  lastReadTimestamp: number;
  scrollPercentage: number;
  unitScrollPercentages?: Record<string, number>;
}

export type TTSEngine = 'web-speech';

export type StorytellerMode = 'hikayat' | 'renung' | 'wajar';

export interface TTSSettings {
  engine: TTSEngine;
  mode: StorytellerMode; // 'hikayat' (pendongeng hangat), 'renung' (puitis lambat), 'wajar' (standar)
  rate: number; // default 0.88 (kecepatan narasi santai, hangat)
  pitch: number; // default 0.98 (nada alami, tidak datar)
  voiceURI?: string;
  autoScroll: boolean; // scroll otomatis mengikuti kalimat aktif
  naturalPauses: boolean; // jeda napas alami antar-kalimat, paragraf & adegan
  dialogueModulation: boolean; // modulasi intonasi halus untuk dialog tokoh
}

