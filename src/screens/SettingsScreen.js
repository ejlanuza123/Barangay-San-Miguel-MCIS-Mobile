// src/screens/SettingsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  ScrollView,
  ActivityIndicator,Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { getDatabase } from "../services/database";

// --- START: NEW COLOR LOGIC ---
const getRoleColors = (role) => {
  if (role === "BNS") {
    return {
      primary: "#6ee7b7", // Very Light Emerald Green
      dark: "#34d399", // Very Light Dark Emerald
      light: "#a7f3d0", // Very Light Emerald
      headerGradient: ["#6ee7b7", "#34d399"],
      iconFill: "#34d399",
      iconBg: "#ecfdf5",
      // Keep Logout as standard red for danger
      logoutGradient: ["#fca5a5", "#ef4444"],
      logoutShadow: "#fca5a5",
    };
  }
  if (role === "USER/MOTHER/GUARDIAN") {
    return {
      primary: "#f9a8d4", // Very Light Rose Pink
      dark: "#f472b6", // Very Light Dark Rose
      light: "#fce7f3", // Very Light Pink
      headerGradient: ["#f9a8d4", "#f472b6"],
      iconFill: "#f472b6",
      iconBg: "#fdf2f8",
      logoutGradient: ["#f9a8d4", "#f472b6"], // Light Rose Gradient for Logout
      logoutShadow: "#f9a8d4",
    };
  }
  // Default BHW (Very Light Blue)
  return {
    primary: "#93c5fd", // Very Light Blue
    dark: "#60a5fa", // Very Light Dark Blue
    light: "#dbeafe", // Very Light Blue
    headerGradient: ["#93c5fd", "#60a5fa"],
    iconFill: "#60a5fa",
    iconBg: "#f0f9ff",
    logoutGradient: ["#fca5a5", "#ef4444"],
    logoutShadow: "#fca5a5",
  };
};

