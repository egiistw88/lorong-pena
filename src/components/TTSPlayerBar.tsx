import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Sliders,
  Check,
  RefreshCw,
  Sparkles,
  Loader2,
  AlertCircle,
  Radio,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { TTSSettings, StorytellerMode, UnitNarasi, AudioSourceType, GeminiVoiceId } from '../types';
import { SentenceUnit } from '../lib/sentenceParser';
import { DEFAULT_TTS_SETTINGS } from '../lib/storage';
import { TTSMonitorModal } from './TTSMonitorModal';

interface TTSPlayerBarProps {
  unit: UnitNarasi;
  nextUnit?: UnitNarasi;
  isPlaying: boolean;
  isPaused: boolean;
  isLoadingAudio?: boolean;
  currentIndex: number;
  totalSentences: number;
  currentSentence: SentenceUnit | null;
  isChapterEnded: boolean;
  settings: TTSSettings;
  availableVoices: SpeechSynthesisVoice[];
  audioSource?: AudioSourceType;
  hasStudioAudio?: boolean;
  errorMessage?: string | null;
  onPlay: (index?: number) => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateSettings: (settings: Partial<TTSSettings>) => void;
  onSetStorytellerMode?: (mode: StorytellerMode) => void;
  onNavigateToNextUnit?: () => void;
  onResetQuotaStatus?: () => void;
  onClearClientCache?: () => void;
}

interface GeminiVoiceOption {
  id: GeminiVoiceId;
  name: string;
  gender: string;
  desc: string;
}

const GEMINI_VOICES: GeminiVoiceOption[] = [
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Pria',
    desc: 'Dalam, tenang, berwibawa. Sangat cocok untuk kisah hidup dan renungan naskah novel.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Wanita',
    desc: 'Lembut, jernih, dan penuh penghayatan emosional.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Pria',
    desc: 'Teduh, mengalir santai, artikulasi kata jernih.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Pria',
    desc: 'Ekspresif, dinamis, hidup untuk dialog percakapan.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Pria',
    desc: 'Tegas, berat, dan berbobot mantap.',
  },
];

