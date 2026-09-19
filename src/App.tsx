import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UnitNarasi, ReaderSettings, ReadingProgress } from './types';
import { getAllUnits, getUnitById, getNextUnit, getPreviousUnit } from './content/units';
import { loadSettings, saveSettings, loadProgress, saveProgress } from './lib/storage';
import { Header } from './components/Header';
import { ReaderView } from './components/ReaderView';
import { HomeView } from './components/HomeView';
import { TableOfContentsModal } from './components/TableOfContentsModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { ManuscriptImportModal } from './components/ManuscriptImportModal';
import { TTSPlayerBar } from './components/TTSPlayerBar';
import { ReaderFooter } from './components/ReaderFooter';
import { useTTSPlayer } from './lib/useTTSPlayer';
import { extractSentencesFromUnit } from './lib/sentenceParser';

export default function App() {
  // Load settings and progress from localStorage
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [progress, setProgress] = useState<ReadingProgress>(loadProgress);

  // Units list (allows dynamic updates from import)
  const [units, setUnits] = useState<UnitNarasi[]>(getAllUnits);

  // Active view: 'home' or 'reader'
  const [activeView, setActiveView] = useState<'home' | 'reader'>('home');

  // Active reading unit
  const [currentUnitId, setCurrentUnitId] = useState<string>(progress.currentUnitId || 'prolog');

  // Modals / Drawer state
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTTSOpen, setIsTTSOpen] = useState(false);

  // Reading scroll percentage for top indicator
  const [scrollProgress, setScrollProgress] = useState(0);

  // Chrome visibility (auto-hide saat scroll ke bawah, muncul saat scroll ke atas atau disentuh)
  const [isChromeVisible, setIsChromeVisible] = useState(true);

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-terang', 'theme-gelap', 'theme-sephia');
    root.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);

  // Persist settings
  const handleUpdateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Get current unit object
  const currentUnit = useMemo(() => {
    return units.find((u) => u.id === currentUnitId) || units[0];
  }, [units, currentUnitId]);

  // Previous & Next units
  const previousUnit = useMemo(() => {
    const index = units.findIndex((u) => u.id === currentUnitId);
    return index > 0 ? units[index - 1] : undefined;
  }, [units, currentUnitId]);

  const nextUnit = useMemo(() => {
    const index = units.findIndex((u) => u.id === currentUnitId);
    return index >= 0 && index < units.length - 1 ? units[index + 1] : undefined;
  }, [units, currentUnitId]);

  // Extract sentences for TTS
  const currentUnitSentences = useMemo(() => {
    return extractSentencesFromUnit(currentUnit.id, currentUnit.adegan);
  }, [currentUnit.id, currentUnit.adegan]);

  const handleMarkUnitCompleted = useCallback((unitId: string) => {
    setProgress((prev) => {
      if (!prev.completedUnitIds.includes(unitId)) {
        const updatedList = [...prev.completedUnitIds, unitId];
        const updated = saveProgress({ completedUnitIds: updatedList });
        return updated;
      }
      return prev;
    });
  }, []);

  // Navigation handlers
  const handleNavigateToUnit = useCallback((unitId: string) => {
    setCurrentUnitId(unitId);
    setActiveView('reader');
    setScrollProgress(0);
    setIsChromeVisible(true);

    const updated = saveProgress({ currentUnitId: unitId });
    setProgress(updated);
  }, []);

  // TTS Player Hook
  const tts = useTTSPlayer({
    unitId: currentUnit.id,
    sentences: currentUnitSentences,
    onChapterCompleted: () => {
      handleMarkUnitCompleted(currentUnit.id);
    },
    onNavigateToNextUnit: () => {
      if (nextUnit) {
        handleNavigateToUnit(nextUnit.id);
        tts.play(0);
      }
    },
  });

  const handleToggleTTS = useCallback(() => {
    setIsTTSOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        if (!tts.isPlaying) {
          tts.play();
        }
      } else {
        tts.pause();
      }
      return nextState;
    });
  }, [tts]);

  const handleSentenceClick = useCallback((sentenceId: string) => {
    setIsTTSOpen(true);
    tts.playSentenceById(sentenceId);
  }, [tts]);

  const handleResumeReading = useCallback(() => {
    setActiveView('reader');
    setIsChromeVisible(true);
  }, []);

  const handleOpenHome = useCallback(() => {
    if (tts.isPlaying) {
      tts.pause();
    }
    setActiveView('home');
    setIsChromeVisible(true);
  }, [tts]);

  const handleSaveUnits = useCallback((updatedUnits: UnitNarasi[]) => {
    setUnits(updatedUnits);
    try {
      localStorage.setItem('lorong_pena_custom_units', JSON.stringify(updatedUnits));
    } catch {
      // Abaikan jika storage penuh
    }
  }, []);

  return (
    <div className={`min-h-screen theme-${settings.theme} selection:bg-amber-200 selection:text-stone-900 transition-colors duration-150`}>
      {/* Discreet Header dengan Auto-Hide saat Scroll */}
      <Header
        currentUnit={currentUnit}
        scrollProgress={scrollProgress}
        onOpenHome={handleOpenHome}
        onOpenTOC={() => setIsTOCOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTTS={handleToggleTTS}
        isTTSActive={isTTSOpen}
        isReadingMode={activeView === 'reader'}
        isVisible={activeView === 'home' ? true : isChromeVisible}
      />

      {/* Main View: Home vs Reader */}
      {activeView === 'home' ? (
        <HomeView
          lastReadUnit={currentUnit}
          units={units}
          progress={progress}
          onResumeReading={handleResumeReading}
          onOpenTOC={() => setIsTOCOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />
      ) : (
        <>
          <ReaderView
            unit={currentUnit}
            previousUnit={previousUnit}
            nextUnit={nextUnit}
            settings={settings}
            onNavigateToUnit={handleNavigateToUnit}
            onOpenTOC={() => setIsTOCOpen(true)}
            onScrollProgressChange={setScrollProgress}
            onMarkUnitCompleted={handleMarkUnitCompleted}
            isCompleted={progress.completedUnitIds.includes(currentUnit.id)}
            activeSentenceId={tts.activeSentenceId}
            onSentenceClick={handleSentenceClick}
            isTTSOpen={isTTSOpen}
            onChromeVisibilityChange={setIsChromeVisible}
          />

          {/* Minimalist Floating Footer saat mode baca */}
          <ReaderFooter
            scrollProgress={scrollProgress}
            isVisible={isChromeVisible}
            isTTSOpen={isTTSOpen}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenTOC={() => setIsTOCOpen(true)}
            onToggleTTS={handleToggleTTS}
            isTTSActive={isTTSOpen}
          />
        </>
      )}

      {/* Floating TTS Player Bar */}
      {activeView === 'reader' && isTTSOpen && (
        <TTSPlayerBar
          unit={currentUnit}
          nextUnit={nextUnit}
          isPlaying={tts.isPlaying}
          isPaused={tts.isPaused}
          currentIndex={tts.currentIndex}
          totalSentences={tts.totalSentences}
          currentSentence={tts.currentSentence}
          isChapterEnded={tts.isChapterEnded}
          settings={tts.settings}
          availableVoices={tts.availableVoices}
          onPlay={tts.play}
          onPause={tts.pause}
          onStop={() => {
            tts.stop();
            setIsTTSOpen(false);
          }}
          onNext={tts.nextSentence}
          onPrev={tts.prevSentence}
          onUpdateSettings={tts.updateSettings}
          onSetStorytellerMode={tts.setStorytellerMode}
          onNavigateToNextUnit={() => {
            if (nextUnit) {
              handleNavigateToUnit(nextUnit.id);
              setTimeout(() => {
                tts.play(0);
              }, 150);
            }
          }}
        />
      )}

      {/* Table of Contents Modal */}
      <TableOfContentsModal
        isOpen={isTOCOpen}
        onClose={() => setIsTOCOpen(false)}
        units={units}
        currentUnitId={currentUnitId}
        progress={progress}
        onSelectUnit={handleNavigateToUnit}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Manuscript Import / Pipeline Modal */}
      <ManuscriptImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        units={units}
        onSaveUnits={handleSaveUnits}
      />
    </div>
  );
}

