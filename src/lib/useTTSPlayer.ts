import { useState, useEffect, useRef, useCallback } from 'react';
import { SentenceUnit } from './sentenceParser';
import { TTSSettings, TTSEngine, StorytellerMode, PiperModelState } from '../types';
import { loadTTSSettings, saveTTSSettings } from './storage';

export interface UseTTSPlayerProps {
  unitId: string;
  sentences: SentenceUnit[];
  onChapterCompleted?: () => void;
  onNavigateToNextUnit?: () => void;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isChapterEnded, setIsChapterEnded] = useState(false);

  // Piper Neural State
  const [piperState, setPiperState] = useState<PiperModelState>(() => {
    const isDownloaded =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('lorong_pena_piper_downloaded') === 'true';
    return {
      isDownloaded,
      isDownloading: false,
      downloadProgress: isDownloaded ? 100 : 0,
    };
  });

  // Refs to avoid stale closures in Web Speech callbacks
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pauseTimerRef = useRef<number | null>(null);

  const clearPauseTimer = () => {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  // Load available system voices with priority sorting
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter suara bahasa Indonesia atau suara multilingual
      const idVoices = allVoices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia') ||
          v.name.toLowerCase().includes('bahasa')
      );

      // Urutkan suara: utamakan Natural / WaveNet / Online / Google / Damayanti / Enhanced
      idVoices.sort((a, b) => {
        const isPremiumA = /natural|wavenet|online|google|damayanti|enhanced|premium/i.test(a.name);
        const isPremiumB = /natural|wavenet|online|google|damayanti|enhanced|premium/i.test(b.name);
        if (isPremiumA && !isPremiumB) return -1;
        if (!isPremiumA && isPremiumB) return 1;
        return a.name.localeCompare(b.name);
      });

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

  // Reset or pause player when unitId changes
  useEffect(() => {
    clearPauseTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setActiveSentenceId(null);
    setIsChapterEnded(false);
  }, [unitId]);

  // Handle auto-scroll to active sentence
  useEffect(() => {
    if (!settings.autoScroll || !activeSentenceId) return;

    const element = document.getElementById(activeSentenceId);
    if (element) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= 100 && rect.bottom <= window.innerHeight - 180;
      if (!isVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSentenceId, settings.autoScroll]);

  // Core speak sentence function with Storyteller Prosody Engine
  const speakSentenceAtIndex = useCallback(
    (index: number) => {
      clearPauseTimer();
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const currentSentences = sentencesRef.current;
      if (index < 0 || index >= currentSentences.length) {
        // Akhir dari bab tercapai
        setIsPlaying(false);
        setIsPaused(false);
        setActiveSentenceId(null);
        setIsChapterEnded(true);
        if (onChapterCompleted) {
          onChapterCompleted();
        }
        return;
      }

      window.speechSynthesis.cancel();

      const sentence = currentSentences[index];
      setCurrentIndex(index);
      setActiveSentenceId(sentence.id);
      setIsChapterEnded(false);

      // Gunakan cleanSpokenText agar mesin tidak melafalkan tanda baca secara harfiah
      const textToSpeak = sentence.cleanSpokenText || sentence.text;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance;

      // Konfigurasi dasar tempo dan nada
      const baseRate = settingsRef.current.rate;
      const basePitch = settingsRef.current.pitch;

      let targetRate = baseRate;
      let targetPitch = basePitch;

      // Modulasi intonasi narator: dialog tokoh dibuat sedikit lebih hidup
      if (sentence.isDialogue && settingsRef.current.dialogueModulation) {
        targetPitch = Math.min(1.15, basePitch * 1.04);
        targetRate = Math.min(1.15, baseRate * 1.02);
      }

      utterance.rate = targetRate;
      utterance.pitch = targetPitch;
      utterance.lang = 'id-ID';

      // Pilih suara bahasa Indonesia jika tersedia
      const voices = window.speechSynthesis.getVoices();
      if (settingsRef.current.voiceURI) {
        const selected = voices.find((v) => v.voiceURI === settingsRef.current.voiceURI);
        if (selected) utterance.voice = selected;
      } else {
        const defaultIdVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('id') ||
            v.name.toLowerCase().includes('indonesia')
        );
        if (defaultIdVoice) utterance.voice = defaultIdVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        if (isPlayingRef.current) {
          const nextIndex = index + 1;
          if (nextIndex < currentSentences.length) {
            // Hitung jeda napas cerdas khas pendongeng
            let pauseDuration = 140; // standar minimal

            if (settingsRef.current.naturalPauses) {
              const mode = settingsRef.current.mode;
              const multiplier = mode === 'renung' ? 1.35 : mode === 'wajar' ? 0.75 : 1.0;

              if (sentence.isSceneEnd) {
                // Jeda hening yang luas sebelum adegan baru (• • •)
                pauseDuration = Math.round(1800 * multiplier);
              } else if (sentence.isParagraphEnd) {
                // Jeda napas pergantian alinea narasi
                pauseDuration = Math.round(920 * multiplier);
              } else {
                const trimmed = sentence.text.trim();
                if (trimmed.endsWith('...') || trimmed.endsWith('…') || trimmed.endsWith('...”') || trimmed.endsWith('..."')) {
                  pauseDuration = Math.round(800 * multiplier);
                } else if (trimmed.endsWith('?') || trimmed.endsWith('?”') || trimmed.endsWith('?"')) {
                  pauseDuration = Math.round(620 * multiplier);
                } else if (trimmed.endsWith('!') || trimmed.endsWith('!”') || trimmed.endsWith('!"')) {
                  pauseDuration = Math.round(580 * multiplier);
                } else {
                  pauseDuration = Math.round(460 * multiplier);
                }
              }
            }

            pauseTimerRef.current = window.setTimeout(() => {
              if (isPlayingRef.current) {
                speakSentenceAtIndex(nextIndex);
              }
            }, pauseDuration);
          } else {
            // Bab selesai! Jeda otomatis di ujung bab (prinsip PRD)
            setIsPlaying(false);
            setIsPaused(false);
            setActiveSentenceId(null);
            setIsChapterEnded(true);
            if (onChapterCompleted) {
              onChapterCompleted();
            }
          }
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('TTS Notice:', e.error);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [onChapterCompleted]
  );

  // Play / Resume
  const play = useCallback(
    (indexToPlay?: number) => {
      clearPauseTimer();
      const targetIndex = indexToPlay ?? currentIndexRef.current;
      setIsPlaying(true);
      setIsPaused(false);
      setIsChapterEnded(false);
      speakSentenceAtIndex(targetIndex);
    },
    [speakSentenceAtIndex]
  );

  // Pause
  const pause = useCallback(() => {
    clearPauseTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  // Stop / Close
  const stop = useCallback(() => {
    clearPauseTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceId(null);
  }, []);

  // Skip to next sentence
  const nextSentence = useCallback(() => {
    clearPauseTimer();
    const nextIdx = Math.min(sentencesRef.current.length - 1, currentIndexRef.current + 1);
    if (isPlayingRef.current) {
      speakSentenceAtIndex(nextIdx);
    } else {
      setCurrentIndex(nextIdx);
      setActiveSentenceId(sentencesRef.current[nextIdx]?.id ?? null);
    }
  }, [speakSentenceAtIndex]);

  // Skip to previous sentence
  const prevSentence = useCallback(() => {
    clearPauseTimer();
    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    if (isPlayingRef.current) {
      speakSentenceAtIndex(prevIdx);
    } else {
      setCurrentIndex(prevIdx);
      setActiveSentenceId(sentencesRef.current[prevIdx]?.id ?? null);
    }
  }, [speakSentenceAtIndex]);

  // Click on any sentence to play directly
  const playSentenceById = useCallback(
    (sentenceId: string) => {
      clearPauseTimer();
      const idx = sentencesRef.current.findIndex((s) => s.id === sentenceId);
      if (idx !== -1) {
        setIsPlaying(true);
        setIsPaused(false);
        setIsChapterEnded(false);
        speakSentenceAtIndex(idx);
      }
    },
    [speakSentenceAtIndex]
  );

  // Settings updates
  const updateSettings = useCallback(
    (newSettings: Partial<TTSSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        saveTTSSettings(updated);
        return updated;
      });

      if (isPlayingRef.current) {
        clearPauseTimer();
        speakSentenceAtIndex(currentIndexRef.current);
      }
    },
    [speakSentenceAtIndex]
  );

  // Switch Storyteller Mode preset
  const setStorytellerMode = useCallback(
    (mode: StorytellerMode) => {
      let overrides: Partial<TTSSettings> = { mode };
      if (mode === 'hikayat') {
        overrides = {
          mode: 'hikayat',
          rate: 0.88,
          pitch: 0.98,
          naturalPauses: true,
          dialogueModulation: true,
        };
      } else if (mode === 'renung') {
        overrides = {
          mode: 'renung',
          rate: 0.80,
          pitch: 0.95,
          naturalPauses: true,
          dialogueModulation: true,
        };
      } else if (mode === 'wajar') {
        overrides = {
          mode: 'wajar',
          rate: 0.98,
          pitch: 1.0,
          naturalPauses: false,
          dialogueModulation: false,
        };
      }
      updateSettings(overrides);
    },
    [updateSettings]
  );

  // Piper Model Download Simulator
  const downloadPiperModel = useCallback(() => {
    if (piperState.isDownloaded || piperState.isDownloading) return;

    setPiperState((prev) => ({ ...prev, isDownloading: true, downloadProgress: 10, error: undefined }));

    let progress = 10;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setPiperState({
          isDownloaded: true,
          isDownloading: false,
          downloadProgress: 100,
        });
        try {
          localStorage.setItem('lorong_pena_piper_downloaded', 'true');
        } catch {
          // ignore
        }
      } else {
        setPiperState((prev) => ({ ...prev, downloadProgress: progress }));
      }
    }, 400);
  }, [piperState.isDownloaded, piperState.isDownloading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearPauseTimer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isPlaying,
    isPaused,
    currentIndex,
    totalSentences: sentences.length,
    currentSentence: sentences[currentIndex] ?? null,
    activeSentenceId,
    isChapterEnded,
    settings,
    availableVoices,
    piperState,
    play,
    pause,
    stop,
    nextSentence,
    prevSentence,
    playSentenceById,
    updateSettings,
    setStorytellerMode,
    downloadPiperModel,
  };
}
