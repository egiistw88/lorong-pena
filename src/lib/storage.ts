import { ReaderSettings, ReadingProgress, ThemeMode, TTSSettings } from '../types';

const SETTINGS_KEY = 'lorong_pena_reader_settings';
const PROGRESS_KEY = 'lorong_pena_reading_progress';
const TTS_SETTINGS_KEY = 'lorong_pena_tts_settings';

export function getDefaultTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'gelap';
    }
  }
  return 'terang';
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: getDefaultTheme(),
  fontFamily: 'literata',
  fontSize: 'md',
  lineHeight: 'nyaman',
  columnWidth: 'sedang',
  modeAnimasi: 'tenang',
};

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Gunakan pengaturan default jika gagal
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Abaikan kegagalan penyimpanan lokal
  }
}

export const DEFAULT_PROGRESS: ReadingProgress = {
  currentUnitId: 'prolog',
  completedUnitIds: [],
  lastReadTimestamp: Date.now(),
  scrollPercentage: 0,
};

export function loadProgress(): ReadingProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    }
  } catch {
    // Default
  }
  return DEFAULT_PROGRESS;
}

export function saveProgress(progress: Partial<ReadingProgress>): ReadingProgress {
  try {
    const current = loadProgress();
    const updated: ReadingProgress = {
      ...current,
      ...progress,
      lastReadTimestamp: Date.now(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  engine: 'web-speech',
  mode: 'hikayat',
  rate: 0.88, // Kecepatan hangat, santai sesuai ritme pendongeng
  pitch: 0.98, // Nada alami berwibawa
  autoScroll: true,
  naturalPauses: true,
  dialogueModulation: true,
};

export function loadTTSSettings(): TTSSettings {
  try {
    const raw = localStorage.getItem(TTS_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_TTS_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Default
  }
  return DEFAULT_TTS_SETTINGS;
}

export function saveTTSSettings(settings: TTSSettings): void {
  try {
    localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Abaikan
  }
}

