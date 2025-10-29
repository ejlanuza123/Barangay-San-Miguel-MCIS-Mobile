// src/context/SoundSettingsContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SoundSettingsContext = createContext();

export const useSoundSettings = () => {
  const context = useContext(SoundSettingsContext);
  if (!context) {
    throw new Error('useSoundSettings must be used within a SoundSettingsProvider');
  }
  return context;
};

export const SoundSettingsProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSoundSettings();
  }, []);

  const loadSoundSettings = async () => {
    try {
      const storedValue = await AsyncStorage.getItem('notification_sound_enabled');
      if (storedValue !== null) {
        setSoundEnabled(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSound = async (value) => {
    try {
      setSoundEnabled(value);
      await AsyncStorage.setItem('notification_sound_enabled', JSON.stringify(value));
      console.log('Sound setting saved:', value);
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  };

  const value = {
    soundEnabled,
    toggleSound,
    isLoading
  };

  return (
    <SoundSettingsContext.Provider value={value}>
      {children}
    </SoundSettingsContext.Provider>
  );
};