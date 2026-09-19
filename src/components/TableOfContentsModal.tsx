import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, CheckCircle2, Clock, BookMarked, Layers, ChevronsUpDown } from 'lucide-react';
import { UnitNarasi, ReadingProgress } from '../types';
import { NOVEL_METADATA } from '../content/meta';
import { formatReadingTime } from '../lib/readingTime';

interface TableOfContentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitNarasi[];
  currentUnitId: string;
  progress: ReadingProgress;
  onSelectUnit: (unitId: string) => void;
}

export const TableOfContentsModal: React.FC<TableOfContentsModalProps> = ({
  isOpen,
  onClose,
  units,
  currentUnitId,
  progress,
  onSelectUnit,
}) => {
  // State accordion untuk masing-masing bagian (0 = Prolog, 1 = Bagian I, dst.)
  const [openBagian, setOpenBagian] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  // Buka bagian dari unit yang sedang aktif saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const activeUnit = units.find((u) => u.id === currentUnitId);
      if (activeUnit) {
        setOpenBagian((prev) => ({
          ...prev,
          [activeUnit.bagian]: true,
        }));
      }
    }
  }, [isOpen, currentUnitId, units]);

  // Dukungan tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleBagian = (no: number) => {
    setOpenBagian((prev) => ({
      ...prev,
      [no]: !prev[no],
    }));
  };

  const areAllExpanded = Object.values(openBagian).every(Boolean);

  const toggleAllBagian = () => {
    const nextState = !areAllExpanded;
    setOpenBagian({
      0: nextState,
      1: nextState,
      2: nextState,
      3: nextState,
      4: nextState,
      5: nextState,
    });
  };

  const completedCount = progress.completedUnitIds.length;
  const totalUnitsInApp = units.length; // 8 unit naskah di Bagian I saat ini
  const totalCanonicalUnits = NOVEL_METADATA.total_rencana_unit; // 49 unit

  return (
    <div
      id="toc-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="toc-modal-container"
        className="w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-xl border-t sm:border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden opacity-30" style={{ backgroundColor: 'var(--text-secondary)' }} />

        {/* Header Modal */}
        <div
          className="p-3.5 sm:p-5 border-b flex items-start justify-between gap-3"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
              >
                Daftar Isi Kanon
              </span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                {totalUnitsInApp} dari {totalCanonicalUnits} unit
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-serif font-bold tracking-tight truncate">
              {NOVEL_METADATA.judul}
            </h2>
            <p className="text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              Progres baca: {completedCount} dari {totalUnitsInApp} unit aktif tuntas dibaca
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              id="btn-toggle-all-sections"
              onClick={toggleAllBagian}
              className="inline-flex items-center justify-center gap-1 text-xs min-h-[44px] px-2.5 py-1.5 rounded-lg border transition-colors hover:opacity-80 active:scale-95"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--text-secondary)',
              }}
              title={areAllExpanded ? 'Tutup Semua Bagian' : 'Buka Semua Bagian'}
            >
              <ChevronsUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">{areAllExpanded ? 'Tutup Semua' : 'Buka Semua'}</span>
            </button>

            <button
              id="btn-close-toc"
              onClick={onClose}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg hover:opacity-75 active:scale-95 transition-all"
              aria-label="Tutup daftar isi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {/* Unit Khusus: Prolog */}
          {units.some((u) => u.nomor === 'Prolog') && (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div
                className="p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors"
                style={{ backgroundColor: 'var(--bg-surface)' }}
                onClick={() => toggleBagian(0)}
              >
                <div className="flex items-center gap-2.5">
                  <BookMarked className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <span className="font-serif font-semibold text-sm">Prolog</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
                  >
                    Retrospektif Zayd
                  </span>
                </div>
                {openBagian[0] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>

              {openBagian[0] && (
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {units
                    .filter((u) => u.nomor === 'Prolog')
                    .map((unit) => {
                      const isCurrent = unit.id === currentUnitId;
                      const isCompleted = progress.completedUnitIds.includes(unit.id);
                      return (
                        <button
                          key={unit.id}
                          id={`toc-item-${unit.id}`}
                          onClick={() => {
                            onSelectUnit(unit.id);
                            onClose();
                          }}
                          className={`w-full text-left p-3.5 flex items-center justify-between transition-colors ${
                            isCurrent ? 'font-semibold border-l-3' : 'hover:opacity-90'
                          }`}
                          style={{
                            backgroundColor: isCurrent ? 'var(--accent-bg)' : 'transparent',
                            borderLeftColor: isCurrent ? 'var(--accent-color)' : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-medium w-14" style={{ color: 'var(--text-secondary)' }}>
                              Prolog
                            </span>
                            <div>
                              <span className="text-sm font-serif">{unit.judul}</span>
                              {isCurrent && (
                                <span
                                  className="ml-2 inline-block text-[10px] font-mono px-1.5 py-0.2 rounded"
                                  style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
                                >
                                  Sedang Dibaca
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {formatReadingTime(unit.jumlah_kata)}
                            </span>
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">Selesai</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Bagian I s/d V */}
          {NOVEL_METADATA.bagian.map((bg) => {
            const bgUnits = units.filter((u) => u.bagian === bg.nomor && u.nomor !== 'Prolog');
            const isOpen = openBagian[bg.nomor] ?? false;
            const isCompletedStatus = bg.status === 'tuntas';

            return (
              <div
                key={bg.nomor}
                id={`toc-section-${bg.nomor}`}
                className="border rounded-lg overflow-hidden transition-all"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Bagian Header / Accordion trigger */}
                <div
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                  onClick={() => toggleBagian(bg.nomor)}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                    <span className="font-serif font-bold text-sm">
                      {bg.judul}
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: isCompletedStatus ? 'var(--badge-bg)' : 'var(--border-color)',
                        color: isCompletedStatus ? 'var(--badge-text)' : 'var(--text-secondary)',
                      }}
                    >
                      {isCompletedStatus ? `${bgUnits.length} Bab (Tuntas)` : `${bg.target_bab} Bab (Rencana)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
                      {bg.deskripsi}
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>

                {/* List of chapters in this section */}
                {isOpen && (
                  <div>
                    {bgUnits.length > 0 ? (
                      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {bgUnits.map((unit) => {
                          const isCurrent = unit.id === currentUnitId;
                          const isCompleted = progress.completedUnitIds.includes(unit.id);
                          return (
                            <button
                              key={unit.id}
                              id={`toc-item-${unit.id}`}
                              onClick={() => {
                                onSelectUnit(unit.id);
                                onClose();
                              }}
                              className={`w-full text-left p-3.5 flex items-center justify-between transition-colors ${
                                isCurrent ? 'font-semibold border-l-3' : 'hover:opacity-90'
                              }`}
                              style={{
                                backgroundColor: isCurrent ? 'var(--accent-bg)' : 'transparent',
                                borderLeftColor: isCurrent ? 'var(--accent-color)' : 'transparent',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-medium w-14" style={{ color: 'var(--text-secondary)' }}>
                                  Bab {unit.nomor}
                                </span>
                                <div>
                                  <span className="text-sm font-serif">{unit.judul}</span>
                                  {isCurrent && (
                                    <span
                                      className="ml-2 inline-block text-[10px] font-mono px-1.5 py-0.2 rounded"
                                      style={{ backgroundColor: 'var(--accent-color)', color: '#ffffff' }}
                                    >
                                      Sedang Dibaca
                                    </span>
                                  )}
                                  {unit.catatan && (
                                    <span className="block text-[11px] font-sans" style={{ color: 'var(--text-secondary)' }}>
                                      {unit.catatan}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span className="hidden sm:inline font-mono">
                                  ±{unit.jumlah_kata} kata
                                </span>
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {formatReadingTime(unit.jumlah_kata)}
                                </span>
                                {isCompleted && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline text-[11px]">Selesai</span>
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Tahap penulisan belum dimulai ({bg.target_bab} bab direncanakan untuk tahap kanon selanjutnya).
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div
          className="p-3 sm:p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))] border-t text-center text-xs flex items-center justify-between gap-2"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        >
          <span className="truncate text-[11px] sm:text-xs">Prolog + Bab I.1&ndash;I.7 (±13.900 kata selesai)</span>
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg border hover:opacity-80 active:scale-95 transition-all shrink-0"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-panel)' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
