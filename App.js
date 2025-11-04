import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import React, { useState, useEffect,  useCallback } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationProvider } from "./src/context/NotificationContext";
import { initDatabase } from './src/services/database';
import OfflineIndicator from './src/components/layout/OfflineIndicator'; 
import { SafeAreaProvider } from "react-native-safe-area-context"; 
import { SoundSettingsProvider } from './src/context/SoundSettingsContext';
import NotificationPortal from './src/components/layout/NotificationPortal';

// Import all screens and navigators
import OnboardingFlowScreen from "./src/screens/OnboardingFlowScreen";
import TermsAndConditionsScreen from "./src/screens/TermsAndConditionsScreen";
import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["sm.mcis://"],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: "login",
        },
      },
    },
  },
};


function RootNavigator({ dbInitialized }) {
  const { user, loading, isOnboardingComplete } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  

  const [currentRouteName, setCurrentRouteName] = useState(null);

  const isAppLoading = loading || !dbInitialized;

  useEffect(() => {
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

  const onNavigationReady = useCallback(() => {
    setIsNavigationReady(true);

    const initialState = navigationRef.current.getRootState();
    if (initialState) {
        const routeName = initialState.routes[initialState.index].name;
        setCurrentRouteName(routeName);
    }
  }, [navigationRef]);

  const onNavigationStateChange = (state) => {
    if (state) {
        const routeName = state.routes[state.index].name;
        setCurrentRouteName(routeName);
    }
  };


  if (isAppLoading) {
    return <OnboardingFlowScreen navigation={{ replace: () => {} }} />;
  }


  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer 
        ref={navigationRef}
        onReady={onNavigationReady}
        onStateChange={onNavigationStateChange}
        linking={linking}
      >
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={
            user 
              ? "App" 
              : isOnboardingComplete 
                ? "Auth"
                : "Onboarding"
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
      {currentRouteName && currentRouteName !== 'Onboarding' && <OfflineIndicator />}
    </View>
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
        setDbInitialized(true); 
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <AuthProvider>
        <SoundSettingsProvider>
          <NotificationProvider>
            <RootNavigator dbInitialized={dbInitialized} />
            <NotificationPortal />
          </NotificationProvider>
        </SoundSettingsProvider>   
      </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}