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
  Feather,
  RotateCcw,
} from 'lucide-react';
import { TTSSettings, StorytellerMode, UnitNarasi } from '../types';
import { SentenceUnit } from '../lib/sentenceParser';
import { DEFAULT_TTS_SETTINGS } from '../lib/storage';

interface TTSPlayerBarProps {
  unit: UnitNarasi;
  nextUnit?: UnitNarasi;
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalSentences: number;
  currentSentence: SentenceUnit | null;
  isChapterEnded: boolean;
  settings: TTSSettings;
  availableVoices: SpeechSynthesisVoice[];
  onPlay: (index?: number) => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateSettings: (settings: Partial<TTSSettings>) => void;
  onSetStorytellerMode?: (mode: StorytellerMode) => void;
  onNavigateToNextUnit?: () => void;
}

export const TTSPlayerBar: React.FC<TTSPlayerBarProps> = ({
  unit,
  nextUnit,
  isPlaying,
  isPaused,
  currentIndex,
  totalSentences,
  currentSentence,
  isChapterEnded,
  settings,
  availableVoices,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onUpdateSettings,
  onSetStorytellerMode,
  onNavigateToNextUnit,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  // Dukungan tombol Escape untuk menutup panel opsi TTS
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOptions) {
        setShowOptions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOptions]);

  const speedPresets = [
    { label: '0.8x', value: 0.8, hint: 'Renung' },
    { label: '0.88x', value: 0.88, hint: 'Hikayat' },
    { label: '0.95x', value: 0.95, hint: 'Wicara' },
    { label: '1.1x', value: 1.1, hint: 'Cepat' },
  ];

  const progressPercent = totalSentences > 0 ? Math.round(((currentIndex + 1) / totalSentences) * 100) : 0;

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_TTS_SETTINGS);
  };

  return (
    <>
      {/* 1. Floating Mini Player Bar */}
      <div
        id="tts-floating-player"
        className="fixed z-40 border shadow-xl backdrop-blur-md transition-all duration-200 bottom-[max(0.75rem,env(safe-area-inset-bottom,12px))] left-3 right-3 sm:left-6 sm:right-6 max-w-2xl mx-auto rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Progress Line */}
        <div className="w-full h-1 bg-[var(--border-subtle)] overflow-hidden shrink-0">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${isChapterEnded ? 100 : progressPercent}%`,
              backgroundColor: 'var(--accent-color)',
            }}
          />
        </div>

        <div className="p-3 sm:p-4">
          {/* Banner Jeda Otomatis di Ujung Bab */}
          {isChapterEnded ? (
            <div className="text-center py-2 px-1">
              <div className="text-xs font-serif italic mb-1" style={{ color: 'var(--text-secondary)' }}>
                Bab selesai dibacakan
              </div>
              <h4 className="text-sm font-semibold mb-3">
                {nextUnit
                  ? `Lanjut dengarkan ${nextUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${nextUnit.nomor}`}: "${nextUnit.judul}"?`
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
              {/* Header Mini Status Bar */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
                  <span className="font-serif font-medium truncate max-w-[130px] sm:max-w-[220px]">
                    {unit.nomor === 'Prolog' ? 'Prolog' : `Bab ${unit.nomor}`}: {unit.judul}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
                    {totalSentences > 0 ? `${currentIndex + 1}/${totalSentences}` : '0/0'}
                  </span>
                  {currentSentence?.isDialogue && (
                    <span
                      className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                      style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-color)' }}
                    >
                      Dialog
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Gaya Mode Indicator Badge */}
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded border"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {settings.mode === 'hikayat' ? 'Hikayat' : settings.mode === 'renung' ? 'Renung' : 'Wicara'}
                  </span>

                  {/* Tombol Opsi / Pengaturan Narasi */}
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

              {/* Current Sentence Snippet Display */}
              {currentSentence && (
                <div className="mb-2.5 px-1">
                  <p className="text-xs italic font-serif truncate line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                    {currentSentence.isDialogue ? `\u201C${currentSentence.text.replace(/^[“"']+|[”"']+$/g, '')}\u201D` : currentSentence.text}
                  </p>
                </div>
              )}

              {/* Main Controls Row */}
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                {/* Speed Buttons */}
                <div className="flex items-center gap-1">
                  {speedPresets.map((preset) => {
                    const isCurrent = Math.abs(settings.rate - preset.value) < 0.03;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => onUpdateSettings({ rate: preset.value })}
                        aria-label={`Kecepatan suara narasi ${preset.label}${preset.hint ? ` mode ${preset.hint}` : ''}`}
                        className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: isCurrent ? 'var(--accent-color)' : 'var(--bg-panel)',
                          color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                        }}
                        title={preset.hint ? `${preset.label} (${preset.hint})` : preset.label}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Playback Controls */}
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
                      <Pause className="w-5 h-5 fill-current" />
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
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
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

      {/* 2. Dedicated Modal / Bottom Sheet: Pengaturan Suara Narasi */}
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

            {/* Sticky Header */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-3.5 border-b shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div>
                <h3 id="tts-options-title" className="text-base font-serif font-bold tracking-tight">
                  Pengaturan Suara Narasi
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Karakter pembacaan, tempo, dan jeda sastra
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 text-xs">
              {/* Gaya Narasi Pendongeng (Storyteller Presets) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Feather className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                  <span>Gaya Narasi Pendongeng</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. Hikayat Santai */}
                  <button
                    onClick={() => onSetStorytellerMode?.('hikayat')}
                    className="p-3 rounded-xl border text-left transition-all flex flex-col justify-between active:scale-98 cursor-pointer"
                    style={{
                      borderColor: settings.mode === 'hikayat' ? 'var(--accent-color)' : 'var(--border-subtle)',
                      backgroundColor: settings.mode === 'hikayat' ? 'var(--accent-bg)' : 'var(--bg-surface)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs">Hikayat Santai</span>
                      {settings.mode === 'hikayat' && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Tempo 0.88x, nada hangat & jeda napas pas. Karakter novel klasik.
                    </p>
                  </button>

                  {/* 2. Renung Puitis */}
                  <button
                    onClick={() => onSetStorytellerMode?.('renung')}
                    className="p-3 rounded-xl border text-left transition-all flex flex-col justify-between active:scale-98 cursor-pointer"
                    style={{
                      borderColor: settings.mode === 'renung' ? 'var(--accent-color)' : 'var(--border-subtle)',
                      backgroundColor: settings.mode === 'renung' ? 'var(--accent-bg)' : 'var(--bg-surface)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs">Renung Puitis</span>
                      {settings.mode === 'renung' && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Tempo 0.80x, reflektif lambat & jeda hening luas. Khusyuk dan tenang.
                    </p>
                  </button>

                  {/* 3. Wicara Standar */}
                  <button
                    onClick={() => onSetStorytellerMode?.('wajar')}
                    className="p-3 rounded-xl border text-left transition-all flex flex-col justify-between active:scale-98 cursor-pointer"
                    style={{
                      borderColor: settings.mode === 'wajar' ? 'var(--accent-color)' : 'var(--border-subtle)',
                      backgroundColor: settings.mode === 'wajar' ? 'var(--accent-bg)' : 'var(--bg-surface)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs">Wicara Standar</span>
                      {settings.mode === 'wajar' && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Tempo 0.98x, tanpa jeda panjang. Efisien untuk meninjau naskah.
                    </p>
                  </button>
                </div>
              </div>

              {/* Parameter Sastra: Irama Napas & Modulasi Dialog */}
              <div
                className="p-3.5 rounded-xl border space-y-3"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-xs">Irama Napas Alami</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Jeda khusus tanda baca sastra, alinea baru (0.9s), dan jeda adegan (1.8s)
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.naturalPauses}
                    onClick={() => onUpdateSettings({ naturalPauses: !settings.naturalPauses })}
                    className="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                    style={{
                      backgroundColor: settings.naturalPauses ? 'var(--accent-color)' : 'var(--border-color)',
                    }}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                        settings.naturalPauses ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div
                  className="flex items-center justify-between gap-3 pt-2.5 border-t"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-xs">Modulasi Dialog Tokoh</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Penyesuaian intonasi mikro saat karakter novel berbicara
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.dialogueModulation}
                    onClick={() => onUpdateSettings({ dialogueModulation: !settings.dialogueModulation })}
                    className="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                    style={{
                      backgroundColor: settings.dialogueModulation ? 'var(--accent-color)' : 'var(--border-color)',
                    }}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                        settings.dialogueModulation ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Slider Presisi Kecepatan & Karakter Nada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>Kecepatan Narasi:</span>
                    <span className="font-mono font-medium">{settings.rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.3"
                    step="0.02"
                    value={settings.rate}
                    onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer h-2 rounded-lg bg-[var(--border-color)]"
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>Karakter Nada (Pitch):</span>
                    <span className="font-mono font-medium">{settings.pitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="1.15"
                    step="0.02"
                    value={settings.pitch}
                    onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer h-2 rounded-lg bg-[var(--border-color)]"
                    style={{ accentColor: 'var(--accent-color)' }}
                  />
                </div>
              </div>

              {/* Pilihan Karakter Suara Sistem (Jika ada suara Web Speech) */}
              {availableVoices.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Pilihan Suara Sistem Perangkat
                  </label>
                  <select
                    value={settings.voiceURI || ''}
                    onChange={(e) => onUpdateSettings({ voiceURI: e.target.value || undefined })}
                    className="w-full p-2.5 rounded-xl border text-xs font-sans cursor-pointer outline-hidden"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">Otomatis (Diprioritaskan Suara Natural / WaveNet)</option>
                    {availableVoices.map((v) => {
                      const isPremium = /natural|wavenet|online|google|damayanti|enhanced|premium/i.test(v.name);
                      return (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} {isPremium ? '★ (Alami)' : ''} ({v.lang})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Gulir Otomatis Mengikuti Kalimat Berjalan */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-xs">Gulir Otomatis Mengikuti Kalimat Berjalan</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Otomatis memusatkan posisi teks kalimat yang sedang disuarakan di layar
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoScroll}
                  onClick={() => onUpdateSettings({ autoScroll: !settings.autoScroll })}
                  className="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                  style={{
                    backgroundColor: settings.autoScroll ? 'var(--accent-color)' : 'var(--border-color)',
                  }}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${
                      settings.autoScroll ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Sticky Footer Actions with Safe Area Inset Protection */}
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
                <span>Reset ke Standar</span>
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
    </>
  );
};

