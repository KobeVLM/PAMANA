import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface AudioContextType {
  isAudioPlaying: boolean;
  playAudio: (url: string, blockUi?: boolean) => Promise<void>;
  stopAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsAudioPlaying(false);
  }, []);

  // Clean up audio on route change (stops dialogue/sentences when user navigates away or logs out)
  useEffect(() => {
    stopAudio();
  }, [location.pathname, stopAudio]);

  // Clean up audio on unmount or when tab/window is hidden or closed ("outs")
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopAudio();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);
    window.addEventListener('beforeunload', handleVisibility);

    return () => {
      stopAudio();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
      window.removeEventListener('beforeunload', handleVisibility);
    };
  }, [stopAudio]);

  const playAudio = useCallback((url: string, blockUi: boolean = true): Promise<void> => {
    return new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      if (blockUi) {
        setIsAudioPlaying(true);
      }

      audio.onended = () => {
        if (blockUi) setIsAudioPlaying(false);
        resolve();
      };

      audio.onerror = (e) => {
        console.error('Audio playback failed:', e);
        if (blockUi) setIsAudioPlaying(false);
        // Resolve anyway so game doesn't get stuck if audio is missing
        resolve();
      };

      audio.play().catch(e => {
        console.error('Autoplay prevented or audio error:', e);
        if (blockUi) setIsAudioPlaying(false);
        resolve();
      });
    });
  }, []);

  return (
    <AudioContext.Provider value={{ isAudioPlaying, playAudio, stopAudio }}>
      {children}
      {/* Global UI Blocker overlay */}
      {isAudioPlaying && (
        <div 
          className="fixed inset-0 z-[9999] cursor-wait"
          style={{ pointerEvents: 'auto' }}
          title="Nagsasalita pa si Lolo..."
        />
      )}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
