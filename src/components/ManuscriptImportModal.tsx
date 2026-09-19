import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle, RotateCcw, Copy } from 'lucide-react';
import { UnitNarasi } from '../types';
import { DEFAULT_UNITS } from '../content/units';

interface ManuscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitNarasi[];
  onSaveUnits: (updatedUnits: UnitNarasi[]) => void;
}

export const ManuscriptImportModal: React.FC<ManuscriptImportModalProps> = ({
  isOpen,
  onClose,
  units,
  onSaveUnits,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || 'prolog');
  const [inputText, setInputText] = useState<string>('');
  const [customWordCount, setCustomWordCount] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSelectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  // Helper untuk memisahkan teks input menjadi paragraf dan adegan berdasarkan '• • •' atau '***'
  const handleApplyTextToUnit = () => {
    if (!inputText.trim()) {
      setNotification('Teks masih kosong. Silakan tempel teks naskah.');
      return;
    }

    // Pisahkan adegan berdasarkan pemisah adegan '• • •' atau '***' atau '---'
    const sceneRegex = /(?:\r?\n\s*(?:•\s*•\s*•|\*\s*\*\s*\*|---|…\s*…\s*…)\s*\r?\n)/;
    const rawScenes = inputText.split(sceneRegex);

    const formattedScenes = rawScenes
      .map((sceneStr) => {
        const rawParagraphs = sceneStr
          .split(/\r?\n\r?\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        return {
          paragraf: rawParagraphs,
        };
      })
      .filter((scene) => scene.paragraf.length > 0);

    if (formattedScenes.length === 0) {
      setNotification('Tidak ada paragraf valid yang terdeteksi.');
      return;
    }

    // Hitung perkiraan jumlah kata
    const words = inputText.trim().split(/\s+/).length;

    const updated = units.map((u) => {
      if (u.id === selectedUnitId) {
        return {
          ...u,
          jumlah_kata: words,
          adegan: formattedScenes,
        };
      }
      return u;
    });

    onSaveUnits(updated);
    setNotification(`Berhasil memperbarui isi teks untuk ${currentSelectedUnit.nomor}: "${currentSelectedUnit.judul}"!`);
    setInputText('');
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan seluruh unit naskah ke konfigurasi bawaan PRD?')) {
      localStorage.removeItem('lorong_pena_custom_units');
      onSaveUnits(DEFAULT_UNITS);
      setNotification('Berhasil mengembalikan data naskah ke bawaan.');
    }
  };

  // Fitur upload berkas teks / markdown
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        const count = content.trim().split(/\s+/).length;
        setCustomWordCount(count);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="manuscript-import-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="manuscript-import-panel"
        className="w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-xl border-t sm:border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden opacity-30" style={{ backgroundColor: 'var(--text-secondary)' }} />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
                Pipeline Naskah
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Sesuai Bagian 6 & 12 PRD
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-serif font-bold truncate">
              Pengelolaan & Pembaruan Teks Naskah
            </h2>
            <p className="text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              Salin persis teks naskah asli dari dokumen draft Pak Egi tanpa mengubah satu kata pun.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg hover:opacity-75 active:scale-95 transition-all shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Unit Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Pilih Unit Narasi yang Ingin Diisi / Diperbarui:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {units.map((unit) => {
                const isSelected = unit.id === selectedUnitId;
                const hasRealText = !unit.adegan[0]?.paragraf[0]?.startsWith('[');
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      setSelectedUnitId(unit.id);
                      setNotification(null);
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected ? 'ring-2 font-bold' : 'hover:opacity-80'
                    }`}
                    style={{
                      borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                      backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                    }}
                  >
                    <div className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {unit.nomor}
                    </div>
                    <div className="truncate font-serif mt-0.5">{unit.judul}</div>
                    <div className="text-[10px] mt-1 flex items-center gap-1 font-sans" style={{ color: hasRealText ? '#16a34a' : 'var(--text-tertiary)' }}>
                      {hasRealText ? '● Teks terisi' : '○ Belum diisi'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status bab terpilih */}
          <div className="p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
            <div>
              <span className="font-serif font-bold text-sm mr-2">
                {currentSelectedUnit.nomor}: {currentSelectedUnit.judul}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                ({currentSelectedUnit.adegan.length} adegan &bull; {currentSelectedUnit.adegan.reduce((a, s) => a + s.paragraf.length, 0)} paragraf &bull; ±{currentSelectedUnit.jumlah_kata} kata)
              </span>
            </div>
            <div className="text-xs font-mono px-2 py-0.5 rounded border self-start sm:self-auto" style={{ borderColor: 'var(--border-color)' }}>
              Status: {currentSelectedUnit.status}
            </div>
          </div>

          {/* Input Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Tempel Isi Teks Bab (Pisahkan adegan dengan &bull; &bull; &bull;):
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:underline">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Berkas (.txt)</span>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              id="textarea-manuscript-input"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tempel teks asli bab di sini...\n\nParagraf pertama adegan 1...\n\nParagraf kedua adegan 1...\n\n• • •\n\nParagraf pertama adegan 2...`}
              className="w-full p-3.5 rounded-lg border text-sm font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-600"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))]">
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-xs border hover:opacity-80 active:scale-95 transition-all"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-panel)' }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset ke Bawaan PRD</span>
            </button>

            <button
              id="btn-apply-manuscript-text"
              onClick={handleApplyTextToUnit}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-xs"
              style={{
                backgroundColor: 'var(--accent-color)',
                color: '#ffffff',
              }}
            >
              <Check className="w-4 h-4" />
              <span>Simpan Naskah ke {currentSelectedUnit.nomor}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
