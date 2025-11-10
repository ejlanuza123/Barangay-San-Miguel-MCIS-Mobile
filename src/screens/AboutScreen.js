// src/screens/AboutScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from "../context/AuthContext";

// --- ICON for Back Button ---
const BackArrowIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const Section = ({ title, children, index, colors }) => (
  <View style={[styles.sectionContainer, styles.sectionElevation]}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionNumber, { backgroundColor: colors.primary }]}>
        <Text style={styles.sectionNumberText}>0{index + 1}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.paragraph}>{children}</Text>
  </View>
);

const getRoleColors = (role) => {
  if (role === "BNS") {
    return {
      primary: "#6ee7b7",
      dark: "#34d399",
      light: "#a7f3d0",
      headerGradient: ["#6ee7b7", "#34d399"],
      iconFill: "#34d399",
      iconBg: "#ecfdf5",
    };
  }
  if (role === "USER/MOTHER/GUARDIAN") {
    return {
      primary: "#f9a8d4",
      dark: "#f472b6",
      light: "#fce7f3",
      headerGradient: ["#f9a8d4", "#f472b6"],
      iconFill: "#f472b6",
      iconBg: "#fdf2f8",
    };
  }
  return {
    primary: "#93c5fd",
    dark: "#60a5fa",
    light: "#dbeafe",
    headerGradient: ["#93c5fd", "#60a5fa"],
    iconFill: "#60a5fa",
    iconBg: "#f0f9ff",
  };
};

export default function AboutScreen({ navigation }) {
  const { profile } = useAuth();
  const colors = getRoleColors(profile?.role || "BHW");

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.headerGradient}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About Us</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.appInfoContainer, styles.appInfoElevation]}>
          <LinearGradient
            colors={colors.headerGradient}
            style={styles.logoContainer}
          >
            <Image 
              source={require("../assets/logo.jpg")} 
              style={styles.logo} 
            />
          </LinearGradient>
          <Text style={styles.appName}>San Miguel MCIS Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.2</Text>
          <View style={styles.divider} />
          <Text style={[styles.appTagline, { color: colors.primary }]}>
            Empowering Community Healthcare Through Technology
          </Text>
        </View>

        <Section title="Who We Are" index={0} colors={colors}>
          The Barangay San Miguel Maternity and Childcare Inventory System is a
          digital platform designed to modernize and streamline maternal and
          child healthcare services at the community level. Developed as both a
          web and Android application, the system integrates patient management,
          inventory tracking, appointment scheduling, automated notifications,
          and data analytics into a unified, secure environment.
        </Section>

        <Section title="Our Mission" index={1} colors={colors}>
          The mission of the Barangay San Miguel Maternity and Childcare
          Inventory System is to enhance the quality, efficiency, and
          accessibility of maternal and child healthcare services in Barangay
          San Miguel by equipping healthcare providers and families with
          innovative digital tools that facilitate accurate data management,
          timely resource allocation, and proactive patient engagement.
        </Section>

        <Section title="Our Vision" index={2} colors={colors}>
          The vision of the Barangay San Miguel Maternity and Childcare
          Inventory System is to become a model of community-driven digital
          healthcare transformation, where every mother and child in Barangay
          San Miguel benefits from seamless, equitable, and secure access to
          essential health services.
        </Section>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.headerGradient[0] }]}>
                <Text style={styles.featureIconText}>📊</Text>
              </View>
              <Text style={styles.featureText}>Data Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.headerGradient[1] }]}>
                <Text style={styles.featureIconText}>🔒</Text>
              </View>
              <Text style={styles.featureText}>Secure & Private</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                <Text style={styles.featureIconText}>📱</Text>
              </View>
              <Text style={styles.featureText}>Mobile First</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.dark }]}>
                <Text style={styles.featureIconText}>⚡</Text>
              </View>
              <Text style={styles.featureText}>Real-time Sync</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 25,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "white",
    letterSpacing: 0.5,
  },
  content: { 
    padding: 20, 
    paddingBottom: 40 
  },
  appInfoContainer: {
    alignItems: "center",
    marginBottom: 30,
    padding: 25,
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: -40,
  },
  appInfoElevation: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: '500',
  },
  appTagline: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: 'italic',
    marginTop: 10,
    fontWeight: '500',
  },
  divider: {
    height: 2,
    backgroundColor: '#f1f5f9',
    width: '40%',
    marginVertical: 15,
    borderRadius: 2,
  },
  sectionContainer: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
  },
  sectionElevation: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4b5563",
  },
  featuresContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 12,
    color: "#4b5563",
    textAlign: 'center',
    fontWeight: '500',
  },
});