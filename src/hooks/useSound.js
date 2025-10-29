// src/hooks/useSound.js
import { useCallback } from 'react';
import { Audio } from 'expo-av';

// Global sound cache
const soundCache = new Map();

export const useSound = () => {
  const playSound = useCallback(async (type = 'info') => {
    try {
      console.log(`🔊 Attempting to play: ${type}`);
      
      // Configure audio mode first
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      const soundMap = {
        success: require('../assets/sounds/success.mp3'),
        error: require('../assets/sounds/error.mp3'),
        warning: require('../assets/sounds/warning.mp3'),
        info: require('../assets/sounds/notification.mp3'),
        alert: require('../assets/sounds/alert.mp3'),
      };

      const soundSource = soundMap[type] || soundMap.info;
      
      let sound = soundCache.get(type);
      
      if (!sound) {
        console.log('🔊 Loading new sound...');
        const { sound: newSound } = await Audio.Sound.createAsync(soundSource);
        sound = newSound;
        soundCache.set(type, sound);
      }

      // Stop current playback and replay
      await sound.stopAsync();
      await sound.playAsync();
      console.log('✅ Sound playback started');
      
    } catch (error) {
      console.error('❌ Sound error:', error.message);
    }
  }, []);

  return playSound;
};