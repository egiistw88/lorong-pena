import { useState, useEffect, useRef, useCallback } from 'react';
import { SentenceUnit } from './sentenceParser';
import { TTSSettings, StorytellerMode, AudioSourceType, GeminiVoiceId } from '../types';
import { loadTTSSettings, saveTTSSettings } from './storage';

export interface UseTTSPlayerProps {
  unitId: string;
  sentences: SentenceUnit[];
  onChapterCompleted?: () => void;
  onNavigateToNextUnit?: () => void;
}

// Client-side in-memory cache untuk audio blob URLs (Zero-latency replay & prefetch)
const clientAudioCache = new Map<string, string>();
const MAX_CLIENT_CACHE = 60;

function storeClientAudio(key: string, url: string) {
  if (clientAudioCache.size >= MAX_CLIENT_CACHE) {
    const firstEntry = clientAudioCache.entries().next().value;
    if (firstEntry) {
      const [oldKey, oldUrl] = firstEntry;
      try {
        URL.revokeObjectURL(oldUrl);
      } catch {
        // ignore
      }
      clientAudioCache.delete(oldKey);
    }
  }
  clientAudioCache.set(key, url);
}

export function clearAllClientAudioCache() {
  for (const [, url] of clientAudioCache) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  clientAudioCache.clear();
}

function getClientCacheKey(text: string, voice: string, rate: number): string {
  // Normalisasi teks untuk key cache agar spasi berlebih tidak membuat duplikat
  return `${voice}_${rate.toFixed(2)}_${text.trim().replace(/\s+/g, ' ')}`;
}

