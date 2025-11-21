import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('love');
  const [listeningMode, setListeningMode] = useState(false);
  const flatListRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listeningAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;

  // Load user data on app start
  useEffect(() => {
    loadUserData();
    // Add initial welcome message
    setMessages([{
      id: '1',
      text: "Hello! I'm Warmth, your AI companion. How are you feeling today?",
      isOutgoing: false,
      timestamp: new Date(),
    }]);

    // Start entrance animations
    startEntranceAnimations();
  }, []);

  // Animate listening mode
  useEffect(() => {
    if (listeningMode) {
      startListeningAnimation();
    } else {
      stopListeningAnimation();
    }
  }, [listeningMode]);

  const startEntranceAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startListeningAnimation = () => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(listeningAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(listeningAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    pulseAnim.setValue(1);
  };

  const stopListeningAnimation = () => {
    listeningAnim.setValue(0);
  };

  const animateMessageSend = () => {
    Animated.sequence([
      Animated.timing(inputAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('warmth_user_name');
      if (savedName) {
        setUserName(savedName);
      }
      const savedListeningMode = await AsyncStorage.getItem('warmth_listening_mode');
      if (savedListeningMode) {
        setListeningMode(savedListeningMode === 'true');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveListeningMode = async (enabled) => {
    try {
      await AsyncStorage.setItem('warmth_listening_mode', enabled.toString());
      setListeningMode(enabled);
    } catch (error) {
      console.error('Error saving listening mode:', error);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;

    animateMessageSend();

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isOutgoing: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom with animation
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const data = await api.sendMessage(
        userMessage.text,
        userName.toLowerCase().replace(/\s+/g, '_'),
        listeningMode
      );

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: data.reply || "I'm here for you. Tell me more.",
        isOutgoing: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Scroll to bottom again
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now, but I'm here for you. Please try again in a moment.",
        isOutgoing: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const AnimatedMessageBubble = ({ item, index }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(item.isOutgoing ? 20 : -20)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index, item.isOutgoing]);

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          item.isOutgoing ? styles.outgoingMessage : styles.incomingMessage,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[
          styles.messageBubble,
          item.isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
        ]}>
          <Text style={[
            styles.messageText,
            item.isOutgoing ? styles.outgoingText : styles.incomingText,
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestampText,
            item.isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp,
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderMessage = ({ item, index }) => (
    <AnimatedMessageBubble item={item} index={index} />
  );

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <ActivityIndicator size="small" color="#000000" />
          <Text style={styles.typingText}>Warmth is thinking...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFE6D4" />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Warmth</Text>
          <Text style={styles.headerSubtitle}>Hello, {userName}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.profileButtonPressed,
          ]}
          onPress={() => {
            Alert.alert(
              'Listening Mode',
              listeningMode ? 'Disable Listening Mode' : 'Enable Listening Mode',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: listeningMode ? 'Disable' : 'Enable',
                  onPress: () => saveListeningMode(!listeningMode),
                },
              ]
            );
          }}
        >
          <Animated.View
            style={[
              styles.profileCircle,
              listeningMode && styles.listeningModeProfile,
              {
                opacity: listeningAnim,
                transform: [
                  {
                    scale: listeningAnim.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.95, 1.05],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.profileInitial}>{userName[0]?.toUpperCase()}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Animated Listening Mode Indicator */}
      {listeningMode && (
        <Animated.View
          style={[
            styles.listeningModeIndicator,
            {
              opacity: listeningAnim,
              backgroundColor: listeningAnim.interpolate({
                inputRange: [0.3, 1],
                outputRange: ['#FFE6D4', '#FFC69D'],
              }),
            },
          ]}
        >
          <Text style={styles.listeningModeText}>
            🌙 Listening Mode - I'm here to listen
          </Text>
        </Animated.View>
      )}

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListFooterComponent={renderTypingIndicator}
        />
      </View>

      {/* Animated Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              transform: [
                {
                  scale: inputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.98],
                  }),
                },
              ],
            },
          ]}
        >
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={listeningMode ? "Share whatever's on your mind..." : "Type your message..."}
            placeholderTextColor="#999999"
            multiline
            maxLength={500}
            editable={!isLoading}
            selectionColor="#CD2C58"
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              inputText.trim() === '' || isLoading ? styles.sendButtonDisabled : styles.sendButtonEnabled,
              pressed && styles.sendButtonPressed,
            ]}
            onPress={sendMessage}
            disabled={inputText.trim() === '' || isLoading}
          >
            <Text style={[
              styles.sendButtonText,
              inputText.trim() === '' || isLoading ? styles.sendButtonTextDisabled : styles.sendButtonTextEnabled,
            ]}>
              Send
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE6D4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
    backgroundColor: '#FFE6D4',
    shadowColor: '#CD2C58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#CD2C58',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  profileButton: {
    marginLeft: 16,
  },
  profileButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningModeProfile: {
    backgroundColor: '#CD2C58',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listeningModeIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    borderLeftWidth: 4,
    borderLeftColor: '#CD2C58',
  },
  listeningModeText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: screenWidth * 0.75,
  },
  outgoingMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  incomingMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: screenWidth * 0.75,
    borderRadius: 20,
    padding: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  outgoingBubble: {
    backgroundColor: '#CD2C58',
    shadowColor: '#CD2C58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  incomingBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE6D4',
  },
  outgoingText: {
    color: '#FFFFFF',
  },
  incomingText: {
    color: '#333333',
  },
  timestampText: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  outgoingTimestamp: {
    color: '#999999',
    textAlign: 'right',
  },
  incomingTimestamp: {
    color: '#999999',
    textAlign: 'left',
  },
  typingContainer: {
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#CD2C58',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF8F3',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    borderWidth: 2,
    borderColor: '#FFE6D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxHeight: 100,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CD2C58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  sendButtonEnabled: {
    backgroundColor: '#CD2C58',
    shadowColor: '#CD2C58',
    shadowOpacity: 0.3,
  },
  sendButtonDisabled: {
    backgroundColor: '#FFC69D',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  sendButtonTextEnabled: {
    color: '#FFFFFF',
  },
  sendButtonTextDisabled: {
    color: '#999999',
  },
});