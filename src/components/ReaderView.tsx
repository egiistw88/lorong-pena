import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Check } from 'lucide-react';
import { UnitNarasi, ReaderSettings } from '../types';
import { formatReadingTime } from '../lib/readingTime';
import { IlluminatedDropCap } from './IlluminatedDropCap';
import { SceneBreak } from './SceneBreak';
import { ScrollParagraph } from './ScrollParagraph';
import { ChapterOrnamentDivider } from './ChapterOrnamentDivider';
import { splitParagraphIntoSentences } from '../lib/sentenceParser';

interface ReaderViewProps {
  unit: UnitNarasi;
  previousUnit?: UnitNarasi;
  nextUnit?: UnitNarasi;
  settings: ReaderSettings;
  onNavigateToUnit: (unitId: string) => void;
  onOpenTOC: () => void;
  onScrollProgressChange: (progress: number) => void;
  onMarkUnitCompleted: (unitId: string) => void;
  isCompleted: boolean;
  activeSentenceId?: string | null;
  onSentenceClick?: (sentenceId: string) => void;
  isTTSOpen?: boolean;
  onChromeVisibilityChange?: (visible: boolean) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  unit,
  previousUnit,
  nextUnit,
  settings,
  onNavigateToUnit,
  onOpenTOC,
  onScrollProgressChange,
  onMarkUnitCompleted,
  isCompleted,
  activeSentenceId,
  onSentenceClick,
  isTTSOpen = false,
  onChromeVisibilityChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [isFastScrolling, setIsFastScrolling] = useState(false);

  // Velocity tracking ref untuk bypass animasi saat pembaca scroll cepat
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const fastScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Store callbacks in refs to prevent re-binding or effect re-triggering during scrolling
  const onScrollProgressChangeRef = useRef(onScrollProgressChange);
  onScrollProgressChangeRef.current = onScrollProgressChange;

  const onMarkUnitCompletedRef = useRef(onMarkUnitCompleted);
  onMarkUnitCompletedRef.current = onMarkUnitCompleted;

  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;

  const onChromeVisibilityChangeRef = useRef(onChromeVisibilityChange);
  onChromeVisibilityChangeRef.current = onChromeVisibilityChange;
  const lastScrollYPos = useRef(0);