export function useTTSPlayer({
  unitId,
  sentences,
  onChapterCompleted,
  onNavigateToNextUnit,
}: UseTTSPlayerProps) {
  const [settings, setSettings] = useState<TTSSettings>(loadTTSSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isChapterEnded, setIsChapterEnded] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSourceType>('gemini-server');
  const [hasStudioAudio, setHasStudioAudio] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronized state refs (Mencegah stale closures)
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Audio lifecycle & anti-overlap refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTokenRef = useRef<number>(0);
  const pauseTimerRef = useRef<number | null>(null);
  const prefetchingSetRef = useRef<Set<string>>(new Set());
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isQuotaExceededRef = useRef<boolean>(false);

  // Bersihkan timer jeda antar kalimat
  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  /**
   * STOP TOTAL SEMUA SUARA (Anti-Echo / Anti-Overlap Absolute Guarantee)
   * Menghentikan audio element persisten, membatalkan request fetch, dan WebSpeech.
   */
  const stopAllAudio = useCallback(() => {
    // 1. Increment sequence token agar callback async lama langsung gugur
    playbackTokenRef.current += 1;

    // 2. Bersihkan jeda timer
    clearPauseTimer();

    // 3. Batalkan fetch audio yang sedang terbang
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    // 4. Hentikan pemutaran audio element tunggal
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    // 5. Batalkan Web Speech Synthesis jika sempat menyala
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsLoadingAudio(false);
  }, [clearPauseTimer]);

  // Muat daftar suara peramban (untuk fallback jika offline)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const idVoices = allVoices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia') ||
          v.name.toLowerCase().includes('bahasa')
      );
      setAvailableVoices(idVoices.length > 0 ? idVoices : allVoices);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Reset bersih saat bab berganti
  useEffect(() => {
    stopAllAudio();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setActiveSentenceId(null);
    setIsChapterEnded(false);
    setErrorMessage(null);
  }, [unitId, stopAllAudio]);

  // Penyelarasan Gulir Layar Lembut (Hanya bergulir halus bila kalimat di luar safe-zone)
  useEffect(() => {
    if (!settings.autoScroll || !activeSentenceId) return;

    const element = document.getElementById(activeSentenceId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const topSafeZone = 140; // Di bawah bilah header
    const bottomSafeZone = window.innerHeight - 190; // Di atas player bar

    if (rect.top < topSafeZone || rect.bottom > bottomSafeZone) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSentenceId, settings.autoScroll]);

  // Kalkulasi jeda napas sastra yang alami dan tidak canggung
  const calculatePauseDuration = useCallback((sentence: SentenceUnit): number => {
    if (!settingsRef.current.naturalPauses) return 80;
    const mode = settingsRef.current.mode;
    const multiplier = mode === 'renung' ? 1.25 : mode === 'wajar' ? 0.75 : 1.0;

    if (sentence.isSceneEnd) {
      // Jeda hening sebelum adegan baru (• • •)
      return Math.round(950 * multiplier);
    } else if (sentence.isParagraphEnd) {
      // Jeda pergantian paragraf alinea naskah
      return Math.round(450 * multiplier);
    } else {
      const trimmed = sentence.text.trim();
      if (trimmed.endsWith('...') || trimmed.endsWith('…')) {
        return Math.round(380 * multiplier);
      } else if (trimmed.endsWith('?') || trimmed.endsWith('!')) {
        return Math.round(280 * multiplier);
      }
      return Math.round(180 * multiplier);
    }
  }, []);

  /**
   * Cerdas: Prefetch 1 kalimat ke depan di background
   * Memastikan kelancaran transisi tanpa membebani kuota API berlebih.
   */
  const prefetchSentenceAudio = useCallback(async (index: number) => {
    if (isQuotaExceededRef.current) return;
    const list = sentencesRef.current;
    if (index < 0 || index >= list.length) return;

    const target = list[index];
    const textToSpeak = target.cleanSpokenText || target.text;
    const voice = settingsRef.current.geminiVoice || 'Charon';
    const rate = settingsRef.current.rate || 1.0;
    const cacheKey = getClientCacheKey(textToSpeak, voice, rate);

    if (clientAudioCache.has(cacheKey) || prefetchingSetRef.current.has(cacheKey)) {
      return;
    }

    prefetchingSetRef.current.add(cacheKey);

    try {
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice,
          rate,
          isDialogue: target.isDialogue,
        }),
      });

      if (res.status === 429) {
        isQuotaExceededRef.current = true;
        return;
      }

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        storeClientAudio(cacheKey, url);
      }
    } catch {
      // Prefetch gagal di background tidak merusak audio saat ini
    } finally {
      prefetchingSetRef.current.delete(cacheKey);
    }
  }, []);

  // Ambil Audio Blob URL (Cache-first)
  const fetchAudioBlobUrl = useCallback(
    async (sentence: SentenceUnit, signal: AbortSignal): Promise<string> => {
      const textToSpeak = sentence.cleanSpokenText || sentence.text;
      const voice = settingsRef.current.geminiVoice || 'Charon';
      const rate = settingsRef.current.rate || 1.0;
      const cacheKey = getClientCacheKey(textToSpeak, voice, rate);

      if (clientAudioCache.has(cacheKey)) {
        return clientAudioCache.get(cacheKey)!;
      }

      if (isQuotaExceededRef.current) {
        throw new Error('QUOTA_EXCEEDED');
      }

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice,
          rate,
          isDialogue: sentence.isDialogue,
        }),
        signal,
      });

      if (res.status === 429) {
        isQuotaExceededRef.current = true;
        throw new Error('QUOTA_EXCEEDED');
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server status ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      storeClientAudio(cacheKey, url);
      return url;
    },
    []
  );

  // Fallback lokal jika Gemini Server API tidak tersedia
  const fallbackWebSpeech = useCallback(
    (index: number, sentence: SentenceUnit, currentSentences: SentenceUnit[]) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsLoadingAudio(false);
        setIsPlaying(false);
        return;
      }

      setAudioSource('web-speech');
      setIsLoadingAudio(false);
      const textToSpeak = sentence.cleanSpokenText || sentence.text;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      utterance.rate = settingsRef.current.rate || 1.0;
      utterance.pitch = settingsRef.current.pitch || 1.0;
      utterance.lang = 'id-ID';

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) utterance.voice = idVoice;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        if (!isPlayingRef.current) return;
        const nextIndex = index + 1;
        if (nextIndex < currentSentences.length) {
          const pauseMs = calculatePauseDuration(sentence);
          pauseTimerRef.current = window.setTimeout(() => {
            if (isPlayingRef.current) {
              speakSentenceAtIndex(nextIndex);
            }
          }, pauseMs);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setActiveSentenceId(null);
          setIsChapterEnded(true);
          if (onChapterCompleted) onChapterCompleted();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Web Speech fallback error:', e.error);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [calculatePauseDuration, onChapterCompleted]
  );

  /**
   * EKSEKUSI PEMUTARAN KALIMAT DENGAN SEQUENCE TOKEN GUARD
   * Menjamin ketepatan urutan, audio jernih, dan anti-echo tanpa kompromi.
   */
  const speakSentenceAtIndex = useCallback(
    async (index: number) => {
      // 1. Matikan pemutaran sebelumnya dan dapatkan token urutan baru
      stopAllAudio();
      const currentToken = ++playbackTokenRef.current;

      const currentSentences = sentencesRef.current;
      if (index < 0 || index >= currentSentences.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveSentenceId(null);
        setIsChapterEnded(true);
        if (onChapterCompleted) onChapterCompleted();
        return;
      }

      const sentence = currentSentences[index];
      setCurrentIndex(index);
      setActiveSentenceId(sentence.id);
      setIsChapterEnded(false);
      setErrorMessage(null);

      // Jika kuota server sudah tercapai, langsung jalankan Web Speech tanpa request ke server
      if (isQuotaExceededRef.current) {
        fallbackWebSpeech(index, sentence, currentSentences);
        return;
      }

      // Cerdas: Prefetch 1 kalimat berikutnya di background
      const next1 = index + 1;
      if (next1 < currentSentences.length && !isQuotaExceededRef.current) {
        prefetchSentenceAudio(next1);
      }

      const userEngine = settingsRef.current.engine;
      if (userEngine === 'web-speech') {
        fallbackWebSpeech(index, sentence, currentSentences);
        return;
      }

      // Default: Gemini Server Generative Audio
      setIsLoadingAudio(true);
      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;

      try {
        const audioUrl = await fetchAudioBlobUrl(sentence, abortController.signal);

        // Guard: Jika token berubah atau player sudah di-stop saat menunggu fetch
        if (currentToken !== playbackTokenRef.current || !isPlayingRef.current) {
          return;
        }

        // Gunakan satu elemen audio persisten (Mencegah memory leak & tumpang tindih)
        let audio = audioRef.current;
        if (!audio) {
          audio = new Audio();
          audioRef.current = audio;
        }

        audio.pause();
        audio.src = audioUrl;
        audio.playbackRate = settingsRef.current.rate || 1.0;
        audio.volume = 1.0;

        audio.onplay = () => {
          if (currentToken !== playbackTokenRef.current) return;
          setIsLoadingAudio(false);
          setIsPlaying(true);
          setIsPaused(false);
          setAudioSource('gemini-server');
        };

        audio.onended = () => {
          if (currentToken !== playbackTokenRef.current || !isPlayingRef.current) return;

          const nextIndex = index + 1;
          if (nextIndex < currentSentences.length) {
            const pauseMs = calculatePauseDuration(sentence);
            pauseTimerRef.current = window.setTimeout(() => {
              if (currentToken === playbackTokenRef.current && isPlayingRef.current) {
                speakSentenceAtIndex(nextIndex);
              }
            }, pauseMs);
          } else {
            setIsPlaying(false);
            setIsPaused(false);
            setActiveSentenceId(null);
            setIsChapterEnded(true);
            if (onChapterCompleted) onChapterCompleted();
          }
        };

        audio.onerror = () => {
          if (currentToken !== playbackTokenRef.current) return;
          console.warn('Audio play error, falling back to Web Speech.');
          fallbackWebSpeech(index, sentence, currentSentences);
        };

        await audio.play();
      } catch (err: any) {
        if (err.name === 'AbortError' || currentToken !== playbackTokenRef.current) {
          return;
        }
        if (err.message === 'QUOTA_EXCEEDED') {
          isQuotaExceededRef.current = true;
          setErrorMessage('Batas kuota Gemini tercapai. Narasi otomatis beralih ke suara peramban lokal.');
        } else {
          console.warn('Gemini audio fetch failed:', err.message);
          setErrorMessage('Beralih sementara ke suara Web Speech lokal.');
        }
        fallbackWebSpeech(index, sentence, currentSentences);
      }
    },
    [
      calculatePauseDuration,
      fallbackWebSpeech,
      fetchAudioBlobUrl,
      onChapterCompleted,
      prefetchSentenceAudio,
      stopAllAudio,
    ]
  );

  // Play / Resume
  const play = useCallback(
    (indexToPlay?: number) => {
      clearPauseTimer();
      const targetIndex = indexToPlay ?? currentIndexRef.current;

      // Resume jika ada audio yang sedang dijeda di kalimat yang sama
      if (
        isPaused &&
        audioRef.current &&
        audioRef.current.src &&
        (indexToPlay === undefined || indexToPlay === currentIndexRef.current)
      ) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsPaused(false);
            setIsChapterEnded(false);
          })
          .catch(() => {
            speakSentenceAtIndex(targetIndex);
          });
        return;
      }

      setIsPlaying(true);
      setIsPaused(false);
      setIsChapterEnded(false);
      speakSentenceAtIndex(targetIndex);
    },
    [clearPauseTimer, isPaused, speakSentenceAtIndex]
  );

  // Pause
  const pause = useCallback(() => {
    clearPauseTimer();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(true);
  }, [clearPauseTimer]);

  // Stop
  const stop = useCallback(() => {
    stopAllAudio();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceId(null);
  }, [stopAllAudio]);

  // Navigasi kalimat berikutnya
  const nextSentence = useCallback(() => {
    clearPauseTimer();
    const nextIdx = Math.min(sentencesRef.current.length - 1, currentIndexRef.current + 1);
    if (isPlayingRef.current) {
      speakSentenceAtIndex(nextIdx);
    } else {
      setCurrentIndex(nextIdx);
      const target = sentencesRef.current[nextIdx];
      if (target) setActiveSentenceId(target.id);
    }
  }, [clearPauseTimer, speakSentenceAtIndex]);

  // Navigasi kalimat sebelumnya
  const prevSentence = useCallback(() => {
    clearPauseTimer();
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    if (isPlayingRef.current) {
      speakSentenceAtIndex(prevIdx);
    } else {
      setCurrentIndex(prevIdx);
      const target = sentencesRef.current[prevIdx];
      if (target) setActiveSentenceId(target.id);
    }
  }, [clearPauseTimer, speakSentenceAtIndex]);

  // Putar kalimat tertentu dari klik naskah
  const playSentenceById = useCallback(
    (sentenceId: string) => {
      const idx = sentencesRef.current.findIndex((s) => s.id === sentenceId);
      if (idx !== -1) {
        setIsPlaying(true);
        setIsPaused(false);
        speakSentenceAtIndex(idx);
      }
    },
    [speakSentenceAtIndex]
  );

  // Pembaruan pengaturan narasi
  const updateSettings = useCallback(
    (newSettings: Partial<TTSSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        saveTTSSettings(updated);
        return updated;
      });

      // Jika kecepatan diubah saat audio sedang aktif
      if (newSettings.rate && audioRef.current) {
        audioRef.current.playbackRate = newSettings.rate;
      }

      // Jika suara atau mesin diubah saat sedang memutar, reload kalimat saat ini dengan suara baru
      if (
        (newSettings.geminiVoice || newSettings.engine) &&
        isPlayingRef.current
      ) {
        speakSentenceAtIndex(currentIndexRef.current);
      }
    },
    [speakSentenceAtIndex]
  );

  const setStorytellerMode = useCallback(
    (mode: StorytellerMode) => {
      updateSettings({ mode });
    },
    [updateSettings]
  );

  const resetQuotaStatus = useCallback(() => {
    isQuotaExceededRef.current = false;
    setErrorMessage(null);
  }, []);

  const clearClientCache = useCallback(() => {
    clearAllClientAudioCache();
  }, []);

  // Cleanup saat komponen unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const currentSentence =
    currentIndex >= 0 && currentIndex < sentences.length ? sentences[currentIndex] : null;

  return {
    isPlaying,
    isPaused,
    isLoadingAudio,
    currentIndex,
    totalSentences: sentences.length,
    currentSentence,
    activeSentenceId,
    availableVoices,
    isChapterEnded,
    audioSource,
    hasStudioAudio,
    errorMessage,
    settings,
    play,
    pause,
    stop,
    nextSentence,
    prevSentence,
    playSentenceById,
    updateSettings,
    setStorytellerMode,
    resetQuotaStatus,
    clearClientCache,
  };
}
