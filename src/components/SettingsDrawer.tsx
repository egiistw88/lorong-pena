import React, { useEffect } from 'react';
import { X, Sun, Moon, BookOpen, Check, RotateCcw } from 'lucide-react';
import {
  ReaderSettings,
  ThemeMode,
  FontFamilyOption,
  FontSizeOption,
  LineHeightOption,
  ColumnWidthOption,
  ModeAnimasiOption,
} from '../types';
import { DEFAULT_SETTINGS } from '../lib/storage';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  // Dukungan tombol Escape untuk menutup drawer
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

  const handleResetToDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  const getPreviewFontFamily = () => {
    switch (settings.fontFamily) {
      case 'source-serif':
        return "'Source Serif 4', Georgia, serif";
      case 'sans':
        return "'Plus Jakarta Sans', system-ui, sans-serif";
      case 'literata':
      default:
        return "'Literata', Georgia, serif";
    }
  };

  const getPreviewLineHeight = () => {
    switch (settings.lineHeight) {
      case 'rapat':
        return '1.55';
      case 'lapang':
        return '1.90';
      case 'nyaman':
      default:
        return '1.70';
    }
  };

  const getPreviewFontSize = () => {
    switch (settings.fontSize) {
      case 'sm':
        return '14px';
      case 'lg':
        return '17px';
      case 'xl':
        return '19px';
      case 'md':
      default:
        return '15px';
    }
  };

  return (
    <div
      id="settings-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="settings-drawer-panel"
        className="w-full sm:max-w-md h-[92vh] sm:h-full border-t sm:border-t-0 sm:border-l shadow-2xl rounded-t-2xl sm:rounded-t-none flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-right-5 duration-200"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden opacity-30" style={{ backgroundColor: 'var(--text-secondary)' }} />

        {/* Header Drawer */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h2 className="text-base font-serif font-bold tracking-tight">Pengaturan Tampilan</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Kustomisasi kenyamanan membaca buku
            </p>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg hover:opacity-80 active:scale-95 transition-all"
            aria-label="Tutup pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
            {/* 1. Tema Tampilan */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Tema Halaman
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'terang', label: 'Terang', icon: Sun, bg: '#faf8f5', text: '#201e1c', border: '#ded9cf' },
                  { id: 'sephia', label: 'Sephia', icon: BookOpen, bg: '#f4eee2', text: '#382d22', border: '#dfd5c4' },
                  { id: 'gelap', label: 'Gelap', icon: Moon, bg: '#151413', text: '#ded9d1', border: '#332f2b' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`theme-option-${t.id}`}
                      onClick={() => onUpdateSettings({ theme: t.id as ThemeMode })}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                        isSelected ? 'ring-2 ring-amber-600' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: t.bg,
                        color: t.text,
                        borderColor: isSelected ? 'var(--accent-color)' : t.border,
                      }}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{t.label}</span>
                      {isSelected && (
                        <span className="absolute top-1 right-1">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Jenis Huruf */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Jenis Huruf
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'literata', label: 'Literata', fontClass: 'font-["Literata",Georgia,serif]' },
                  { id: 'source-serif', label: 'Source Serif', fontClass: 'font-["Source_Serif_4",serif]' },
                  { id: 'sans', label: 'Sans-serif', fontClass: 'font-["Plus_Jakarta_Sans",sans-serif]' },
                ].map((f) => {
                  const isSelected = settings.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      id={`font-option-${f.id}`}
                      onClick={() => onUpdateSettings({ fontFamily: f.id as FontFamilyOption })}
                      className={`p-2.5 text-center rounded-lg border text-sm transition-all ${
                        isSelected ? 'font-semibold ring-2' : 'hover:opacity-80'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span className={`block ${f.fontClass}`}>Aa</span>
                      <span className="text-[11px] truncate block mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Ukuran Huruf (4 Preset Bertingkat Sesuai PRD) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Ukuran Huruf
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'sm', label: 'Kecil', preview: 'A' },
                  { id: 'md', label: 'Standar', preview: 'A' },
                  { id: 'lg', label: 'Besar', preview: 'A' },
                  { id: 'xl', label: 'Ekstra', preview: 'A' },
                ].map((s, idx) => {
                  const isSelected = settings.fontSize === s.id;
                  const previewSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg'];
                  return (
                    <button
                      key={s.id}
                      id={`size-option-${s.id}`}
                      onClick={() => onUpdateSettings({ fontSize: s.id as FontSizeOption })}
                      className={`py-2 px-1 text-center rounded-lg border transition-all ${
                        isSelected ? 'font-bold ring-2' : 'hover:opacity-80'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span className={`block font-serif ${previewSizes[idx]}`}>{s.preview}</span>
                      <span className="text-[10px] block mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Jarak Baris (3 Pilihan) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Jarak Baris
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rapat', label: 'Rapat (1.55)' },
                  { id: 'nyaman', label: 'Nyaman (1.70)' },
                  { id: 'lapang', label: 'Lapang (1.90)' },
                ].map((l) => {
                  const isSelected = settings.lineHeight === l.id;
                  return (
                    <button
                      key={l.id}
                      id={`lineheight-option-${l.id}`}
                      onClick={() => onUpdateSettings({ lineHeight: l.id as LineHeightOption })}
                      className={`py-2 px-1.5 text-center rounded-lg border text-xs transition-all ${
                        isSelected ? 'font-semibold ring-2' : 'hover:opacity-80'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span>{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Lebar Kolom Teks (Sedang: 62ch, Lebar: 72ch) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Lebar Kolom Teks
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sedang', label: 'Sedang (62 karakter)' },
                  { id: 'lebar', label: 'Lebar (72 karakter)' },
                ].map((w) => {
                  const isSelected = settings.columnWidth === w.id;
                  return (
                    <button
                      key={w.id}
                      id={`colwidth-option-${w.id}`}
                      onClick={() => onUpdateSettings({ columnWidth: w.id as ColumnWidthOption })}
                      className={`py-2 px-2 text-center rounded-lg border text-xs transition-all ${
                        isSelected ? 'font-semibold ring-2' : 'hover:opacity-80'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div>{w.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Sentuhan Animasi (Mode Tenang vs Hidup - PRD Bagian 10) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Sentuhan Animasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'tenang',
                    label: 'Tenang (Bawaan)',
                    desc: 'Drop cap & ornamen statis, tanpa distraksi gerak',
                  },
                  {
                    id: 'hidup',
                    label: 'Hidup',
                    desc: 'Sentuhan kaligrafi halus pada huruf pembuka bab',
                  },
                ].map((mode) => {
                  const isSelected = (settings.modeAnimasi || 'tenang') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      id={`mode-animasi-${mode.id}`}
                      onClick={() => onUpdateSettings({ modeAnimasi: mode.id as ModeAnimasiOption })}
                      className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
                        isSelected ? 'font-semibold ring-2' : 'hover:opacity-80'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="font-medium mb-0.5">{mode.label}</div>
                      <div className="text-[10px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                        {mode.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kotak Pratinjau Teks Langsung */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Pratinjau Tipografi
              </label>
              <div
                className="p-3 rounded-lg border select-none overflow-hidden transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <p
                  style={{
                    fontFamily: getPreviewFontFamily(),
                    fontSize: getPreviewFontSize(),
                    lineHeight: getPreviewLineHeight(),
                  }}
                >
                  &ldquo;Di Tal Ma&apos;rifah, ruang yang sama tempat dahulu kami menimbun gandum, kini dingin dan berdebu.&rdquo;
                </p>
              </div>
            </div>
        </div>

        {/* Footer & Reset to Defaults */}
        <div
          className="p-4 sm:p-5 pt-3 border-t space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,16px))]"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
        >
          <button
            id="btn-reset-settings"
            onClick={handleResetToDefaults}
            className="w-full min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-secondary)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembalikan ke Standar Buku</span>
          </button>

          <div className="text-[11px] text-center" style={{ color: 'var(--text-tertiary)' }}>
            Pilihan tampilan tersimpan otomatis di peramban Anda
          </div>
        </div>
      </div>
    </div>
  );
};
