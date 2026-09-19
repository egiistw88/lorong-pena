import React from 'react';

interface IlluminatedDropCapProps {
  letter: string;
  unitId: string;
  modeAnimasi?: 'tenang' | 'hidup';
}

/**
 * Huruf pembuka bab:
 * - Mode Tenang: huruf pertama diperbesar secara statis ala novel cetak, warna tinta (ink), tanpa animasi.
 * - Mode Hidup: drop cap beriluminasi bertema kaligrafi tinta Abbasiyah (animasi sapuan garis stroke ~500ms sekali saat bab dibuka).
 */
export const IlluminatedDropCap: React.FC<IlluminatedDropCapProps> = ({
  letter,
  unitId,
  modeAnimasi = 'tenang',
}) => {
  if (modeAnimasi === 'tenang') {
    return (
      <span
        key={`static-${unitId}`}
        className="illuminated-dropcap-static float-left mr-3 sm:mr-3.5 mb-0.5 text-4xl sm:text-5xl font-serif font-bold select-none leading-none pt-1"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-literata, Georgia, serif)',
        }}
        aria-hidden="true"
      >
        {letter}
      </span>
    );
  }

  return (
    <span
      key={`animated-${unitId}`}
      className="illuminated-dropcap-container float-left mr-3 sm:mr-3.5 mb-1 select-none inline-block relative"
      aria-hidden="true"
    >
      <svg
        className="w-13 h-13 sm:w-15 sm:h-15"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Latar belakang medalion bertekstur halus */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="6"
          className="dropcap-bg"
          fill="var(--bg-surface)"
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />

        {/* Ornamen sudut kaligrafi manuskrip (menggambar sendiri via stroke-draw) */}
        <path
          d="M 8 18 L 8 8 L 18 8 M 56 18 L 56 8 L 46 8 M 8 46 L 8 56 L 18 56 M 56 46 L 56 56 L 46 56"
          className="dropcap-stroke-frame"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Garis ornamen mahkota atas khas naskah kuno */}
        <path
          d="M 22 8 Q 32 13 42 8"
          className="dropcap-stroke-accent"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M 22 56 Q 32 51 42 56"
          className="dropcap-stroke-accent"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Huruf utama beriluminasi (tetap warna ink / text-primary) */}
        <text
          x="32"
          y="42"
          textAnchor="middle"
          className="dropcap-letter font-serif font-bold"
          fill="var(--text-primary)"
          style={{
            fontSize: '34px',
            fontFamily: 'var(--font-literata, Georgia, serif)',
          }}
        >
          {letter}
        </text>
      </svg>
    </span>
  );
};
