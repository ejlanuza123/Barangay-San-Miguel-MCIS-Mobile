// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../services/supabase";
import { View, ActivityIndicator } from "react-native";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // ✅ Helper function: timeout
  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);

  // ✅ Helper wrappers for SecureStore (to avoid 2048-byte limit)
  const secureSave = async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`⚠️ SecureStore too large, fallback to AsyncStorage for ${key}`);
      await AsyncStorage.setItem(key, value);
    }
  };

  const secureGet = async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`⚠️ SecureStore read failed, using AsyncStorage for ${key}`);
      return await AsyncStorage.getItem(key);
    }
  };

  const secureDelete = async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  };

  // ✅ Check onboarding completion
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
        setIsOnboardingComplete(!!hasCompleted);
        console.log("📋 Onboarding status:", !!hasCompleted);
      } catch (error) {
        console.log("Error checking onboarding status:", error);
      }
    };
    checkOnboardingStatus();
  }, []);

  // ✅ Load session on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedSession, netInfo] = await Promise.all([
          secureGet("supabase_session"),
          NetInfo.fetch(),
        ]);

        const isConnected = netInfo.isConnected;
        let activeSession = null;

        if (isConnected) {
          try {
            const { data } = await withTimeout(supabase.auth.getSession(), 3000);
            activeSession = data.session;
          } catch (e) {
            console.log("⚠️ getSession timeout or error:", e.message);
          }
        }

        if (activeSession) {
          // ✅ Save only tokens securely
          const minimalSession = {
            access_token: activeSession.access_token,
            refresh_token: activeSession.refresh_token,
          };

          await secureSave("supabase_session", JSON.stringify(minimalSession));
          await AsyncStorage.setItem("cached_user", JSON.stringify(activeSession.user));
          setUser(activeSession.user);
        } else if (storedSession) {
          // ✅ Restore from saved tokens
          const savedTokens = JSON.parse(storedSession);
          const userData = await AsyncStorage.getItem("cached_user");
          const savedUser = userData ? JSON.parse(userData) : null;

          setUser(savedUser);

          if (isConnected && savedTokens) {
            supabase.auth
              .setSession({
                access_token: savedTokens.access_token,
                refresh_token: savedTokens.refresh_token,
              })
              .catch((err) => console.log("⚠️ Background session restore failed:", err.message));
          } else {
            console.log("📴 Offline mode: using cached session.");
          }
        } else {
          console.log("🚫 No session found, user logged out.");
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // ✅ Listen for Supabase auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const minimalSession = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          };
          await secureSave("supabase_session", JSON.stringify(minimalSession));
          await AsyncStorage.setItem("cached_user", JSON.stringify(session.user));
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          await secureDelete("supabase_session");
          await AsyncStorage.removeItem("cached_user");
          await secureDelete("cached_profile");
          setUser(null);
          setProfile(null);
          console.log("✅ Signed out, onboarding preserved");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Fetch or restore user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const net = await NetInfo.fetch();
        const isConnected = net.isConnected;

        if (isConnected) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.log("⚠️ Profile fetch error:", error.message);
            const cached = await secureGet("cached_profile");
            if (cached) setProfile(JSON.parse(cached));
          } else {
            setProfile(data);
            await secureSave("cached_profile", JSON.stringify(data));
          }
        } else {
          const cached = await secureGet("cached_profile");
          if (cached) {
            console.log("📴 Loaded cached profile.");
            setProfile(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      }
    };

    fetchProfile();
  }, [user]);

  // ✅ Sign out handler
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
      if (hasCompleted) setIsOnboardingComplete(true);
    } catch (e) {
      console.log("⚠️ Supabase sign-out error:", e.message);
    } finally {
      await secureDelete("supabase_session");
      await AsyncStorage.removeItem("cached_user");
      await secureDelete("cached_profile");
      setUser(null);
      setProfile(null);
    }
  };

  // ✅ Show loading screen
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        setProfile,
        loading,
        signOut,
        isOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
