import React from 'react';
import { Sliders, BookOpen, Volume2 } from 'lucide-react';

interface ReaderFooterProps {
  scrollProgress: number;
  isVisible: boolean;
  isTTSOpen?: boolean;
  onOpenSettings: () => void;
  onOpenTOC: () => void;
  onToggleTTS?: () => void;
  isTTSActive?: boolean;
}

/**
 * Footer mode baca minimalis:
 * - Muncul saat scroll ke atas atau disentuh, auto-hide saat scroll ke bawah.
 * - Satu garis progres tipis dengan persentase kecil di ujung.
 * - Tombol akses cepat ke Tampilan dan Daftar Isi.
 * - Tanpa background solid tebal (gradient fade tipis).
 */
export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  scrollProgress,
  isVisible,
  isTTSOpen = false,
  onOpenSettings,
  onOpenTOC,
  onToggleTTS,
  isTTSActive = false,
}) => {
  // Jika pemutar TTS sedang terbuka, footer mode baca mengalah ke pemutar TTS
  const shouldShow = isVisible && !isTTSOpen;

  return (
    <footer
      id="reader-floating-footer"
      className={`fixed bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out select-none border-t ${
        shouldShow
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundColor: 'var(--bg-page)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
      }}
      aria-label="Navigasi Bawah Mode Baca"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,10px))]">
        {/* Garis progres ultra-tipis (bukan progress bar aplikasi yang tebal) */}
        <div
          className="w-full h-[2px] rounded-full overflow-hidden mb-1.5"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        >
          <div
            className="h-full transition-all duration-150 ease-out"
            style={{
              width: `${Math.min(100, Math.max(0, scrollProgress))}%`,
              backgroundColor: 'var(--quote-accent)',
            }}
          />
        </div>

        {/* Baris kontrol ringkas */}
        <div className="flex items-center justify-between text-xs min-h-[44px]">
          {/* Kiri: Daftar Isi & TTS */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="footer-btn-toc"
              onClick={onOpenTOC}
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-100 active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
              title="Buka Daftar Isi"
              aria-label="Buka Daftar Isi Novel"
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-serif">Daftar Isi</span>
            </button>

            {onToggleTTS && (
              <button
                id="footer-btn-tts"
                onClick={onToggleTTS}
                className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-100 active:scale-95"
                style={{
                  color: isTTSActive ? 'var(--quote-accent)' : 'var(--text-secondary)',
                  backgroundColor: isTTSActive ? 'var(--accent-bg)' : 'transparent',
                }}
                title={isTTSActive ? 'Tutup Pemutar Suara' : 'Dengarkan Naskah (TTS)'}
                aria-label={isTTSActive ? 'Tutup pemutar suara naskah' : 'Dengarkan pembacaan naskah (suara narator)'}
              >
                <Volume2 className={`w-4 h-4 ${isTTSActive ? 'animate-pulse' : ''}`} />
                <span className="font-serif">Dengar</span>
              </button>
            )}
          </div>

          {/* Kanan: Tombol Tampilan dan Persentase baca kecil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="footer-btn-settings"
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-100 active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
              title="Atur Ukuran Huruf, Tema & Tipografi"
              aria-label="Buka pengaturan tampilan dan tipografi baca"
            >
              <Sliders className="w-4 h-4" />
              <span className="font-serif">Tampilan</span>
            </button>

            {/* Persentase kecil di ujung */}
            <span
              id="footer-reading-percentage"
              className="font-mono text-[11px] tabular-nums tracking-wider px-2 py-1 rounded-md"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--badge-bg)',
              }}
              title="Kemajuan membaca bab saat ini"
              aria-label={`Kemajuan membaca: ${Math.min(100, Math.max(0, scrollProgress))} persen`}
            >
              {Math.min(100, Math.max(0, scrollProgress))}%
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
