// src/components/TestSoundButton.js
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useSound } from '../hooks/useSound';

export default function TestSoundButton() {
  const playSound = useSound();

  const testSounds = [
    { type: 'success', label: 'Test Success' },
    { type: 'error', label: 'Test Error' },
    { type: 'warning', label: 'Test Warning' },
    { type: 'info', label: 'Test Info' },
    { type: 'alert', label: 'Test Alert' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sound Test</Text>
      {testSounds.map((sound) => (
        <TouchableOpacity
          key={sound.type}
          style={styles.button}
          onPress={() => playSound(sound.type)}
        >
          <Text style={styles.buttonText}>{sound.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    marginVertical: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});