// src/screens/HelpScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const ChevronDownIcon = ({ color = "#6b7280" }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
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

// --- FAQ Data ---
const faqData = [
  {
    question: "How do I add a new child record?",
    answer:
      "Go to the 'Patient' tab and tap the '+' icon. Fill in the required details for the child and their guardian, then tap 'Save'.",
  },
  {
    question: "How do I schedule an appointment?",
    answer:
      "Navigate to the 'Appointment' tab. You can view existing appointments or tap the 'Schedule' button to create a new one. Select a patient, date, and time.",
  },
  {
    question: "How do I manage my inventory?",
    answer:
      "The 'Inventory' tab shows all available supplies. You can tap on an item to view its details, update the stock count, or mark it as 'low stock'.",
  },
  {
    question: "How can I view reports?",
    answer:
      "The 'Reports' tab allows you to generate and view summaries of appointments, patient demographics, and inventory usage for specific date ranges.",
  },
  {
    question: "How do I update my profile?",
    answer:
      "From the 'Settings' screen, tap on 'Profile'. You can then tap the 'Edit' button to update your name, contact information, or profile picture.",
  },
];

// --- Accordion Item Component ---
const FaqItem = ({ question, answer, colors }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestionContainer} onPress={toggleOpen}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <View style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color={colors.primary} />
        </View>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

// --- Main Screen Component ---
export default function HelpScreen() {
  const navigation = useNavigation();
  const { profile, user } = useAuth();
  const colors = getRoleColors(profile?.role || "BHW");

  // Contact Support Function
  const handleContactSupport = async () => {
    try {
      const supportEmail = 'support@sanmiguelmcis.com'; // Replace with your support email
      const subject = `Support Request - ${profile?.role || 'User'}`;
      const body = `
Hello Support Team,

I need assistance with the San Miguel MCIS Mobile App.

User Details:
- Name: ${profile?.full_name || 'Not provided'}
- Role: ${profile?.role || 'Not provided'}
- Email: ${user?.email || 'Not provided'}

Issue Description:
[Please describe your issue here]

Thank you for your assistance.

Best regards,
${profile?.full_name || 'User'}
      `.trim();

      const emailUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          'Email Not Available',
          'Please set up an email client on your device to contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not open email client. Please email us directly at support@sanmiguelmcis.com',
        [{ text: 'OK' }]
      );
    }
  };

  // Chat Assistant Function
  const handleChatAssistant = () => {
    // Make sure you have added the ChatAssistant screen to your navigation
    navigation.navigate('ChatAssistant');
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={colors.headerGradient}
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
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Frequently Asked Questions</Text>
        {faqData.map((item, index) => (
          <FaqItem
            key={index}
            question={item.question}
            answer={item.answer}
            colors={colors}
          />
        ))}

        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            If you can't find the answer you're looking for, try our AI assistant or contact support.
          </Text>
          
          <TouchableOpacity 
            style={[styles.chatButton, { backgroundColor: colors.primary }]}
            onPress={handleChatAssistant}
          >
            <Text style={styles.chatButtonText}>💬 Chat with Assistant</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.contactButton, { borderColor: colors.primary }]}
            onPress={handleContactSupport}
          >
            <Text style={[styles.contactButtonText, { color: colors.primary }]}>
              Contact Human Support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: "hidden",
  },
  faqQuestionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginRight: 10,
  },
  faqAnswerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  faqAnswer: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  contactContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 10,
  },
  contactText: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  chatButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});