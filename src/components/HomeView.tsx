import React from 'react';
import { BookOpen, ArrowRight, UploadCloud, Sliders, Volume2 } from 'lucide-react';
import { UnitNarasi, ReadingProgress } from '../types';
import { NOVEL_METADATA } from '../content/meta';

interface HomeViewProps {
  lastReadUnit: UnitNarasi;
  units: UnitNarasi[];
  progress: ReadingProgress;
  onResumeReading: () => void;
  onOpenTOC: () => void;
  onOpenSettings?: () => void;
  onOpenImportModal: () => void;
  onListenTTS?: () => void;
  hasStudioAudio?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lastReadUnit,
  units,
  progress,
  onResumeReading,
  onOpenTOC,
  onOpenSettings,
  onOpenImportModal,
  onListenTTS,
  hasStudioAudio = false,
}) => {
  const completedCount = progress.completedUnitIds.length;
  const totalUnits = units.length;
  const progressPercent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;
  const isJustStarting = completedCount === 0 && lastReadUnit.id === 'prolog';
  const savedScroll = progress.unitScrollPercentages?.[lastReadUnit.id] ?? progress.scrollPercentage ?? 0;

  return (
    <div
      id="home-view-container"
      className="min-h-screen flex flex-col justify-between pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,12px))] px-4 sm:px-6 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center py-4 sm:py-6">
        {/* Cover Buku Novel Asli */}
        <div className="relative group mb-6 sm:mb-7">
          <div
            className="w-40 sm:w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 group-hover:shadow-3xl"
            style={{
              borderColor: 'var(--border-subtle)',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.22), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <img
              src="/cover.jpg"
              alt="Sampul Novel Yakin? - Perjalanan Hidup Zayd karya Eugui Sett"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </div>
        </div>

        {/* Tipografi Judul & Pengarang (Sangat Minimalis & Sesuai Cover) */}
        <div className="text-center mb-7 sm:mb-8 w-full px-2">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-2">
            {NOVEL_METADATA.judul}
          </h1>

          {/* Ornamen Wajik Sebagaimana di Sampul Asli */}
          <div className="flex items-center justify-center gap-3 my-2 opacity-60">
            <span className="h-px w-8 bg-current opacity-30" />
            <span className="text-[9px] transform rotate-45 border border-current w-2 h-2 inline-block opacity-75" />
            <span className="h-px w-8 bg-current opacity-30" />
          </div>

          <p className="text-base sm:text-lg font-serif italic" style={{ color: 'var(--text-secondary)' }}>
            {NOVEL_METADATA.subjudul}
          </p>

          <p className="text-[11px] font-mono tracking-[0.2em] uppercase mt-2.5" style={{ color: 'var(--text-tertiary)' }}>
            {NOVEL_METADATA.penulis} {NOVEL_METADATA.kota ? `\u2014 ${NOVEL_METADATA.kota}` : ''}
          </p>
        </div>

        {/* Tindakan Utama (Sangat Ringkas & User Friendly) */}
        <div className="w-full space-y-3 mb-6">
          {/* 1. Tombol Utama: Mulai / Lanjutkan Membaca */}
          <button
            id="btn-resume-reading"
            onClick={onResumeReading}
            className="w-full min-h-[54px] px-5 py-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 shadow-xs hover:shadow-md active:scale-98 cursor-pointer group"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
            }}
          >
            <div className="text-left min-w-0 pr-3">
              <div className="text-[10px] uppercase font-mono tracking-wider opacity-90 mb-0.5">
                {isJustStarting
                  ? 'Mulai Membaca'
                  : savedScroll > 2
                  ? `Lanjutkan Membaca \u2022 ${savedScroll}%`
                  : 'Lanjutkan Membaca'}
              </div>
              <div className="text-base font-serif font-bold truncate">
                {lastReadUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${lastReadUnit.nomor}`}: {lastReadUnit.judul}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/20 group-hover:translate-x-1 transition-transform shrink-0">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* 2. Tombol Dengarkan Audio Narasi (TTS) */}
          {onListenTTS && (
            <button
              id="btn-home-listen-tts"
              onClick={onListenTTS}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-all hover:opacity-90 active:scale-98 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Volume2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
                <div className="text-left min-w-0">
                  <div className="text-sm font-serif font-medium truncate">Dengarkan Narasi Novel</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    Suara studio Gemini & sorotan aktif bab ini
                  </div>
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 flex items-center gap-1"
                style={{
                  borderColor: 'var(--accent-color)',
                  color: 'var(--accent-color)',
                  backgroundColor: 'var(--accent-bg)',
                }}
              >
                Gemini Audio
              </span>
            </button>
          )}

          {/* 3. Tombol Daftar Isi & Navigasi Bab */}
          <button
            id="btn-home-open-toc"
            onClick={onOpenTOC}
            className="w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-all hover:opacity-90 active:scale-98 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
              <span className="text-sm font-serif font-medium truncate">Daftar Isi</span>
            </div>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
              style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
            >
              {totalUnits} Bab Tersedia
            </span>
          </button>

          {/* 3. Baris Ringkas: Pengaturan Tampilan & Kelola Berkas */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {onOpenSettings && (
              <button
                id="btn-home-open-settings"
                onClick={onOpenSettings}
                className="min-h-[42px] px-3 py-2 rounded-xl border flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98 cursor-pointer text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-color)' }} />
                <span>Atur Tampilan</span>
              </button>
            )}

            <button
              id="btn-open-manuscript-import"
              onClick={onOpenImportModal}
              className="min-h-[42px] px-3 py-2 rounded-xl border flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98 cursor-pointer text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <UploadCloud className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-color)' }} />
              <span>Kelola Naskah</span>
            </button>
          </div>
        </div>

        {/* Progres Membaca Ringkas (Garis Tipis Bersih, Tanpa Kartu Menumpuk) */}
        <div className="w-full pt-1 px-1">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span>Progres Membaca</span>
            <span>{completedCount} / {totalUnits} Bab ({progressPercent}%)</span>
          </div>
          <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-color)',
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer Bersih & Tenang */}
      <footer className="text-center text-xs font-serif pt-4" style={{ color: 'var(--text-tertiary)' }}>
        {NOVEL_METADATA.judul} &mdash; {NOVEL_METADATA.subjudul} &bull; {NOVEL_METADATA.penulis}
      </footer>
    </div>
  );
};
