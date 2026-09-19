import React from 'react';

/**
 * Ornamen pemisah tipis pembuka bab, terinspirasi dari motif iluminasi manuskrip Abbasiyah / buku klasik.
 * Garis tipis dengan bentuk diamond/rosette geometris di tengah, menggunakan warna aksen tinta.
 * Dipakai HANYA sekali di pembuka bab sebelum baris pertama narasi dimulai.
 */
export const ChapterOrnamentDivider: React.FC = () => {
  return (
    <div
      className="flex items-center justify-center gap-3 sm:gap-4 my-5 sm:my-7 select-none"
      role="separator"
      aria-hidden="true"
    >
      {/* Garis rambut tipis memudar ke kiri */}
      <div
        className="h-[1px] w-16 sm:w-28 opacity-60"
        style={{
          background: 'linear-gradient(to left, var(--quote-accent), transparent)',
        }}
      />

      {/* Motif geometris diamond / rosette manuskrip */}
      <div className="flex items-center gap-1.5 opacity-90" style={{ color: 'var(--quote-accent)' }}>
        <span
          className="w-1 h-1 rounded-full opacity-60"
          style={{ backgroundColor: 'var(--quote-accent)' }}
        />

        <svg
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Berlian luar (rotated square 45 deg) */}
          <rect
            x="4"
            y="4"
            width="12"
            height="12"
            transform="rotate(45 10 10)"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Berlian dalam */}
          <rect
            x="6.5"
            y="6.5"
            width="7"
            height="7"
            transform="rotate(45 10 10)"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="var(--bg-page)"
          />
          {/* Titik pusat tinta */}
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        </svg>

        <span
          className="w-1 h-1 rounded-full opacity-60"
          style={{ backgroundColor: 'var(--quote-accent)' }}
        />
      </div>

      {/* Garis rambut tipis memudar ke kanan */}
      <div
        className="h-[1px] w-16 sm:w-28 opacity-60"
        style={{
          background: 'linear-gradient(to right, var(--quote-accent), transparent)',
        }}
      />
    </div>
  );
};
