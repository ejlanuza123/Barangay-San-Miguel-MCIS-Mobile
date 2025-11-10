// src/screens/ChatAssistantScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Alert,
  Animated,
  Easing,
  ScrollView,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { 
  generateResponse, 
  detectTopic, 
  detectLanguage, 
  SUGGESTED_QUESTIONS,
  CHAT_CONFIG,
  getRealTimeAlerts 
} from '../services/ChatService';
import * as Speech from 'expo-speech';

const { width: screenWidth } = Dimensions.get('window');

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

const MicrophoneIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
      fill="#6b7280"
    />
    <Path
      d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
      fill="#6b7280"
    />
  </Svg>
);

const SpeakerIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
      fill="#6b7280"
    />
  </Svg>
);

// Dynamic MessageBubble with role-based colors
const MessageBubble = React.memo(({ 
  message, 
  isUser, 
  profile, 
  timestamp, 
  isTyping, 
  actions, 
  isEmergency,
  roleColors 
}) => {
  const navigation = useNavigation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const dotAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isTyping) {
      const animateDots = () => {
        Animated.sequence([
          Animated.timing(dotAnimation, {
            toValue: 1,
            duration: 400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimation, {
            toValue: 0,
            duration: 400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(animateDots);
      };
      animateDots();
    }
  }, [isTyping, dotAnimation]);

  const dot1Opacity = dotAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const dot2Opacity = dotAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
    extrapolate: 'clamp',
  });

  const dot3Opacity = dotAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
    extrapolate: 'clamp',
  });

  const handleSpeak = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      await Speech.speak(message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      Alert.alert('Speech Error', 'Cannot read the message aloud');
    }
  };

  const handleActionPress = async (action) => {
    if (action.type === 'navigate' && action.screen) {
      try {
        navigation.navigate(action.screen, action.prefill || {});
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Navigation Error', `Cannot navigate to ${action.screen}`);
      }
    } else if (action.type === 'smart_navigate' && action.screen) {
      try {
        navigation.navigate(action.screen, { 
          ...(action.prefill || {}),
          highlighted: action.highlight
        });
      } catch (error) {
        console.error('Smart navigation error:', error);
        Alert.alert('Navigation Error', `Cannot navigate to ${action.screen}`);
      }
    } else if (action.type === 'call' && action.number) {
      try {
        await Linking.openURL(`tel:${action.number}`);
      } catch (error) {
        Alert.alert('Error', 'Cannot make phone call');
      }
    } else if (action.type === 'url' && action.url) {
      try {
        await Linking.openURL(action.url);
      } catch (error) {
        Alert.alert('Error', 'Cannot open URL');
      }
    }
  };

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
      {!isUser && (
        <View style={[styles.botIconContainer, { borderColor: roleColors.primary }]}>
          <Image 
            source={BarangayLogo} 
            style={styles.botAvatar}
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={[
        styles.bubble, 
        isUser ? [styles.userBubble, { backgroundColor: roleColors.primary }] : styles.botBubble,
        isEmergency && styles.emergencyBubble
      ]}>
        {isTyping ? (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Health assistant is typing</Text>
            <View style={styles.typingDots}>
              <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
              <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
              <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.messageRow}>
              <Text style={[
                styles.messageText, 
                isUser ? styles.userText : styles.botText,
                isEmergency && styles.emergencyText
              ]}>
                {message}
              </Text>
              
              {!isUser && !isEmergency && (
                <TouchableOpacity 
                  style={[
                    styles.speechButton,
                    isSpeaking && [styles.speechButtonActive, { backgroundColor: roleColors.accent }]
                  ]}
                  onPress={handleSpeak}
                >
                  <SpeakerIcon />
                </TouchableOpacity>
              )}
            </View>
            
            {actions && actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      action.type === 'call' && styles.emergencyActionButton,
                      { backgroundColor: roleColors.primary }
                    ]}
                    onPress={() => handleActionPress(action)}
                  >
                    <Text style={[
                      styles.actionText,
                      action.type === 'call' && styles.emergencyActionText
                    ]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <Text style={styles.timestamp}>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </>
        )}
      </View>
      
      {isUser && (
        <View style={[styles.userIconContainer, { borderColor: roleColors.accent }]}>
          <Image
            source={{
              uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.first_name || "U"}&background=3b82f6&color=fff`,
            }}
            style={styles.userAvatar}
          />
        </View>
      )}
    </View>
  );
});

const SuggestedQuestion = React.memo(({ question, onPress, roleColors }) => (
  <TouchableOpacity 
    style={[styles.suggestionChip, { backgroundColor: roleColors.light }]} 
    onPress={onPress}
    accessibilityLabel={`Quick question: ${question}`}
    accessibilityRole="button"
  >
    <Text style={[styles.suggestionText, { color: roleColors.dark }]}>{question}</Text>
  </TouchableOpacity>
));

// Language Toggle Component
const LanguageToggle = ({ currentLanguage, onLanguageChange, roleColors }) => {
  const languages = ['english', 'tagalog', 'bisaya'];
  const languageLabels = {
    'english': '🇺🇸 EN',
    'tagalog': '🇵🇭 FIL',
    'bisaya': '🇵🇭 BIS'
  };

  const handlePress = () => {
    const currentIndex = languages.indexOf(currentLanguage);
    const nextLanguage = languages[(currentIndex + 1) % languages.length];
    onLanguageChange(nextLanguage);
  };

  return (
    <TouchableOpacity
      style={[styles.languageToggle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
      onPress={handlePress}
    >
      <Text style={[styles.languageText, { color: 'white' }]}>
        {languageLabels[currentLanguage]}
      </Text>
    </TouchableOpacity>
  );
};

// Alert Banner Component
const AlertBanner = ({ alerts, onAlertPress }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.alertBanner}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.alertScrollContent}
      >
        {alerts.map((alert, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.alertItem,
              alert.priority === 'high' && styles.highPriorityAlert
            ]}
            onPress={() => onAlertPress(alert)}
          >
            <Text style={styles.alertText}>⚠️ {alert.message}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default function ChatAssistantScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [dailyReminders, setDailyReminders] = useState([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [conversationContext, setConversationContext] = useState({
    lastTopic: null,
    userPreferences: {},
    previousQuestions: [],
    currentTime: new Date()
  });
  const flatListRef = useRef(null);

  // Get role-based colors - MEMOIZED to react to profile changes
  const roleColors = React.useMemo(() => {
    const role = profile?.role;
    if (role === 'BNS') return CHAT_CONFIG.roles['BNS'];
    if (role === 'USER/MOTHER/GUARDIAN') return CHAT_CONFIG.roles['USER/MOTHER/GUARDIAN'];
    // Default fallback is BHW (Blue)
    return CHAT_CONFIG.roles['BHW'];
  }, [profile?.role]);

  // Enhanced greeting with dynamic context
  const getEnhancedGreeting = () => {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const timeContext = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    const baseGreeting = {
      english: `${CHAT_CONFIG.contexts[timeContext].greeting} I'm your San Miguel MCIS Health Assistant. I can help you with:\n\n📱 App Features & Navigation\n🤰 Maternal Health Records\n🍼 Child Health Tracking\n💉 Immunization Management\n📊 Reports & Analytics\n\nWhat would you like to know about the system?`,
      tagalog: `${CHAT_CONFIG.contexts[timeContext].greeting} Ako ang San Miguel MCIS Health Assistant. Maaari kitang tulungan sa:\n\n📱 Mga Feature at Navigation ng App\n🤰 Mga Rekord ng Kalusugan ng Buntis\n🍼 Pagsubaybay sa Kalusugan ng Bata\n💉 Pamamahala ng Bakuna\n📊 Mga Ulat at Analytics\n\nAno ang gusto mong malaman tungkol sa system?`,
      bisaya: `${CHAT_CONFIG.contexts[timeContext].greeting} Ako ang San Miguel MCIS Health Assistant. Makatabang ko sa:\n\n📱 Mga Feature ug Navigation sa App\n🤰 Mga Rekord sa Panglawas sa Mabdos\n🍼 Pagsubaybay sa Panglawas sa Bata\n💉 Pagdumala sa Bakuna\n📊 Mga Report ug Analytics\n\nUnsay imong gusto mahibaw-an bahin sa sistema?`
    };

    let greeting = baseGreeting[currentLanguage] || baseGreeting.english;
    
    // Add role-specific features
    if (profile?.role !== 'USER/MOTHER/GUARDIAN') {
      const roleFeatures = CHAT_CONFIG.roles[profile?.role]?.features || [];
      greeting += `\n\n🎯 Role-specific features:\n• ${roleFeatures.join('\n• ')}`;
    }
    
    return greeting;
  };

  // Initialize messages with enhanced greeting
  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: getEnhancedGreeting(),
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, [currentLanguage, dailyReminders, profile?.role]);

  // Fetch dynamic data
  useEffect(() => {
    const fetchDynamicData = async () => {
      // Fetch daily reminders
      const mockReminders = [
        { type: 'appointment', count: 3, message: 'You have 3 prenatal checkups scheduled today' },
        { type: 'immunization', count: 2, message: '2 children due for immunization this week' },
        { type: 'inventory', count: 5, message: '5 medical supplies are running low' }
      ].filter(reminder => reminder.count > 0);
      
      setDailyReminders(mockReminders);

      // Fetch real-time alerts
      const alerts = await getRealTimeAlerts(profile?.role, conversationContext);
      setRealTimeAlerts(alerts);
    };
    
    fetchDynamicData();

    // Update context every minute
    const interval = setInterval(() => {
      setConversationContext(prev => ({
        ...prev,
        currentTime: new Date()
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [profile?.role]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle alert press
  const handleAlertPress = (alert) => {
    if (alert.action) {
      if (alert.action.type === 'navigate') {
        navigation.navigate(alert.action.screen);
      }
    } else {
      setInputText(alert.message);
    }
  };

  const startVoiceInput = () => {
    setIsListening(true);
    Alert.alert(
      'Voice Input', 
      'Speak your question now...',
      [
        { 
          text: 'Stop Listening', 
          onPress: () => {
            setIsListening(false);
            simulateVoiceInput();
          }
        }
      ]
    );
  };

  const simulateVoiceInput = () => {
    const sampleQuestions = [
      "How do I add a new patient record?",
      "Where can I check medicine inventory?",
      "How to schedule an immunization appointment?",
      "Paano mag-add ng child health record?",
      "Ano ang mga steps para mag-generate ng report?"
    ];
    
    const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
    setInputText(randomQuestion);
  };

  // Enhanced message handling with dynamic features
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    if (inputText.length > 500) {
      Alert.alert('Message Too Long', 'Please keep your message under 500 characters.');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    setConversationContext(prev => ({
      ...prev,
      previousQuestions: [...prev.previousQuestions.slice(-4), inputText.trim()],
      currentTime: new Date()
    }));

    const typingMessage = {
      id: 'typing',
      text: '',
      isUser: false,
      isTyping: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMessage]);

    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      // Generate dynamic response with role and context
      const detectedLanguage = detectLanguage(inputText);
      const languageToUse = detectedLanguage !== 'english' ? detectedLanguage : currentLanguage;
      
      const botResponse = generateResponse(
        inputText, 
        conversationContext, 
        languageToUse, 
        profile?.role
      );
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        isUser: false,
        timestamp: new Date(),
        actions: botResponse.actions || [],
        isEmergency: botResponse.isEmergency || false
      };
      
      setMessages(prev => [...prev, botMessage]);

      const detectedTopic = detectTopic(inputText);
      if (detectedTopic) {
        setConversationContext(prev => ({
          ...prev,
          lastTopic: detectedTopic
        }));
      }
    }, 1500);
  }, [inputText, conversationContext, currentLanguage, profile?.role]);

  const handleQuickSuggestion = useCallback((question) => {
    const userMessage = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    const typingMessage = {
      id: 'typing',
      text: '',
      isUser: false,
      isTyping: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMessage]);

    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      const detectedLanguage = detectLanguage(question);
      const languageToUse = detectedLanguage !== 'english' ? detectedLanguage : currentLanguage;
      
      const botResponse = generateResponse(
        question, 
        conversationContext, 
        languageToUse, 
        profile?.role
      );
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        isUser: false,
        timestamp: new Date(),
        actions: botResponse.actions || [],
        isEmergency: botResponse.isEmergency || false
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1500);
  }, [conversationContext, currentLanguage, profile?.role]);

  // Get dynamic suggested questions based on role and context - FOCUSED ON APP FUNCTIONALITY
  const getDynamicSuggestedQuestions = useCallback(() => {
    const baseQuestions = {
      // BHW - Barangay Health Worker
      'BHW': [
        "How do I add a new patient record?",
        "Where can I check medicine inventory?",
        "How to schedule a prenatal appointment?",
        "How to generate monthly reports?",
        "How to update patient information?",
        "Where to view immunization schedules?",
        "How to check appointment calendar?",
        "How to add new medicine to inventory?"
      ],
      // BNS - Barangay Nutrition Scholar
      'BNS': [
        "How do I add child growth measurements?",
        "Where to track child nutrition status?",
        "How to update child health records?",
        "How to generate nutrition reports?",
        "Where to view feeding program data?",
        "How to schedule child checkups?",
        "How to track immunization records?",
        "Where to find growth monitoring charts?"
      ],
      // USER/MOTHER/GUARDIAN
      'USER/MOTHER/GUARDIAN': [
        "How to view my health records?",
        "Where to schedule my appointments?",
        "How to check my child's immunization?",
        "How to update my profile information?",
        "Where to find pregnancy care tips?",
        "How to view appointment history?",
        "Where to see child growth charts?",
        "How to contact health workers?"
      ]
    };

    // Get questions for current role, fallback to USER if role not found
    const roleQuestions = baseQuestions[profile?.role] || baseQuestions['USER/MOTHER/GUARDIAN'];
    
    // Add context-aware questions based on time of day
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      roleQuestions.push("What are today's scheduled appointments?");
    } else if (currentHour >= 18) {
      roleQuestions.push("How to prepare for tomorrow's schedule?");
    }

    return [...new Set(roleQuestions)].slice(0, 8); // Limit to 8 unique questions
  }, [profile?.role]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={roleColors.headerGradient || ['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image 
            source={BarangayLogo} 
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <Text style={styles.headerTitle}>Health Assistant</Text>
        </View>
        <LanguageToggle 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          roleColors={roleColors}
        />
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Real-time Alerts Banner */}
        <AlertBanner alerts={realTimeAlerts} onAlertPress={handleAlertPress} />

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item.text} 
              isUser={item.isUser} 
              profile={profile}
              timestamp={item.timestamp}
              isTyping={item.isTyping}
              actions={item.actions}
              isEmergency={item.isEmergency}
              roleColors={roleColors}
            />
          )}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick System Questions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.suggestionsScrollContent}
          >
            {(getDynamicSuggestedQuestions() || []).map((question, index) => (
              <SuggestedQuestion
                key={index}
                question={question}
                onPress={() => handleQuickSuggestion(question)}
                roleColors={roleColors}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about app features, navigation, or system help..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            
            <TouchableOpacity 
              style={[
                styles.voiceButton, 
                isListening && styles.voiceButtonActive
              ]}
              onPress={startVoiceInput}
            >
              <MicrophoneIcon />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled, { backgroundColor: roleColors.primary }]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <SendIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimerText}>
            Note: This assistant provides guidance on using the MCIS app features. For medical emergencies, contact healthcare professionals immediately.
          </Text>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  languageToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 70,
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  // Alert Banner Styles
  alertBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    maxHeight: 50,
  },
  alertScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  alertItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  highPriorityAlert: {
    backgroundColor: '#fecaca',
    borderColor: '#ef4444',
  },
  alertText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  userIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubble: {
    maxWidth: screenWidth * 0.75,
    padding: 14,
    borderRadius: 18,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emergencyBubble: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
    color: 'black',
  },
  userText: {
    color: '#1f2937',
  },
  botText: {
    color: '#1f2937',
  },
  emergencyText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  speechButton: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginTop: 2,
  },
  speechButtonActive: {
    backgroundColor: '#3b82f6',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    marginHorizontal: 1,
  },
  actionsContainer: {
    marginTop: 12,
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  emergencyActionButton: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  actionText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyActionText: {
    fontWeight: '700',
  },
  suggestionsContainer: {
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 120,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  suggestionsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputWrapper: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    lineHeight: 20,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#fecaca',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    lineHeight: 12,
  }
});