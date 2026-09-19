import React, { useEffect, useRef, useState } from 'react';

interface ScrollParagraphProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isInitial?: boolean; // Paragraf awal layar langsung terlihat tanpa transisi
  isFastScrolling?: boolean; // Jika pembaca sedang scroll cepat, jangan tunda tampilan
}

export const ScrollParagraph: React.FC<ScrollParagraphProps> = ({
  children,
  className = '',
  style = {},
  isInitial = false,
  isFastScrolling = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(isInitial);
  const pRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (isInitial || isRevealed) return;

    // Jika reduced motion aktif, langsung tampilkan
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    // Jika pengguna sedang scroll cepat, buka langsung
    if (isFastScrolling) {
      setIsRevealed(true);
      return;
    }

    const element = pRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px 0px 50px 0px', // Pre-trigger sebelum benar-benar di bawah layar agar mata pembaca tidak terhambat
        threshold: 0.05,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isInitial, isFastScrolling, isRevealed]);

  // Efek jika isFastScrolling berubah menjadi true setelah mount
  useEffect(() => {
    if (isFastScrolling && !isRevealed) {
      setIsRevealed(true);
    }
  }, [isFastScrolling, isRevealed]);

  return (
    <p
      ref={pRef}
      className={className}
      style={{
        ...style,
        opacity: isRevealed ? (style.opacity ?? 1) : 0.4,
        transform: isRevealed ? 'none' : 'translateY(4px)',
        transition: isInitial ? 'none' : 'opacity 150ms ease-out, transform 150ms ease-out',
        willChange: isRevealed ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </p>
  );
};
