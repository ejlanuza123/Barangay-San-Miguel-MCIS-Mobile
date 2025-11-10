// src/components/layout/FloatingChatIcon.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text, Animated, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
// 1. Import useAuth to get the user's role
import { useAuth } from '../../context/AuthContext';

// 2. Define the color helper (same as in your other files)
const getRoleColors = (role) => {
  if (role === "BNS") {
    return {
      primary: "#6ee7b7",
      dark: "#34d399",
      light: "#a7f3d0",
      badge: "#ef4444" // Red is still good for alerts
    };
  }
  if (role === "USER/MOTHER/GUARDIAN") {
    return {
      primary: "#f9a8d4",
      dark: "#f472b6",
      light: "#fce7f3",
      badge: "#be185d" // A darker pink/magenta for contrast on pink
    };
  }
  // Default BHW
  return {
    primary: "#93c5fd",
    dark: "#3b82f6", // Standard blue for BHW
    light: "#dbeafe",
    badge: "#ef4444"
  };
};

// 3. Update the Icon to accept a color prop
const ChatIcon = ({ color }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
      fill={color} // Use the passed color here
    />
    <Path
      d="M7 9H17M7 13H14"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const FloatingChatIcon = () => {
  const navigation = useNavigation();
  // 4. Get the profile to determine the role
  const { profile } = useAuth();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // 5. Get the colors for the current role
  const roleColors = getRoleColors(profile?.role);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    setHasNewMessages(false);
    navigation.navigate('ChatAssistant');
  };

  return (
    <Animated.View style={[styles.floatingButton, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity 
        onPress={handlePress} 
        activeOpacity={0.8}
        style={styles.touchableArea}
      >
        {/* 6. Pass the dynamic dark color to the icon */}
        <ChatIcon color={roleColors.dark} />
        {hasNewMessages && (
          // 7. Use dynamic badge color
          <View style={[styles.badge, { backgroundColor: roleColors.badge }]}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 168,
    right: -5,
    backgroundColor: 'white',
    width: 55,
    height: 42,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 1000,
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 5,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default FloatingChatIcon;