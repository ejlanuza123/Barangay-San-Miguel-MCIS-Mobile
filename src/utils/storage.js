// src/utils/storage.js
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const secureSave = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    console.warn(`SecureStore failed for ${key}, saving in AsyncStorage`);
    await AsyncStorage.setItem(key, value);
  }
};

export const secureGet = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    console.warn(`SecureStore failed for ${key}, using AsyncStorage`);
    return await AsyncStorage.getItem(key);
  }
};
