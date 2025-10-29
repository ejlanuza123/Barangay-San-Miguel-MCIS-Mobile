// src/context/NotificationContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import Notification from '../components/layout/Notification';
import { useSound } from '../hooks/useSound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSoundSettings } from '../context/SoundSettingsContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);


export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toastNotifications, setToastNotifications] = useState([]);
    const { soundEnabled } = useSoundSettings();
    const playSoundFromHook = useSound(); // This should be the playSound function

    const playNotificationSound = useCallback(async (type = 'info') => {
        try {
            console.log('🎯 playNotificationSound called');
            console.log('🔊 Current sound setting:', soundEnabled ? 'ON' : 'OFF');
            
            if (!soundEnabled) {
                console.log('🔇 Sound disabled - skipping playback');
                return;
            }

            console.log(`🔊 Sound enabled - attempting to play: ${type}`);
            
            if (typeof playSoundFromHook === 'function') {
                console.log('🎵 Calling playSoundFromHook...');
                await playSoundFromHook(type);
                console.log('✅ playSoundFromHook completed');
            } else {
                console.warn('❌ playSoundFromHook is not a function');
            }
            
        } catch (error) {
            console.log('⚠️ Sound error (handled):', error.message);
        }
    }, [playSoundFromHook, soundEnabled]);

    // ADD THIS FUNCTION
    const getSoundTypeForNotification = (notificationType, notificationData) => {
        if (notificationType === 'success') return 'success';
        if (notificationType === 'error') return 'error';
        if (notificationType === 'warning') return 'warning';
        
        if (notificationData?.type) {
            const type = notificationData.type.toLowerCase();
            
            if (type.includes('error') || type.includes('critical') || type.includes('alert')) {
                return 'alert';
            }
            if (type.includes('success') || type.includes('completed')) {
                return 'success';
            }
            if (type.includes('warning') || type.includes('due_soon')) {
                return 'warning';
            }
            if (type.includes('inventory') || type.includes('low_stock')) {
                return 'alert';
            }
        }
        
        return 'info';
    };


    // --- LOGIC FOR THE NOTIFICATION BELL ---
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            // ADD THIS: Check for new notifications and play sounds
            if (notifications.length > 0) {
                const previousNotificationIds = new Set(notifications.map(n => n.id));
                const newNotifications = data.filter(n => !previousNotificationIds.has(n.id));
                
                newNotifications.forEach(notification => {
                    const soundType = getSoundTypeForNotification(null, notification);
                    playNotificationSound(soundType);
                });
            }

            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    }, [user, playNotificationSound]);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${user?.id}` 
            }, (payload) => {
                // ADD THIS: Play sound for new real-time notifications
                const soundType = getSoundTypeForNotification(null, payload.new);
                playNotificationSound(soundType);
                fetchNotifications();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
                () => fetchNotifications()
            ).subscribe();

        return () => supabase.removeChannel(channel);
    }, [user, playNotificationSound]);
    
    // ADD THIS FUNCTION - Mark a single notification as read
    const markAsRead = async (notification) => {
        if (!user) return;
        
        console.log('Marking notification as read:', notification.id);
        
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notification.id)
            .eq('user_id', user.id);

        if (!error) {
            // Update local state immediately
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notification.id 
                        ? { ...n, is_read: true }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllRead = async () => {
        if (!user || unreadCount === 0) return;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
            
        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const deleteAll = async () => {
        if (!user) return;
        const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
        if (!error) {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const deleteOne = async (id) => {
        await supabase.from('notifications').delete().eq('id', id);
        // Re-fetching is okay here since it's a single, less frequent action
        fetchNotifications(); 
    };

    // --- LOGIC FOR POP-UP TOASTS ---
     const addNotification = useCallback((message, type = 'success', playSound = true) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToastNotifications(prev => [...prev, { id, message, type }]);
        
        // ADD THIS: Play sound for toast notifications
        if (playSound) {
            const soundType = getSoundTypeForNotification(type);
            playNotificationSound(soundType);
        }
    }, [playNotificationSound]);

    const playSpecificSound = useCallback((soundType = 'info') => {
        playNotificationSound(soundType);
    }, [playNotificationSound]);

    const removeToast = useCallback((id) => {
        setToastNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const value = {
        notifications,
        unreadCount,
        markAsRead, // ADD THIS - for single notification read
        markAllRead,
        deleteAll,
        deleteOne,
        addNotification, // This is for the pop-up toasts
        refetch: fetchNotifications, // Allow components to trigger a manual refresh
        playNotificationSound: playSpecificSound,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <View style={styles.toastContainer}>
                {toastNotifications.map(n => (
                    <Notification key={n.id} notification={n} onClear={removeToast} />
                ))}
            </View>
        </NotificationContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 95,
        right: 10,
        left: 10,
        zIndex: 1000,
        alignItems: 'center',
    }
});