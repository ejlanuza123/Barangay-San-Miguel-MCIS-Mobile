import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ImageBackground, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const OnboardingFlowScreen = ({ navigation }) => {
  const [isGetStartedVisible, setIsGetStartedVisible] = useState(false);

  // Shared values
  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(0); // This will control the 'content' block
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  // Animated style for the LOGO itself
  // This controls its opacity and scale
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
    ],
  }));

  // Animated style for the entire CONTENT BLOCK (logo + text)
  // This moves the whole block up, just like in your GetStartedScreen
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: contentTranslateY.value }
    ],
  }));

  // Animated style for the TEXT (title + subtitle)
  // This fades the text in
  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Animated style for the BUTTON
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // 1. Splash Screen Animation (runs on mount)
  useEffect(() => {
    // Fade in logo
    logoOpacity.value = withTiming(1, { duration: 1500 });
    // Scale logo from 0.9 to 1 (its 180px base size)
    logoScale.value = withTiming(1, { duration: 1500 });

    // Wait 2.5 seconds, then trigger the next animation
    const timer = setTimeout(() => {
      setIsGetStartedVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale]);

  // 2. "Get Started" Transition (runs when isGetStartedVisible becomes true)
  useEffect(() => {
    if (isGetStartedVisible) {
      const transitionDuration = 800;
      const easing = Easing.inOut(Easing.ease);

      // Animate content block UP (matches GetStartedScreen)
      contentTranslateY.value = withTiming(-120, { duration: transitionDuration, easing });
      
      // Animate logo scale DOWN (from 180px to 150px)
      // 150 (target size) / 180 (base size) = 0.833
      logoScale.value = withTiming(150 / 180, { duration: transitionDuration, easing });
      
      // Fade in the text
      textOpacity.value = withTiming(1, { duration: transitionDuration, easing });

      // Fade in the button (matches GetStartedScreen)
      buttonOpacity.value = withTiming(1, { duration: 800, delay: 500 });
    }
  }, [isGetStartedVisible, contentTranslateY, logoScale, textOpacity, buttonOpacity]);

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* This is the block that moves up, matching GetStartedScreen.js layout.
        It contains the logo and the text.
      */}
      <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
        
        {/* The logo animates its opacity and scale */}
        <Animated.View style={logoAnimatedStyle}>
          <Image source={require('../assets/logo.jpg')} style={styles.logo} />
        </Animated.View>

        {/* The text fades in, but is already part of the layout flow */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.title}>Barangay San Miguel</Text>
          <Text style={styles.subtitle}>Health Center</Text>
        </Animated.View>
      </Animated.View>

      {/* Button Container - animates in separately */}
      <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2dd4bf', // Fallback color
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  // We use the 180px logo from SplashScreen as the base size
  logo: {
    width: 180, 
    height: 180, 
    borderRadius: 90, 
  },
  // This container for the text ensures the margin is correct
  textContainer: {
    alignItems: 'center',
    marginTop: 20, // This was the marginBottom on the GetStartedScreen logo
  },
  // These styles are identical to GetStartedScreen.js
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'yellow',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'yellow',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  // This style is identical to GetStartedScreen.js
  buttonContainer: {
    position: 'absolute',
    bottom: '20%',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingFlowScreen;

