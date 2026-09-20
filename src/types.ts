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

export type TTSEngine = 'gemini-server' | 'web-speech' | 'studio' | 'hybrid';

export type AudioSourceType = 'gemini-server' | 'web-speech' | 'studio';

export type GeminiVoiceId = 'Charon' | 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir';

export type StorytellerMode = 'hikayat' | 'renung' | 'wajar';

export interface TTSSettings {
  engine: TTSEngine; // 'gemini-server' (default suara alami Gemini), 'web-speech'
  geminiVoice: GeminiVoiceId; // 'Charon' (dalam & tenang), 'Kore' (lembut), dll.
  mode: StorytellerMode; // 'hikayat' (pendongeng hangat), 'renung' (puitis lambat), 'wajar' (standar)
  rate: number; // default 1.0 (kecepatan normal)
  pitch: number; // default 1.0
  voiceURI?: string;
  autoScroll: boolean; // scroll otomatis mengikuti kalimat aktif secara halus
  naturalPauses: boolean; // jeda napas alami antar-kalimat, paragraf & adegan
  dialogueModulation: boolean; // modulasi intonasi halus untuk dialog tokoh
}

export interface TTSTransaction {
  id: string;
  timestamp: number;
  textPreview: string;
  source: 'cache' | 'gemini-api' | 'silent' | 'web-speech';
  model?: string;
  durationMs: number;
  success: boolean;
  status: number;
  errorNote?: string;
}

export interface RateLimitInfo {
  isLimited: boolean;
  exceededAt?: number;
  retryDelaySeconds?: number;
  retryAt?: number;
  message?: string;
  quotaMetric?: string;
  quotaId?: string;
  limitValue?: string;
}

export interface TTSMonitorStats {
  status: 'online' | 'rate_limited' | 'error' | 'no_key';
  hasApiKey: boolean;
  hasPersistentCache?: boolean;
  activeModel: string;
  candidateModels: string[];
  cacheSize: number;
  maxCacheSize: number;
  metrics: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    apiCalls: number;
    apiSuccesses: number;
    apiFailures: number;
    cacheHitRatePercent: number;
    lastLatencyMs: number;
    averageLatencyMs: number;
    lastRequestTime: number | null;
  };
  rateLimitInfo: RateLimitInfo | null;
  recentTransactions: TTSTransaction[];
  serverUptimeSeconds: number;
}


