// src/components/layout/OfflineIndicator.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { syncOfflineData, checkSyncNotifications } from '../../services/syncService';
import { useNotification } from '../../context/NotificationContext';

export default function OfflineIndicator() {
  const isOffline = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { addNotification } = useNotification();
  
  const [showOnlineIndicator, setShowOnlineIndicator] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    let timer;
    if (isOffline) {
      setShowOnlineIndicator(false);
      setIsSyncing(false);
      setSyncComplete(false);
    } else {
      // When coming online, show connected message and start sync
      setShowOnlineIndicator(true);
      setIsSyncing(true);
      setSyncComplete(false);

      const syncData = async () => {
        try {
          console.log('Device came online, syncing data...');
          await syncOfflineData();
          await checkSyncNotifications(addNotification);
          
          // Sync completed successfully
          setIsSyncing(false);
          setSyncComplete(true);
          
          // Hide the indicator after 2 seconds when sync is complete
          timer = setTimeout(() => {
            setShowOnlineIndicator(false);
          }, 2000);
          
        } catch (error) {
          console.error('Error during auto-sync:', error);
          setIsSyncing(false);
          // Still hide after 3 seconds even if there's an error
          timer = setTimeout(() => {
            setShowOnlineIndicator(false);
          }, 3000);
        }
      };
      
      syncData();
    }

    return () => clearTimeout(timer);
  }, [isOffline, addNotification]);

  if (isOffline) {
    return (
      <View style={[styles.container, { top: insets.top + 5 }]}>
        <Animated.View style={[styles.indicator, { backgroundColor: '#71717a' }]}>
          <Text style={styles.text}>You are currently offline</Text>
        </Animated.View>
      </View>
    );
  }

  if (showOnlineIndicator) {
    return (
      <View style={[styles.container, { top: insets.top + 5 }]}>
        <Animated.View 
          style={[styles.indicator, { 
            backgroundColor: syncComplete ? '#22c55e' : '#3b82f6',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }]}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(1000)}
        >
          {isSyncing && (
            <ActivityIndicator size="small" color="#ffffff" />
          )}
          <Text style={styles.text}>
            {isSyncing ? 'Syncing data...' : 'Internet Connected'}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  indicator: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});