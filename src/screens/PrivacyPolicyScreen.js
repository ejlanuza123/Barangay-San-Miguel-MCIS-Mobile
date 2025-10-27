// src/screens/PrivacyPolicyScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

// Shield Icon for Privacy
const ShieldIcon = ({ color = "#fff" }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
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

// Section Component with enhanced styling
const Section = ({ title, children, index, colors }) => (
  <View style={[styles.sectionContainer, styles.sectionElevation]}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionNumber, { backgroundColor: colors.primary }]}>
        <Text style={styles.sectionNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
    <Text style={styles.paragraph}>{children}</Text>
  </View>
);

export default function PrivacyPolicyScreen({ navigation }) {
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
            <View style={styles.headerTitleContainer}>
              <ShieldIcon color="#fff" />
              <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated Badge */}
        <View style={styles.dateContainer}>
          <Text style={styles.date}>Last Updated: October 3, 2025</Text>
        </View>

        {/* Introduction Card */}
        <View style={[styles.introCard, styles.cardElevation, { borderLeftColor: colors.primary }]}>
          <Text style={styles.introText}>
            Your privacy and data security are our top priority. This policy outlines how we protect and handle your personal information in accordance with Republic Act No. 10173 or the Data Privacy Act of 2012.
          </Text>
        </View>

        <Section title="Policy Statement" index={0} colors={colors}>
          This Data Privacy Policy outlines how the Barangay San Miguel Maternal and Childcare Inventory System ("the System") collects, uses, stores, shares, and protects your personal data, in accordance with Republic Act No. 10173 or the Data Privacy Act of 2012 of the Philippines.
        </Section>

        <Section title="Collection of Personal Data" index={1} colors={colors}>
          The System collects personal data necessary for the delivery of healthcare services, including but not limited to: Full name, age, sex, birthdate, address, and contact details; Medical histories, prenatal and postnatal records, immunization status, and other relevant health information; Guardian or parent information necessary for child health management.
        </Section>

        <Section title="Use and Processing of Personal Data" index={2} colors={colors}>
          All collected data is used solely for: Registration and management of maternal and child healthcare records; Scheduling and notification of appointments, vaccinations, and healthcare activities; Inventory management of medicines and supplies; Analytics and reporting to support barangay health planning.
        </Section>

        <Section title="Storage and Protection of Personal Data" index={3} colors={colors}>
          Personal data is stored securely in the System and protected with appropriate organizational, physical, and technical measures; Access is restricted to authorized personnel such as Barangay Health Workers (BHWs), Barangay Nutrition Scholars (BNS), and barangay officials.
        </Section>

        <Section title="Data Sharing and Disclosure" index={4} colors={colors}>
          Personal data will not be shared with third parties outside Barangay San Miguel's health administration unless required by law or with explicit consent from the individual; Data may be shared among authorized healthcare personnel exclusively for legitimate healthcare purposes.
        </Section>

        <Section title="Retention and Disposal" index={5} colors={colors}>
          Personal and health-related information will be retained only as long as necessary for the purposes stated or as required by applicable laws; Secure disposal or anonymization will be carried out after the retention period.
        </Section>

        <Section title="Rights of Data Subjects" index={6} colors={colors}>
          Under the Data Privacy Act, you have the right to: Be informed about the collection and processing of your personal data; Access your personal and health records; Request corrections to your information; Request removal or blocking of inaccurate data; Withdraw consent for processing.
        </Section>

        <Section title="Consent" index={7} colors={colors}>
          By providing your information or by availing of barangay healthcare services, you consent to the collection, use, processing, and storage of your data as described in this Policy in accordance with RA 10173.
        </Section>

        <Section title="Changes to the Policy" index={8} colors={colors}>
          This Policy may be updated from time to time to comply with amendments in the law or to improve system practices. Significant changes will be posted and communicated through official barangay channels.
        </Section>

        <Section title="Inquiries and Complaints" index={9} colors={colors}>
          For questions, concerns, or complaints regarding your data privacy, you may contact the Data Protection Officer or the Barangay San Miguel Health Office.
        </Section>

        {/* Footer Note */}
        <View style={styles.footerCard}>
          <View style={[styles.footerIcon, { backgroundColor: colors.light }]}>
            <ShieldIcon color={colors.primary} />
          </View>
          <Text style={styles.footerTitle}>Your Data is Protected</Text>
          <Text style={styles.footerText}>
            We implement industry-standard security measures to ensure your personal and health information remains confidential and secure at all times.
          </Text>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  dateContainer: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: '600',
    textAlign: "center",
  },
  introCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    borderLeftWidth: 4,
  },
  cardElevation: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 20,
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
    shadowOpacity: 0.06,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  sectionNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  footerCard: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: 'center',
    lineHeight: 20,
  },
});