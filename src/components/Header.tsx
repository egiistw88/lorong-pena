import React from 'react';
import { BookOpen, Sliders, Home, ChevronLeft, Volume2 } from 'lucide-react';
import { UnitNarasi } from '../types';

interface HeaderProps {
  currentUnit?: UnitNarasi;
  scrollProgress: number;
  onOpenHome: () => void;
  onOpenTOC: () => void;
  onOpenSettings: () => void;
  onToggleTTS?: () => void;
  isTTSActive?: boolean;
  isReadingMode: boolean;
  isVisible?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUnit,
  onOpenHome,
  onOpenTOC,
  onOpenSettings,
  onToggleTTS,
  isTTSActive = false,
  isReadingMode,
  isVisible = true,
}) => {
  return (
    <header
      id="app-header"
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-out select-none pt-[env(safe-area-inset-top,0px)] ${
        isReadingMode
          ? isVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100 border-b'
      }`}
      style={{
        background: isReadingMode
          ? 'var(--bg-page)'
          : 'var(--bg-page)',
        borderColor: isReadingMode ? 'var(--border-subtle)' : 'var(--border-color)',
        boxShadow: isReadingMode ? '0 1px 3px rgba(0, 0, 0, 0.03)' : undefined,
      }}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2">
        {/* Kiri: Tombol kembali / Beranda */}
        <div className="flex items-center shrink-0">
          <button
            id="btn-nav-home"
            onClick={onOpenHome}
            title="Kembali ke Beranda"
            aria-label={isReadingMode ? "Kembali ke Beranda Novel" : "Beranda Novel Yakin?"}
            className="flex items-center gap-1 min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:opacity-100 active:scale-95 focus:outline-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isReadingMode ? (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="font-serif">Beranda</span>
              </>
            ) : (
              <>
                <Home className="w-4 h-4 shrink-0" />
                <span className="font-serif font-bold tracking-tight text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                  Yakin?
                </span>
              </>
            )}
          </button>
        </div>

        {/* Tengah: Indikator posisi ringkas ("Bab I.3" atau "Prolog"), tanpa breadcrumb penuh */}
        {isReadingMode && currentUnit && (
          <div
            id="header-unit-indicator"
            className="flex-1 min-w-0 text-xs sm:text-sm font-serif tracking-widest text-center truncate uppercase opacity-75 px-1"
            style={{ color: 'var(--text-secondary)' }}
            title={currentUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${currentUnit.nomor}`}
            aria-label={`Sedang membaca: ${currentUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${currentUnit.nomor}`}`}
          >
            {currentUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${currentUnit.nomor}`}
          </div>
        )}

        {/* Kanan: TTS, Daftar Isi, & Pengaturan */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          {isReadingMode && onToggleTTS && (
            <button
              id="btn-toggle-tts"
              onClick={onToggleTTS}
              title={isTTSActive ? 'Tutup Pemutar Suara' : 'Dengarkan Naskah (TTS)'}
              aria-label={isTTSActive ? 'Tutup pemutar suara naskah' : 'Dengarkan pembacaan naskah (suara narator)'}
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:opacity-100 active:scale-95"
              style={{
                color: isTTSActive ? 'var(--quote-accent)' : 'var(--text-secondary)',
                backgroundColor: isTTSActive ? 'var(--accent-bg)' : 'transparent',
              }}
            >
              <Volume2 className={`w-4 h-4 ${isTTSActive ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline font-serif">
                {isTTSActive ? 'Mendengarkan' : 'Dengar'}
              </span>
            </button>
          )}

          <button
            id="btn-open-toc"
            onClick={onOpenTOC}
            title="Daftar Isi"
            aria-label="Buka daftar isi kanon novel"
            className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:opacity-100 active:scale-95"
            style={{ color: 'var(--text-secondary)' }}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline font-serif">Daftar Isi</span>
          </button>

          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            title="Pengaturan Tampilan"
            aria-label="Buka pengaturan tampilan dan tipografi baca"
            className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:opacity-100 active:scale-95"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline font-serif">Tampilan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
