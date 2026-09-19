import React, { useEffect, useRef, useState } from 'react';

interface SceneBreakProps {
  modeAnimasi?: 'tenang' | 'hidup';
}

/**
 * Pembatas adegan (• • •):
 * - Mode Tenang: Tiga titik tampil statis ala novel cetak klasik, tanpa animasi/delay.
 * - Mode Hidup: Kemunculan bertahap (stagger ~100ms per titik) saat di-scroll menggunakan IntersectionObserver.
 * - Keduanya tunduk pada prefers-reduced-motion.
 */
export const SceneBreak: React.FC<SceneBreakProps> = ({ modeAnimasi = 'tenang' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isQuiet = modeAnimasi === 'tenang';
  const [isVisible, setIsVisible] = useState(isQuiet);

  useEffect(() => {
    if (isQuiet) {
      setIsVisible(true);
      return;
    }

    // Jika perangkat meminta reduced motion, tampilkan langsung tanpa animasi
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Hanya animasi sekali, unobserve untuk zero overhead
        }
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isQuiet]);

  return (
    <div
      ref={containerRef}
      className="py-10 sm:py-14 text-center select-none flex items-center justify-center gap-3 sm:gap-4"
      aria-hidden="true"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`w-1.5 h-1.5 rounded-full inline-block ${
            isQuiet ? '' : 'transition-all duration-300 ease-out'
          }`}
          style={{
            backgroundColor: 'var(--text-tertiary)',
            opacity: isVisible || isQuiet ? 0.7 : 0,
            transform: isVisible || isQuiet ? 'scale(1)' : 'scale(0.3)',
            transitionDelay: isQuiet ? '0ms' : `${index * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};