// --- ICONS ---
const BackArrowIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const ProfileIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </Svg>
);
const BellIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </Svg>
);
const HelpIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
  </Svg>
);
// (PrivacyIcon, AboutIcon, LanguageIcon updated similarly)
const PrivacyIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </Svg>
);
const AboutIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </Svg>
);
const ResetIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </Svg>
);
const ArrowRightIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const handleResetLocalDB = async () => {
  Alert.alert(
    "🔄 Reset & Resync Database",
    "This will:\n\n• Clear all local offline data\n• Download fresh data from server\n• Recreate your local database\n\nThis ensures you have the latest data from the cloud.",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Reset & Resync",
        style: "destructive",
        onPress: async () => {
          try {
            // Show progress alert
            Alert.alert(
              "🔄 Starting Reset...",
              "Step 1: Clearing local data...",
              [],
              { cancelable: false }
            );

            const db = getDatabase();
            
            // Step 1: Clear all local tables
            await db.execAsync(`
              DELETE FROM patients;
              DELETE FROM appointments;
              DELETE FROM child_records;
              DELETE FROM sync_queue;
              DELETE FROM sync_notifications;
            `);

            // Step 2: Show downloading progress
            setTimeout(() => {
              Alert.alert(
                "📥 Downloading Data...",
                "Step 2: Fetching latest data from server...",
                [],
                { cancelable: false }
              );
            }, 1000);

            // Step 3: Fetch data from Supabase with proper error handling
            try {
              let successCount = 0;
              let errorCount = 0;

              // Fetch patients from Supabase
              const { data: patients, error: patientsError } = await supabase
                .from('patients')
                .select('*');

              if (!patientsError && patients && patients.length > 0) {
                for (const patient of patients) {
                  try {
                    await db.runAsync(
                      `INSERT INTO patients (id, patient_id, first_name, middle_name, last_name, age, risk_level, contact_no, purok, street, medical_history, is_synced) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        patient.id?.toString() || '',
                        patient.patient_id?.toString() || '',
                        patient.first_name?.toString() || '',
                        patient.middle_name?.toString() || '',
                        patient.last_name?.toString() || '',
                        parseInt(patient.age) || 0,
                        patient.risk_level?.toString() || 'NORMAL',
                        patient.contact_no?.toString() || '',
                        patient.purok?.toString() || '',
                        patient.street?.toString() || '',
                        patient.medical_history?.toString() || '',
                        1 // Mark as synced
                      ]
                    );
                    successCount++;
                  } catch (patientError) {
                    console.error("Error inserting patient:", patientError);
                    errorCount++;
                  }
                }
              }

              // Fetch appointments from Supabase
              const { data: appointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select('*');

              if (!appointmentsError && appointments && appointments.length > 0) {
                for (const appointment of appointments) {
                  try {
                    await db.runAsync(
                      `INSERT INTO appointments (id, patient_display_id, patient_name, reason, date, time, status, notes, created_by, created_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        appointment.id?.toString() || '',
                        appointment.patient_display_id?.toString() || '',
                        appointment.patient_name?.toString() || '',
                        appointment.reason?.toString() || '',
                        appointment.date?.toString() || '',
                        appointment.time?.toString() || '',
                        appointment.status?.toString() || '',
                        appointment.notes?.toString() || '',
                        appointment.created_by?.toString() || '',
                        appointment.created_at?.toString() || new Date().toISOString()
                      ]
                    );
                    successCount++;
                  } catch (appointmentError) {
                    console.error("Error inserting appointment:", appointmentError);
                    errorCount++;
                  }
                }
              }

              // Fetch child records from Supabase
              const { data: childRecords, error: childRecordsError } = await supabase
                .from('child_records')
                .select('*');

              if (!childRecordsError && childRecords && childRecords.length > 0) {
                for (const child of childRecords) {
                  try {
                    // Helper function to safely convert to number or null
                    const safeNumber = (val) => {
                      if (val === null || val === undefined) return null;
                      const num = parseFloat(val);
                      return isNaN(num) ? null : num;
                    };

                    await db.runAsync(
                      `INSERT INTO child_records (id, child_id, first_name, last_name, dob, sex, place_of_birth, mother_name, father_name, guardian_name, nhts_no, philhealth_no, weight_kg, height_cm, bmi, nutrition_status, last_checkup, health_details, created_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        child.id?.toString() || '',
                        child.child_id?.toString() || '',
                        child.first_name?.toString() || '',
                        child.last_name?.toString() || '',
                        child.dob?.toString() || '',
                        child.sex?.toString() || '',
                        child.place_of_birth?.toString() || '',
                        child.mother_name?.toString() || '',
                        child.father_name?.toString() || '',
                        child.guardian_name?.toString() || '',
                        child.nhts_no?.toString() || '',
                        child.philhealth_no?.toString() || '',
                        safeNumber(child.weight_kg),
                        safeNumber(child.height_cm),
                        safeNumber(child.bmi),
                        child.nutrition_status?.toString() || '',
                        child.last_checkup?.toString() || '',
                        child.health_details?.toString() || '',
                        child.created_at?.toString() || new Date().toISOString()
                      ]
                    );
                    successCount++;
                  } catch (childError) {
                    console.error("Error inserting child record:", childError);
                    errorCount++;
                  }
                }
              }

              // Add success notification
              await db.runAsync(
                `INSERT INTO sync_notifications (message, type, created_at) VALUES (?, ?, datetime('now'))`,
                [`Database reset completed. ${successCount} records loaded, ${errorCount} errors.`, "success"]
              );

              // Show completion message
              Alert.alert(
                "✅ Reset Complete!",
                `Local database has been refreshed:\n\n• ${successCount} records loaded successfully\n• ${errorCount} errors encountered\n\nYour data is now up to date.`,
                [
                  {
                    text: "Awesome!",
                    onPress: () => {
                      // Optional: Refresh the app state
                      // navigation.navigate("Home");
                    }
                  }
                ]
              );

            } catch (syncError) {
              console.error("❌ Sync error:", syncError);
              showSyncError(syncError);
            }

          } catch (error) {
            console.error("❌ Reset error:", error);
            showResetError(error);
          }
        }
      }
    ]
  );

  const showSyncError = (error) => {
    Alert.alert(
      "⚠️ Sync Incomplete",
      "Data was cleared locally but we encountered issues downloading data.\n\nYou can continue working offline - new data will be saved locally.",
      [
        {
          text: "Try Again",
          style: "destructive",
          onPress: handleResetLocalDB
        },
        {
          text: "Continue Offline",
          style: "default"
        }
      ]
    );
  };

  const showResetError = (error) => {
    Alert.alert(
      "🚫 Reset Failed",
      "We couldn't complete the reset process.\n\nPlease try again or contact support if the issue continues.",
      [
        {
          text: "Retry",
          style: "destructive",
          onPress: handleResetLocalDB
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
};

const SettingsItem = ({ icon, label, onPress, colors }) => (
  // We use the optional chaining operator (?) here to ensure it doesn't crash
  // if 'colors' is undefined (though it shouldn't be).
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View style={[styles.itemIcon, { backgroundColor: colors?.iconBg }]}>
      {React.cloneElement(icon, { color: colors?.iconFill })}
    </View>
    <Text style={styles.itemLabel}>{label}</Text>
    <ArrowRightIcon />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const navigation = useNavigation();
  const colors = getRoleColors(profile?.role || "BHW");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.preferences?.in_app_notifications ?? true
  );

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    const { data, error } = await supabase
      .from("profiles")
      .update({
        preferences: { ...profile.preferences, in_app_notifications: value },
      })
      .eq("id", profile.id)
      .select()
      .single();
    if (!error) setProfile(data);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={colors.headerGradient} // Dynamic Header Gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSummary}>
          <Image
            source={{
              uri:
                profile?.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  profile?.first_name || "U"
                }`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.profileName}>{`${profile?.first_name || ""} ${
            profile?.last_name || ""
          }`}</Text>
        </View>

        <SettingsItem
          icon={<ProfileIcon />}
          label="Profile"
          onPress={() => navigation.navigate("ProfileView")}
          colors={colors}
        />

        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.item}>
          <View style={styles.itemIcon}>
            <BellIcon />
          </View>
          <Text style={styles.itemLabel}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={notificationsEnabled ? "#3b82f6" : "#f4f3f4"}
          />
        </View>

        <SettingsItem
        icon={<HelpIcon />}
        label="Help"
        onPress={() => navigation.navigate("Help")} 
        colors={colors} 
        />
        <SettingsItem
          icon={<PrivacyIcon />}
          label="Privacy Policy"
          onPress={() => navigation.navigate("PrivacyPolicy")}
          colors={colors}
        />
        <SettingsItem
          icon={<AboutIcon />}
          label="About"
          onPress={() => navigation.navigate("About")}
          colors={colors}
        />
        <SettingsItem
          icon={<ResetIcon />}
          label="Reset Local Database"
          onPress={handleResetLocalDB}
          colors={colors}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // CONTENT
  scrollContent: { padding: 20 },
  profileSummary: { alignItems: "center", marginBottom: 25 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#e5e7eb",
    elevation: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 12,
  },

  // SECTION
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    marginTop: 30,
    marginBottom: 10,
    paddingLeft: 2,
  },

  // ITEMS
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    // backgroundColor: "#eff6ff", // Removed static background
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemLabel: { flex: 1, fontSize: 16, fontWeight: "500", color: "#111827" },

  // FOOTER
  footer: {
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  logoutButton: {
    backgroundColor: '#fee2e2', // Light, soft red background
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5', // A slightly darker red for the border
  },
  logoutButtonText: {
    color: '#b91c1c', // Dark, strong red for the text
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
