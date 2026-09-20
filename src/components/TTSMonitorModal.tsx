import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  X,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Clock,
  Trash2,
  Cpu,
  Radio,
  Sparkles,
  Info,
  Play,
  RotateCcw,
} from 'lucide-react';
import { TTSMonitorStats, TTSTransaction } from '../types';

interface TTSMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetQuotaStatus?: () => void;
  onClearClientCache?: () => void;
}

export const TTSMonitorModal: React.FC<TTSMonitorModalProps> = ({
  isOpen,
  onClose,
  onResetQuotaStatus,
  onClearClientCache,
}) => {
  const [stats, setStats] = useState<TTSMonitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  // Ambil data statistik riil dari server
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tts/status');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Gagal memuat status telemetri TTS:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling data statistik berkala saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [isOpen, fetchStats]);

  // Uji koneksi live (Ping) langsung ke Gemini TTS
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/tts/test-connection', { method: 'POST' });
      const data = await res.json();
      setTestResult({
        ok: data.ok,
        latencyMs: data.latencyMs,
        message: data.message || data.error,
      });
      fetchStats();
      if (data.ok && onResetQuotaStatus) {
        onResetQuotaStatus();
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Koneksi ke server terputus',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Bersihkan cache audio server & client
  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/tts/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (onClearClientCache) onClearClientCache();
      setClearMessage(data.message || 'Cache audio berhasil dibersihkan.');
      setTimeout(() => setClearMessage(null), 4000);
      fetchStats();
    } catch {
      setClearMessage('Gagal membersihkan cache server.');
      setTimeout(() => setClearMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  const isOnline = stats?.status === 'online';
  const isRateLimited = stats?.status === 'rate_limited';
  const hasNoKey = stats?.status === 'no_key';

  return (
    <div
      id="tts-monitor-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="tts-monitor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tts-monitor-title"
        className="w-full max-w-2xl max-h-[92vh] border shadow-2xl rounded-2xl flex flex-col justify-between overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent-color)',
              }}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="tts-monitor-title"
                  className="text-base font-serif font-bold tracking-tight"
                >
                  Monitor Telemetri Gemini TTS
                </h3>
                {/* Status Badge Denyut */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : isRateLimited
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline
                        ? 'bg-emerald-500 animate-ping'
                        : isRateLimited
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-red-500'
                    }`}
                  />
                  <span>
                    {isOnline
                      ? 'Aktif (Siap)'
                      : isRateLimited
                      ? 'Batas Kuota'
                      : hasNoKey
                      ? 'Kunci API Kosong'
                      : 'Tidak Aktif'}
                  </span>
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Pelacakan langsung ketersediaan kuota, latensi, dan model aktif Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-refresh-tts-monitor"
              onClick={fetchStats}
              disabled={isLoading}
              title="Perbarui Data Statistik"
              className="p-2 rounded-lg hover:opacity-80 active:scale-95 transition-all cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="btn-close-tts-monitor"
              onClick={onClose}
              title="Tutup Monitor"
              className="p-2 rounded-lg hover:opacity-80 active:scale-95 transition-all cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 text-xs">
          {/* Banner Peringatan Kuota Terlampaui (jika rate limited) */}
          {isRateLimited && stats?.rateLimitInfo && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs mb-1">
                    Batas Kuota Harian Gemini Free Tier Tercapai
                  </h4>
                  <p className="text-[11px] leading-relaxed mb-2 opacity-90">
                    {stats.rateLimitInfo.message ||
                      'Model preview Gemini TTS pada paket gratis memiliki batas permintaan harian. Pemutar audio saat ini otomatis menjaga kesinambungan bacaan menggunakan sintesis peramban lokal (Web Speech).'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20 text-[10px] font-mono">
                    <span>
                      Jeda Pemulihan:{' '}
                      <strong className="font-bold">
                        {stats.rateLimitInfo.retryDelaySeconds || 60} detik
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Metrik: {stats.rateLimitInfo.limitValue || '10 RPD / Free Tier'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid 4 Kartu Metrik Statistik Nyata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Model Aktif */}
            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Model Aktif
                </span>
                <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <div className="font-mono font-bold text-xs truncate" title={stats?.activeModel}>
                  {stats?.activeModel ? stats.activeModel.replace('-preview', '') : 'Gemini 2.5'}
                </div>
                <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Cascade Auto-Switch
                </div>
              </div>
            </div>

            {/* 2. Latensi Respon */}
            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Latensi Sintesis
                </span>
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <div className="font-mono font-bold text-sm">
                  {stats?.metrics.lastLatencyMs ? `${stats.metrics.lastLatencyMs} ms` : '—'}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Rata-rata:{' '}
                  {stats?.metrics.averageLatencyMs ? `${stats.metrics.averageLatencyMs}ms` : '—'}
                </div>
              </div>
            </div>

            {/* 3. Penghematan Kuota via Cache */}
            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Hemat Kuota
                </span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {stats?.metrics.cacheHitRatePercent ?? 0}%
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {stats?.metrics.cacheHits ?? 0} request dari cache
                </div>
              </div>
            </div>

            {/* 4. Pemanggilan Gemini API */}
            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Panggilan API
                </span>
                <Radio className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <div className="font-mono font-bold text-sm">
                  {stats?.metrics.apiCalls ?? 0}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Sukses: {stats?.metrics.apiSuccesses ?? 0} | Limit: {stats?.metrics.apiFailures ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Hasil Tes Ping Live (Jika ada) */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span className="truncate">{testResult.message}</span>
              </div>
              {testResult.latencyMs && (
                <span className="font-mono font-bold shrink-0">{testResult.latencyMs} ms</span>
              )}
            </div>
          )}

          {clearMessage && (
            <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
              {clearMessage}
            </div>
          )}

          {/* Seksi Transaksi Real-Time Terakhir */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Riwayat Pemrosesan Audio Real-Time
              </span>
              <span className="text-[10px] font-mono opacity-70">
                Cache Server: {stats?.cacheSize ?? 0} / {stats?.maxCacheSize ?? 600} item
              </span>
            </div>

            <div
              className="rounded-xl border overflow-hidden divide-y"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((tx: TTSTransaction) => {
                  const dateStr = new Date(tx.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 sm:px-3.5 flex items-center justify-between gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              tx.source === 'cache'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : tx.source === 'silent'
                                ? 'bg-neutral-500/15 text-neutral-500'
                                : tx.success
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/15 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {tx.source === 'cache'
                              ? 'CACHE HIT'
                              : tx.source === 'silent'
                              ? 'SILENT'
                              : tx.success
                              ? 'GEMINI API'
                              : 'LIMIT 429'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground opacity-60">
                            {dateStr}
                          </span>
                          {tx.model && (
                            <span className="text-[10px] font-mono opacity-60 truncate hidden sm:inline">
                              {tx.model}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] truncate italic font-serif"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          "{tx.textPreview}"
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-semibold">
                          {tx.durationMs} ms
                        </span>
                        <div
                          className={`text-[9px] font-mono font-medium ${
                            tx.status === 200
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500'
                          }`}
                        >
                          {tx.status} {tx.status === 200 ? 'OK' : 'ERR'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className="p-6 text-center text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Belum ada transaksi audio pada sesi ini. Putar kalimat dalam naskah untuk melihat aktivitas nyata.
                </div>
              )}
            </div>
          </div>

          {/* Seksi Detail Kuota Resmi Gemini */}
          <div
            className="p-3.5 rounded-xl border text-[11px] space-y-1.5"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              <span>Ketentuan Kuota & Desain Arsitektur Hemat Lorong Pena</span>
            </div>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              • <strong>In-Memory Micro-Cache:</strong> Setiap kalimat yang telah disintesis disimpan di memori server dan peramban, sehingga replay atau pengulangan bab tidak lagi memakan kuota Gemini API.
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              • <strong>Multi-Model Cascade:</strong> Memprioritaskan <code className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">gemini-2.5-flash-preview-tts</code> dengan kuota lebih lapang, beralih mulus ke <code className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">gemini-3.1-flash-tts-preview</code> saat diperlukan.
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              • <strong>Zero-Drop Continuity:</strong> Apabila limit kuota harian tercapai, alur narasi novel otomatis beralih seketika ke Web Speech lokal tanpa suara terputus.
            </p>
          </div>
        </div>

        {/* Footer Aksi */}
        <div
          className="px-4 sm:px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-2.5 shrink-0"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              id="btn-test-ping-tts"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium border hover:opacity-85 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-panel)',
              }}
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : 'text-amber-500'}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Ping Koneksi'}</span>
            </button>

            <button
              id="btn-clear-tts-cache"
              onClick={handleClearCache}
              title="Kosongkan memori audio"
              className="flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border hover:opacity-85 active:scale-95 transition-all cursor-pointer"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--text-secondary)',
              }}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Bersihkan Cache</span>
            </button>
          </div>

          <button
            id="btn-done-tts-monitor"
            onClick={onClose}
            className="flex items-center justify-center min-h-[40px] px-5 py-2 rounded-xl text-xs font-medium shadow-xs active:scale-95 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
