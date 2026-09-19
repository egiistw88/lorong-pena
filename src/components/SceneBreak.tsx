import React, { useEffect, useRef, useState } from 'react';

/**
 * Pembatas adegan (• • •) dengan kemunculan bertahap (stagger ~100ms per titik)
 * saat di-scroll ke posisi pembatas menggunakan IntersectionObserver murni.
 */
export const SceneBreak: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div
      ref={containerRef}
      className="py-10 sm:py-14 text-center select-none flex items-center justify-center gap-3 sm:gap-4"
      aria-hidden="true"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="w-1.5 h-1.5 rounded-full inline-block transition-all duration-300 ease-out"
          style={{
            backgroundColor: 'var(--text-tertiary)',
            opacity: isVisible ? 0.7 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.3)',
            transitionDelay: `${index * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};
