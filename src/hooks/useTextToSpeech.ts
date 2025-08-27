// src/hooks/useTextToSpeech.ts
import { useState, useEffect } from 'react';
import * as Speech from 'expo-speech';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isEnabled: boolean;
  toggleEnabled: () => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);

  useEffect(() => {
    return () => {
      // Cleanup: stop any ongoing speech when component unmounts
      Speech.stop();
    };
  }, []);

  const speak = async (text: string): Promise<void> => {
    if (!isEnabled || !text.trim()) return;

    try {
      setIsSpeaking(true);
      
      // Clean the text for better speech
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
        .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links
        .replace(/`(.*?)`/g, '$1') // Remove code blocks
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\n\s*\n/g, '. ') // Replace multiple newlines with periods
        .replace(/\n/g, ' ') // Replace single newlines with spaces
        .trim();

      await Speech.speak(cleanText, {
        language: 'en-US',
        rate: voiceSpeed,
        pitch: 1.1, // Higher pitch for female voice
        volume: 0.8,
        onDone: () => {
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
        },
        onStopped: () => {
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Error starting speech:', error);
      setIsSpeaking(false);
    }
  };

  const stop = (): void => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const toggleEnabled = (): void => {
    if (isSpeaking) {
      stop();
    }
    setIsEnabled(!isEnabled);
  };

  return {
    isSpeaking,
    speak,
    stop,
    isEnabled,
    toggleEnabled,
    voiceSpeed,
    setVoiceSpeed,
  };
};
