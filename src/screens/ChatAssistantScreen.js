// src/screens/ChatAssistantScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

// Import your logo
const BarangayLogo = require('../assets/logo.jpg');

// Icons
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

const SendIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6">
    <Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </Svg>
);

// Predefined responses based on common questions
const RESPONSES = {
  greetings: [
    "Hello! I'm your San Miguel MCIS assistant. How can I help you today?",
    "Hi there! I'm here to help with any questions about the app.",
    "Welcome! How can I assist you with San Miguel MCIS today?"
  ],
  inventory: [
    "To manage inventory, go to the Inventory tab. You can add items by tapping the '+' button, view stock levels, and update quantities.",
    "Inventory management is in the Inventory section. You can track medicines, equipment, and supplies there.",
    "For inventory: Add items, check stock, and set low-stock alerts in the Inventory tab."
  ],
  appointments: [
    "You can schedule appointments in the Appointment tab. Tap 'Schedule' to create new appointments for patients.",
    "Appointments are managed in the Appointment section. View existing appointments or create new ones there.",
    "To book appointments: Go to Appointments → Schedule → Select patient and date/time."
  ],
  patients: [
    "Patient records are in the Patient tab. Add new patients or view existing records with their health information.",
    "Manage all patient information in the Patient section. You can add children and guardians there.",
    "For patients: Add new records, view history, and track checkups in the Patient tab."
  ],
  reports: [
    "Reports and analytics are available in the Reports tab. Generate summaries for appointments, inventory, and patient data.",
    "You can create various reports in the Reports section. Filter by date range and export data.",
    "Reports include: Appointment summaries, inventory usage, and patient demographics in the Reports tab."
  ],
  default: [
    "I'm not sure I understand. Could you please rephrase your question?",
    "I'm still learning! Try asking about inventory, appointments, patients, or reports.",
    "I don't have an answer for that yet. Please contact support for more specific help."
  ]
};

// Simple AI response generator
const generateResponse = (userMessage) => {
  const message = userMessage.toLowerCase().trim();
  
  // Greetings
  if (message.match(/\b(hello|hi|hey|good morning|good afternoon)\b/)) {
    return RESPONSES.greetings[Math.floor(Math.random() * RESPONSES.greetings.length)];
  }
  
  // Inventory related
  if (message.match(/\b(inventory|stock|medicine|supply|equipment)\b/)) {
    return RESPONSES.inventory[Math.floor(Math.random() * RESPONSES.inventory.length)];
  }
  
  // Appointment related
  if (message.match(/\b(appointment|schedule|booking|meeting)\b/)) {
    return RESPONSES.appointments[Math.floor(Math.random() * RESPONSES.appointments.length)];
  }
  
  // Patient related
  if (message.match(/\b(patient|child|baby|mother|guardian|record)\b/)) {
    return RESPONSES.patients[Math.floor(Math.random() * RESPONSES.patients.length)];
  }
  
  // Report related
  if (message.match(/\b(report|analytics|data|summary|statistics)\b/)) {
    return RESPONSES.reports[Math.floor(Math.random() * RESPONSES.reports.length)];
  }
  
  // Help
  if (message.match(/\b(help|support|problem|issue|error)\b/)) {
    return "I can help you navigate the app! Try asking about specific features like inventory management, appointment scheduling, patient records, or report generation.";
  }
  
  return RESPONSES.default[Math.floor(Math.random() * RESPONSES.default.length)];
};

// Updated MessageBubble component with profile images
const MessageBubble = ({ message, isUser, profile }) => (
  <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
    {!isUser && (
      <View style={styles.botIconContainer}>
        <Image 
          source={BarangayLogo} 
          style={styles.botAvatar}
          resizeMode="cover"
        />
      </View>
    )}
    
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
        {message}
      </Text>
      <Text style={styles.timestamp}>
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
    
    {isUser && (
      <View style={styles.userIconContainer}>
        <Image
          source={{
            uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.first_name || "U"}`,
          }}
          style={styles.userAvatar}
        />
      </View>
    )}
  </View>
);

const SuggestedQuestion = ({ question, onPress }) => (
  <TouchableOpacity style={styles.suggestionChip} onPress={onPress}>
    <Text style={styles.suggestionText}>{question}</Text>
  </TouchableOpacity>
);

const SUGGESTED_QUESTIONS = [
  "How do I add inventory items?",
  "How to schedule an appointment?",
  "Where can I find patient records?",
  "How to generate reports?",
  "What can you help me with?"
];

export default function ChatAssistantScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your San Miguel MCIS assistant. I can help you with inventory, appointments, patients, and reports. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI thinking delay
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(inputText),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickSuggestion = (question) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(question),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image 
            source={BarangayLogo} 
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <Text style={styles.headerTitle}>MCIS Assistant</Text>
        </View>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item.text} 
              isUser={item.isUser} 
              profile={profile}
            />
          )}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick Questions</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <SuggestedQuestion
                  key={index}
                  question={question}
                  onPress={() => handleQuickSuggestion(question)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question here..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <SendIcon />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  suggestionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  suggestionsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendButton: {
    backgroundColor: '#f3f4f6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});