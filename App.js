import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import React, { useState, useEffect,  useCallback } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationProvider } from "./src/context/NotificationContext"; // <-- 1. IMPORT THE PROVIDER
import { initDatabase } from './src/services/database';
import OfflineIndicator from './src/components/layout/OfflineIndicator';
import { SafeAreaProvider } from "react-native-safe-area-context"; 
import { SoundSettingsProvider } from './src/context/SoundSettingsContext';


// Import all screens and navigators
import OnboardingFlowScreen from "./src/screens/OnboardingFlowScreen"; // <-- IMPORT NEW SCREEN
import TermsAndConditionsScreen from "./src/screens/TermsAndConditionsScreen";
import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["sm.mcis://"],
  config: {
    screens: {
      // This tells the navigator that the path "login"
      // should navigate to the 'Login' screen inside the 'Auth' navigator.
      Auth: {
        screens: {
          Login: "login",
        },
      },
    },
  },
};

// 1. RootNavigator now accepts dbInitialized as a prop
function RootNavigator({ dbInitialized }) {
  const { user, loading, isOnboardingComplete } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // 2. Combine auth loading state and db loading state
  const isAppLoading = loading || !dbInitialized;

  // Handle navigation reset when user logs out
  useEffect(() => {
    // Ensure this only runs when the app is NOT loading and navigation is ready
    if (!isAppLoading && isNavigationReady && !user) {
      navigationRef.reset({
        index: 0,
        routes: [
          { 
            name: isOnboardingComplete ? 'Auth' : 'Onboarding' 
          }
        ],
      });
    }
  }, [user, isAppLoading, isOnboardingComplete, isNavigationReady, navigationRef]);

  // Handle navigation state change to know when navigator is ready
  const onNavigationReady = useCallback(() => {
    setIsNavigationReady(true);
  }, []);

  // 3. If the app is loading (auth or DB), render the OnboardingFlowScreen directly.
  // This screen will just show its animation. Once loading is false,
  // the component will re-render and show the NavigationContainer below.
  if (isAppLoading) {
    // We pass a dummy navigation prop so the component doesn't crash
    // when its useEffect timer tries to call navigation.replace.
    // The "real" navigation will take over once loading is complete.
    return <OnboardingFlowScreen navigation={{ replace: () => {} }} />;
  }

  // 4. Once loading is complete, render the actual navigator
  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={onNavigationReady}
      linking={linking}
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={
          user 
            ? "App" 
            : isOnboardingComplete 
              ? "Auth"
              : "Onboarding" // This will be the first "real" screen
        }
      >
        {user ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingFlowScreen} /> 
            <Stack.Screen name="Terms" component={TermsAndConditionsScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        console.log("Database has been successfully initialized.");
      })
      .catch(error => {
        console.error("Database initialization failed:", error);
        setDbInitialized(true); // Still set to true to proceed
      });
  }, []);

  // 5. REMOVED the `if (!dbInitialized) { return null; }` check.
  // We now render the providers and RootNavigator immediately.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <AuthProvider>
        <SoundSettingsProvider>
          <NotificationProvider>
            {/* 6. Pass dbInitialized state down to RootNavigator */}
            <RootNavigator dbInitialized={dbInitialized} />
            <OfflineIndicator />
          </NotificationProvider>
        </SoundSettingsProvider>  
      </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