export const TTSPlayerBar: React.FC<TTSPlayerBarProps> = ({
  unit,
  nextUnit,
  isPlaying,
  isPaused,
  isLoadingAudio = false,
  currentIndex,
  totalSentences,
  currentSentence,
  isChapterEnded,
  settings,
  availableVoices,
  audioSource = 'gemini-server',
  errorMessage,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onUpdateSettings,
  onSetStorytellerMode,
  onNavigateToNextUnit,
  onResetQuotaStatus,
  onClearClientCache,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);

  // Keyboard shortcut: Escape untuk menutup modal opsi atau monitor
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMonitor) setShowMonitor(false);
        else if (showOptions) setShowOptions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOptions, showMonitor]);

  const speedPresets = [
    { label: '0.8x', value: 0.8, hint: 'Lambat' },
    { label: '1.0x', value: 1.0, hint: 'Normal' },
    { label: '1.2x', value: 1.2, hint: 'Cepat' },
  ];

  const progressPercent =
    totalSentences > 0 ? Math.round(((currentIndex + 1) / totalSentences) * 100) : 0;

  const currentGeminiVoice = settings.geminiVoice || 'Charon';

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_TTS_SETTINGS);
  };

  return (
    <>
      {/* 1. Bilah Pemutar Mengambang (Floating Player Bar) */}
      <div
        id="tts-floating-player"
        className="fixed z-40 border shadow-xl backdrop-blur-md transition-all duration-200 bottom-[max(0.75rem,env(safe-area-inset-bottom,12px))] left-3 right-3 sm:left-6 sm:right-6 max-w-2xl mx-auto rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Garis Progres Narasi Kalimat */}
        <div className="w-full h-1 bg-[var(--border-subtle)] overflow-hidden shrink-0">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${isChapterEnded ? 100 : progressPercent}%`,
              backgroundColor: 'var(--accent-color)',
            }}
          />
        </div>

        <div className="p-3 sm:p-4">
          {/* Layar Saat Bab Selesai */}
          {isChapterEnded ? (
            <div className="text-center py-2 px-1">
              <div
                className="text-xs font-serif italic mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Bab selesai dinarasikan
              </div>
              <h4 className="text-sm font-semibold mb-3">
                {nextUnit
                  ? `Lanjut dengarkan ${
                      nextUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${nextUnit.nomor}`
                    }: "${nextUnit.judul}"?`
                  : 'Anda telah mencapai akhir Bagian I'}
              </h4>
              <div className="flex items-center justify-center gap-2">
                <button
                  id="btn-tts-replay-chapter"
                  onClick={() => onPlay(0)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-panel)',
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ulangi Bab Ini</span>
                </button>
                {nextUnit && onNavigateToNextUnit && (
                  <button
                    id="btn-tts-next-chapter"
                    onClick={onNavigateToNextUnit}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-color)',
                      color: '#ffffff',
                    }}
                  >
                    <span>Bab Berikutnya</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header Status Bar Mini */}
              <div
                className="flex items-center justify-between gap-2 mb-2 pb-2 border-b text-xs"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--accent-color)' }}
                  />
                  <span className="font-serif font-medium truncate max-w-[130px] sm:max-w-[200px]">
                    {unit.nomor === 'Prolog' ? 'Prolog' : `Bab ${unit.nomor}`}: {unit.judul}
                  </span>
                  <span
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: 'var(--badge-bg)',
                      color: 'var(--badge-text)',
                    }}
                  >
                    {totalSentences > 0 ? `${currentIndex + 1}/${totalSentences}` : '0/0'}
                  </span>

                  {isLoadingAudio && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium animate-pulse"
                      style={{
                        backgroundColor: 'var(--accent-bg)',
                        color: 'var(--accent-color)',
                      }}
                    >
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Menyiapkan audio...</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Tombol Monitor Telemetri & Kuota Real-Time */}
                  <button
                    id="btn-tts-open-monitor"
                    onClick={() => setShowMonitor(true)}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-85 active:scale-95 transition-all"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-panel)',
                      color: 'var(--text-primary)',
                    }}
                    title="Monitor Kuota & Latensi Gemini Real-Time"
                  >
                    <Activity className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="hidden sm:inline">Monitor</span>
                  </button>

                  {/* Badge Sumber Audio Gemini Server */}
                  <button
                    id="btn-tts-source-indicator"
                    onClick={() => setShowOptions(true)}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                    style={{
                      borderColor: 'var(--accent-color)',
                      color: 'var(--accent-color)',
                      backgroundColor: 'var(--accent-bg)',
                    }}
                    title="Audio Studio Generatif Gemini aktif"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Gemini • {currentGeminiVoice}</span>
                  </button>

                  {/* Tombol Pengaturan Suara */}
                  <button
                    id="btn-tts-toggle-options"
                    onClick={() => setShowOptions(true)}
                    title="Pengaturan Suara Narasi"
                    aria-label="Buka pengaturan suara narasi"
                    className="flex items-center justify-center min-h-[36px] min-w-[36px] p-1.5 rounded-lg hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  {/* Tombol Tutup Player */}
                  <button
                    id="btn-tts-close-player"
                    onClick={onStop}
                    title="Tutup Pemutar Suara"
                    aria-label="Tutup pemutar suara"
                    className="flex items-center justify-center min-h-[36px] min-w-[36px] p-1.5 rounded-lg hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teks Kalimat yang Sedang Disuarakan */}
              {currentSentence && (
                <div className="mb-2.5 px-1">
                  <p
                    className="text-xs italic font-serif truncate line-clamp-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {currentSentence.isDialogue
                      ? `\u201C${currentSentence.text.replace(/^[“"']+|[”"']+$/g, '')}\u201D`
                      : currentSentence.text}
                  </p>
                </div>
              )}

              {/* Notifikasi Peringatan (Jika ada fallback) */}
              {errorMessage && (
                <div className="mb-2 px-2 py-1 rounded text-[11px] flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}

              {/* Baris Kontrol Utama */}
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                {/* Pilihan Kecepatan */}
                <div className="flex items-center gap-1">
                  {speedPresets.map((preset) => {
                    const isCurrent = Math.abs(settings.rate - preset.value) < 0.05;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => onUpdateSettings({ rate: preset.value })}
                        aria-label={`Kecepatan ${preset.label}`}
                        className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: isCurrent ? 'var(--accent-color)' : 'var(--bg-panel)',
                          color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Kontrol Navigasi & Putar */}
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <button
                    id="btn-tts-prev-sentence"
                    onClick={onPrev}
                    title="Kalimat Sebelumnya"
                    aria-label="Kalimat sebelumnya"
                    className="flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-full hover:opacity-80 active:scale-95 transition-all border cursor-pointer"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-panel)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {isPlaying ? (
                    <button
                      id="btn-tts-pause"
                      onClick={onPause}
                      title="Jeda Pembacaan"
                      aria-label="Jeda pembacaan"
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 sm:p-3 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-color)',
                        color: '#ffffff',
                      }}
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Pause className="w-5 h-5 fill-current" />
                      )}
                    </button>
                  ) : (
                    <button
                      id="btn-tts-play"
                      onClick={() => onPlay()}
                      title="Mulai / Lanjutkan Pembacaan"
                      aria-label="Mulai pembacaan"
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 sm:p-3 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-color)',
                        color: '#ffffff',
                      }}
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      )}
                    </button>
                  )}

                  <button
                    id="btn-tts-next-sentence"
                    onClick={onNext}
                    title="Kalimat Berikutnya"
                    aria-label="Kalimat berikutnya"
                    className="flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-full hover:opacity-80 active:scale-95 transition-all border cursor-pointer"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-panel)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Dialog / Modal Pengaturan Suara Narasi */}
      {showOptions && (
        <div
          id="tts-options-overlay"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setShowOptions(false)}
        >
          <div
            id="tts-options-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tts-options-title"
            className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] border-t sm:border shadow-2xl rounded-t-3xl sm:rounded-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mt-2.5 mb-1 sm:hidden opacity-30"
              style={{ backgroundColor: 'var(--text-secondary)' }}
            />

            {/* Header Dialog */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-3.5 border-b shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div>
                <h3
                  id="tts-options-title"
                  className="text-base font-serif font-bold tracking-tight"
                >
                  Pengaturan Narator Audio
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Sintesis Suara Gemini Studio & Penyelarasan Naskah
                </p>
              </div>
              <button
                id="btn-close-tts-options"
                onClick={() => setShowOptions(false)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                aria-label="Tutup pengaturan suara"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 text-xs">
              {/* Seksi Pilihan Suara Karakter Gemini */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                    <span>Pilihan Karakter Narator Gemini</span>
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--accent-bg)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    Studio HD
                  </span>
                </label>

                <div className="space-y-2">
                  {GEMINI_VOICES.map((v) => {
                    const isSelected = currentGeminiVoice === v.id;
                    return (
                      <button
                        key={v.id}
                        id={`btn-voice-${v.id.toLowerCase()}`}
                        onClick={() =>
                          onUpdateSettings({
                            geminiVoice: v.id,
                            engine: 'gemini-server',
                          })
                        }
                        className="w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer active:scale-98"
                        style={{
                          borderColor: isSelected
                            ? 'var(--accent-color)'
                            : 'var(--border-subtle)',
                          backgroundColor: isSelected
                            ? 'var(--accent-bg)'
                            : 'var(--bg-surface)',
                        }}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-xs">{v.name}</span>
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded font-mono"
                              style={{
                                backgroundColor: 'var(--badge-bg)',
                                color: 'var(--badge-text)',
                              }}
                            >
                              {v.gender}
                            </span>
                            {v.id === 'Charon' && (
                              <span
                                className="text-[10px] px-1.5 py-0.2 rounded font-medium"
                                style={{
                                  backgroundColor: 'var(--border-subtle)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                Rekomendasi
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[11px] leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {v.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <Check
                            className="w-4 h-4 shrink-0 mt-0.5"
                            style={{ color: 'var(--accent-color)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Mesin (Engine) */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Radio className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                  <span>Mesin Pemrosesan Audio</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-engine-gemini"
                    onClick={() => onUpdateSettings({ engine: 'gemini-server' })}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                    style={{
                      borderColor:
                        settings.engine === 'gemini-server' || !settings.engine
                          ? 'var(--accent-color)'
                          : 'var(--border-subtle)',
                      backgroundColor:
                        settings.engine === 'gemini-server' || !settings.engine
                          ? 'var(--accent-bg)'
                          : 'var(--bg-surface)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs">Gemini Server (Opsi C)</span>
                      {(settings.engine === 'gemini-server' || !settings.engine) && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                      )}
                    </div>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Suara narasi hidup alami berkualitas tinggi dari model Gemini TTS.
                    </p>
                  </button>

                  <button
                    id="btn-engine-webspeech"
                    onClick={() => onUpdateSettings({ engine: 'web-speech' })}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                    style={{
                      borderColor:
                        settings.engine === 'web-speech'
                          ? 'var(--accent-color)'
                          : 'var(--border-subtle)',
                      backgroundColor:
                        settings.engine === 'web-speech'
                          ? 'var(--accent-bg)'
                          : 'var(--bg-surface)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs">Web Speech (Lokal)</span>
                      {settings.engine === 'web-speech' && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                      )}
                    </div>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Sintesis bawaan peramban (berguna jika sedang offline tanpa internet).
                    </p>
                  </button>
                </div>
              </div>

              {/* Akses Cepat Monitor Kuota & Telemetri Real-time */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-bg)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs truncate">Monitor Status & Kuota Gemini</div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      Pantau sisa kuota, latensi respon ms, dan log transaksi nyata
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-open-monitor-from-options"
                  onClick={() => {
                    setShowOptions(false);
                    setShowMonitor(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer shrink-0 hover:opacity-80 active:scale-95 transition-all"
                  style={{
                    borderColor: 'var(--accent-color)',
                    color: 'var(--accent-color)',
                    backgroundColor: 'var(--accent-bg)',
                  }}
                >
                  Buka Monitor
                </button>
              </div>

              {/* Saklar Penyelarasan Baca (Auto-scroll & Natural Pauses) */}
              <div
                className="p-3.5 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {/* Auto Scroll */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-xs">Penyelarasan Gulir Layar (Auto-Scroll)</div>
                    <div
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Menggulir layar secara lembut saat kalimat yang disorot mendekati batas pandang
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.autoScroll}
                    onClick={() => onUpdateSettings({ autoScroll: !settings.autoScroll })}
                    className="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                    style={{
                      backgroundColor: settings.autoScroll
                        ? 'var(--accent-color)'
                        : 'var(--border-color)',
                    }}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                        settings.autoScroll ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Natural Pauses */}
                <div
                  className="flex items-center justify-between gap-3 pt-2.5 border-t"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-xs">Irama Napas Sastra Alami</div>
                    <div
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Jeda hening napas antar alinea dan jeda pergantian adegan (• • •)
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.naturalPauses}
                    onClick={() => onUpdateSettings({ naturalPauses: !settings.naturalPauses })}
                    className="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                    style={{
                      backgroundColor: settings.naturalPauses
                        ? 'var(--accent-color)'
                        : 'var(--border-color)',
                    }}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                        settings.naturalPauses ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Slider Kecepatan */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Kecepatan Narasi:</span>
                  <span className="font-mono font-medium">{settings.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.3"
                  step="0.05"
                  value={settings.rate}
                  onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer h-2 rounded-lg bg-[var(--border-color)]"
                  style={{ accentColor: 'var(--accent-color)' }}
                />
              </div>
            </div>

            {/* Footer Sticky */}
            <div
              className="px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom,16px))]"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <button
                id="btn-reset-tts-settings"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-panel)',
                  color: 'var(--text-secondary)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset Default</span>
              </button>

              <button
                id="btn-done-tts-options"
                onClick={() => setShowOptions(false)}
                className="flex items-center justify-center min-h-[44px] px-5 py-2 rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Monitor Telemetri & Kuota Real-time Gemini */}
      <TTSMonitorModal
        isOpen={showMonitor}
        onClose={() => setShowMonitor(false)}
        onResetQuotaStatus={onResetQuotaStatus}
        onClearClientCache={onClearClientCache}
      />
    </>
  );
};
