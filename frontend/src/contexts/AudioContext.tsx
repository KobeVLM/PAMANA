import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AudioContextType {
  isAudioPlaying: boolean;
  playAudio: (url: string, blockUi?: boolean) => Promise<void>;
  stopAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const playAudio = (url: string, blockUi: boolean = true): Promise<void> => {
    return new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause();
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
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

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