  // 1. Reset window scroll to top ONLY when unit.id changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setHasScrolledToEnd(false);
    setIsFastScrolling(false);
    lastScrollY.current = 0;
    lastScrollYPos.current = 0;
    lastScrollTime.current = Date.now();
    onChromeVisibilityChangeRef.current?.(true);
  }, [unit.id]);

  // 2. Track scroll position without ever resetting scroll
  useEffect(() => {
    let lastPercentage = -1;

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const now = Date.now();

      // Deteksi arah scroll untuk auto-hide chrome
      const deltaScroll = scrollY - lastScrollYPos.current;
      if (scrollY < 50) {
        onChromeVisibilityChangeRef.current?.(true);
      } else if (deltaScroll > 12) {
        // Scroll ke bawah: sembunyikan chrome agar pembaca terhanyut dalam teks
        onChromeVisibilityChangeRef.current?.(false);
      } else if (deltaScroll < -8) {
        // Scroll ke atas: tampilkan kembali chrome
        onChromeVisibilityChangeRef.current?.(true);
      }
      lastScrollYPos.current = scrollY;

      // Deteksi kecepatan scroll
      const deltaY = Math.abs(scrollY - lastScrollY.current);
      const deltaTime = Math.max(1, now - lastScrollTime.current);
      const velocity = deltaY / deltaTime; // pixel per ms

      lastScrollY.current = scrollY;
      lastScrollTime.current = now;

      if (velocity > 1.2) {
        setIsFastScrolling(true);
        if (fastScrollTimeout.current) {
          clearTimeout(fastScrollTimeout.current);
        }
        fastScrollTimeout.current = setTimeout(() => {
          setIsFastScrolling(false);
        }, 250);
      }

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight > 0) {
        const percentage = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
        if (percentage !== lastPercentage) {
          lastPercentage = percentage;
          onScrollProgressChangeRef.current(percentage);
        }

        // Tandai selesai dibaca jika mencapai 85% atau dasar bab
        if (percentage >= 85 && !isCompletedRef.current) {
          setHasScrolledToEnd(true);
          onMarkUnitCompletedRef.current(unit.id);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial scroll check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (fastScrollTimeout.current) {
        clearTimeout(fastScrollTimeout.current);
      }
    };
  }, [unit.id]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft' && previousUnit) {
        e.preventDefault();
        onNavigateToUnit(previousUnit.id);
      } else if (e.key === 'ArrowRight' && nextUnit) {
        e.preventDefault();
        onNavigateToUnit(nextUnit.id);
      }
    },
    [previousUnit, nextUnit, onNavigateToUnit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Mobile Touch Swipe Handling (Hanya jika gestur dominan horizontal, tidak mengganggu scrolling vertikal)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX.current - touchEndX;
      const diffY = touchStartY.current - touchEndY;

      // Syarat swipe bab yang aman:
      // 1. Perpindahan horizontal minimal 80px
      // 2. Perpindahan horizontal harus minimal 2x lebih dominan daripada gerakan vertikal (scroll)
      // 3. Jarak vertikal tidak boleh melebihi 60px (mencegah salah deteksi saat user membaca sambil scroll ke bawah/atas)
      if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 2 && Math.abs(diffY) < 60) {
        if (diffX > 0 && nextUnit) {
          // Usap ke kiri -> bab berikutnya
          onNavigateToUnit(nextUnit.id);
        } else if (diffX < 0 && previousUnit) {
          // Usap ke kanan -> bab sebelumnya
          onNavigateToUnit(previousUnit.id);
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Resolve typography classes based on settings
  const getFontFamilyStyle = () => {
    switch (settings.fontFamily) {
      case 'source-serif':
        return { fontFamily: "'Source Serif 4', Georgia, serif" };
      case 'sans':
        return { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };
      case 'literata':
      default:
        return { fontFamily: "'Literata', Georgia, serif" };
    }
  };

  const getFontSizeClasses = () => {
    switch (settings.fontSize) {
      case 'sm':
        return 'text-[16px] sm:text-[17px]';
      case 'lg':
        return 'text-[20px] sm:text-[21px]';
      case 'xl':
        return 'text-[22px] sm:text-[23px]';
      case 'md':
      default:
        return 'text-[18px] sm:text-[19px]';
    }
  };

  const getLineHeightStyle = () => {
    switch (settings.lineHeight) {
      case 'rapat':
        return { lineHeight: '1.55' };
      case 'lapang':
        return { lineHeight: '1.9' };
      case 'nyaman':
      default:
        return { lineHeight: '1.7' };
    }
  };

  const getColumnWidthClass = () => {
    return settings.columnWidth === 'lebar' ? 'max-w-[72ch]' : 'max-w-[62ch]';
  };

  /**
   * Render kalimat dengan tanda kutip dialog diberi warna aksen buku:
   * - Tanda kutip pembuka/penutup (", “, ”, ‘, ’) diberi warna aksen var(--quote-accent).
   * - Teks dialog dan tag dialog tetap warna tinta biasa (bukan italic, tanpa bubble).
   * - Huruf pertama paragraf pembuka dirender dengan IlluminatedDropCap (ink color).
   */
  const renderSentenceWithQuotes = (
    sentence: string,
    isFirstSentenceOfChapter: boolean,
    dropCapLetter: string,
    unitId: string
  ) => {
    let content = sentence;
    let leadingDropCap: React.ReactNode = null;

    if (isFirstSentenceOfChapter && dropCapLetter) {
      leadingDropCap = (
        <IlluminatedDropCap
          letter={dropCapLetter}
          unitId={unitId}
          modeAnimasi={settings.modeAnimasi || 'tenang'}
        />
      );
      content = sentence.slice(1);
    }

    // Pisahkan berdasarkan tanda kutip ganda dan tunggal
    const segments = content.split(/([“"”‘'])/g);

    return (
      <>
        {leadingDropCap}
        {segments.map((seg, i) => {
          const isQuote =
            seg === '“' || seg === '”' || seg === '"' || seg === '‘' || seg === '’' || seg === "'";

          if (isQuote) {
            return (
              <span
                key={i}
                className="dialogue-quote-mark font-serif select-none"
                style={{
                  color: 'var(--quote-accent)',
                  fontWeight: 600,
                }}
                aria-hidden="true"
              >
                {seg}
              </span>
            );
          }

          return <React.Fragment key={i}>{seg}</React.Fragment>;
        })}
      </>
    );
  };

  return (
    <main
      id="reader-view-main"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        // Ketuk latar pembaca memunculkan kembali header & footer
        const target = e.target as HTMLElement;
        if (target.id === 'reader-view-main' || target.tagName === 'ARTICLE' || target.tagName === 'MAIN') {
          onChromeVisibilityChangeRef.current?.(true);
        }
      }}
      className={`min-h-screen px-3.5 sm:px-6 pt-[calc(4.25rem+env(safe-area-inset-top,0px))] sm:pt-24 ${
        isTTSOpen ? 'pb-[calc(18rem+env(safe-area-inset-bottom,0px))] sm:pb-60' : 'pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] sm:pb-32'
      } transition-colors duration-200`}
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <div className={`mx-auto ${getColumnWidthClass()}`}>
        {/* Kontainer Animasi Masuk Bab */}
        <div key={unit.id} className="chapter-enter-animation">
          {/* Unit Header / Pembuka Bab Tiga Lapis Tipografi Buku Cetak */}
          <header className="mb-16 sm:mb-24 pt-4 sm:pt-8 text-center select-none">
            {/* Lapis 1: Nomor bab kecil dan tenang */}
            <div
              className="text-xs sm:text-sm font-serif tracking-[0.25em] uppercase mb-3 sm:mb-4 opacity-75"
              style={{ color: 'var(--text-secondary)' }}
            >
              {unit.nomor === 'Prolog' ? 'Prolog' : `Bab ${unit.nomor}`}
            </div>

            {/* Lapis 2: Judul bab dalam ukuran besar */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-serif font-bold tracking-tight mb-2 leading-tight"
              style={getFontFamilyStyle()}
            >
              {unit.judul}
            </h1>

            {unit.catatan && (
              <p
                className="text-xs sm:text-sm italic mt-2 font-serif opacity-80 max-w-lg mx-auto"
                style={{ color: 'var(--text-secondary)' }}
              >
                {unit.catatan}
              </p>
            )}

            {/* Lapis 3: Satu elemen pemisah tipis ornamen geometris manuskrip iluminasi */}
            <ChapterOrnamentDivider />

            {/* Subtly indicate if completed */}
            {isCompleted && (
              <div className="inline-flex items-center gap-1.5 mt-1 text-xs opacity-75 text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="font-serif">Selesai dibaca</span>
              </div>
            )}
          </header>

        {/* Narrative Body */}
        <article
          id="novel-content-article"
          className={`novel-body ${getFontSizeClasses()}`}
          style={{
            ...getFontFamilyStyle(),
            ...getLineHeightStyle(),
          }}
        >
          {unit.adegan.map((adegan, sceneIndex) => (
            <section key={sceneIndex} className="adegan-block">
              {adegan.paragraf.map((paragraf, pIndex) => {
                // Paragraf pertama dari bab atau setelah scene break tidak diindentasi
                const isFirstOfScene = pIndex === 0;
                // Cek apakah dialog yang diawali kutip
                const isDialog = paragraf.trim().startsWith('“') || paragraf.trim().startsWith('"') || paragraf.trim().startsWith('-');

                let className = '';
                if (isFirstOfScene) {
                  className += ' adegan-first-p';
                }
                if (isDialog) {
                  className += ' dialog';
                }

                // Cek jika teks masih berupa placeholder netral
                const isPlaceholder = paragraf.startsWith('[');

                // Drop cap untuk huruf pertama di paragraf pertama bab
                const isVeryFirstParagraph = sceneIndex === 0 && pIndex === 0;
                let dropCapLetter = '';

                if (isVeryFirstParagraph && paragraf.length > 0 && !isPlaceholder) {
                  const trimmed = paragraf.trim();
                  const firstChar = trimmed.charAt(0);
                  if (/[a-zA-Z]/i.test(firstChar)) {
                    dropCapLetter = firstChar.toUpperCase();
                  }
                }

                const sentences = isPlaceholder ? [paragraf] : splitParagraphIntoSentences(paragraf);

                return (
                  <ScrollParagraph
                    key={pIndex}
                    isInitial={sceneIndex === 0 && pIndex < 3}
                    isFastScrolling={isFastScrolling}
                    className={className}
                    style={{
                      fontStyle: isPlaceholder ? 'italic' : 'normal',
                      opacity: isPlaceholder ? 0.75 : 1,
                      backgroundColor: isPlaceholder ? 'var(--bg-surface)' : 'transparent',
                      padding: isPlaceholder ? '1rem' : undefined,
                      borderRadius: isPlaceholder ? '0.5rem' : undefined,
                      marginBottom: isPlaceholder ? '1rem' : undefined,
                      border: isPlaceholder ? '1px dashed var(--border-color)' : undefined,
                      fontSize: isPlaceholder ? '0.9em' : undefined,
                    }}
                  >
                    {isPlaceholder ? (
                      paragraf
                    ) : (
                      sentences.map((sentence, sIndex) => {
                        const sentenceId = `sent-${unit.id}-${sceneIndex}-${pIndex}-${sIndex}`;
                        const isActive = activeSentenceId === sentenceId;
                        const isFirstSentenceOfChapter = isVeryFirstParagraph && sIndex === 0;

                        return (
                          <span
                            key={sIndex}
                            id={sentenceId}
                            onClick={() => onSentenceClick?.(sentenceId)}
                            className={`tts-sentence-span transition-colors duration-150 cursor-pointer ${
                              isActive ? 'tts-active-sentence font-medium' : 'hover:opacity-95'
                            }`}
                            style={{
                              backgroundColor: isActive ? 'var(--accent-bg)' : undefined,
                              color: isActive ? 'var(--accent-color)' : undefined,
                              borderRadius: isActive ? '4px' : undefined,
                              padding: isActive ? '1px 3px' : undefined,
                            }}
                            title="Klik untuk mendengarkan dari kalimat ini"
                          >
                            {renderSentenceWithQuotes(
                              sentence,
                              isFirstSentenceOfChapter,
                              dropCapLetter,
                              unit.id
                            )}{' '}
                          </span>
                        );
                      })
                    )}
                  </ScrollParagraph>
                );
              })}

              {/* Pemisah Adegan (Scene Break) • • • dengan stagger bertahap jika bukan adegan terakhir */}
              {sceneIndex < unit.adegan.length - 1 && (
                <SceneBreak key={`break-${sceneIndex}`} />
              )}
            </section>
          ))}
        </article>

        {/* End of Chapter Gentle Pause Banner (Sesuai PRD Bagian 10) */}
        <div
          id="end-of-chapter-card"
          className="mt-16 sm:mt-24 pt-8 border-t text-center rounded-xl p-6 sm:p-8"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div className="mb-2 text-xs font-serif italic" style={{ color: 'var(--text-secondary)' }}>
            Akhir dari {unit.nomor === 'Prolog' ? 'Prolog' : `Bab ${unit.nomor}`}
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold mb-4">
            {nextUnit ? `Lanjut ke ${nextUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${nextUnit.nomor}`}: "${nextUnit.judul}"?` : 'Anda telah mencapai akhir Bagian I'}
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {nextUnit ? (
              <button
                id="btn-next-chapter-confirm"
                onClick={() => onNavigateToUnit(nextUnit.id)}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-xs flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                }}
              >
                <span>Lanjut ke Bab Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              id="btn-back-to-toc"
              onClick={onOpenTOC}
              className="w-full sm:w-auto px-5 py-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Daftar Isi</span>
            </button>
          </div>
        </div>
        </div>

        {/* Bottom Navigation Toolbar */}
        <nav
          id="reader-bottom-nav"
          className="mt-10 sm:mt-16 pt-6 flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm border-t"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          aria-label="Navigasi bab"
        >
          {previousUnit ? (
            <button
              id="btn-nav-prev-unit"
              onClick={() => onNavigateToUnit(previousUnit.id)}
              className="flex items-center justify-center gap-1.5 min-h-[44px] py-2.5 px-3 sm:px-4 rounded-lg hover:opacity-80 active:scale-95 transition-all border flex-1 sm:flex-initial"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {previousUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${previousUnit.nomor}`}
              </span>
            </button>
          ) : (
            <div className="flex-1 sm:flex-initial" />
          )}

          <div className="text-center font-mono text-xs hidden sm:block px-2">
            Gunakan tombol panah &larr; / &rarr; di keyboard
          </div>

          {nextUnit ? (
            <button
              id="btn-nav-next-unit"
              onClick={() => onNavigateToUnit(nextUnit.id)}
              className="flex items-center justify-center gap-1.5 min-h-[44px] py-2.5 px-3 sm:px-4 rounded-lg hover:opacity-80 active:scale-95 transition-all border flex-1 sm:flex-initial"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
            >
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {nextUnit.nomor === 'Prolog' ? 'Prolog' : `Bab ${nextUnit.nomor}`}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <div className="flex-1 sm:flex-initial" />
          )}
        </nav>
      </div>
    </main>
  );
};
