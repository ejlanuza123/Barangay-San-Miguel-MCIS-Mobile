// src/components/layout/NotificationPortal.js
import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useNotification } from '../../context/NotificationContext';
import Notification from './Notification';

export default function NotificationPortal() {
    const { toastNotifications = [], removeToast } = useNotification();

    if (!Array.isArray(toastNotifications) || toastNotifications.length === 0) {
        return null;
    }

    return (
        <Modal
            transparent={true}
            visible={true} // Always visible when there are notifications
            animationType="none"
            onRequestClose={() => {}}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen" // This is key for Android
        >
            <View style={styles.container} pointerEvents="box-none">
                {toastNotifications.map(n => (
                    <Notification 
                        key={n.id} 
                        notification={n} 
                        onClear={removeToast} 
                    />
                ))}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 100,
        backgroundColor: 'transparent',
        pointerEvents: 'box-none',
    }
});