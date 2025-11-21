import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import InputBar from '../components/chat/InputBar';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import TopRightIcons from '../components/navigation/TopRightIcons';
import api from '../services/api';
import theme from '../theme';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);

  // Load user data and initialize
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // Get or create user ID
      let storedUserId = await AsyncStorage.getItem('warmth_user_id');
      if (!storedUserId) {
        storedUserId = `user_${Date.now()}`;
        await AsyncStorage.setItem('warmth_user_id', storedUserId);
      }
      setUserId(storedUserId);

      // Add welcome message
      setMessages([{
        id: '1',
        message: "Hello! I'm Warmth, your AI companion. How are you feeling today?",
        isUser: false,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || isLoading || !userId) return;

    const userMessage = {
      id: Date.now().toString(),
      message: inputText.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Call API
      const response = await api.sendMessage(userMessage.message, userId, false);

      // Add AI response with emotions
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: response.response || response.message,
        isUser: false,
        timestamp: new Date().toISOString(),
        emotions: response.emotions || [],
      };

      setMessages(prev => [...prev, aiMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        message: "I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <MessageBubble
      message={item.message}
      isUser={item.isUser}
      timestamp={item.timestamp}
      emotions={item.emotions}
    />
  );

  const getItemLayout = (data, index) => ({
    length: 80, // Approximate height
    offset: 80 * index,
    index,
  });

  return (
    <LinearGradient
      colors={theme.colors.backgroundGradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Ultra-Minimal Header with Top-Right Icons */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Warmth AI</Text>
          <TopRightIcons />
        </View>

        {/* Chat Messages */}
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={Platform.OS === 'android'}
            getItemLayout={getItemLayout}
          />

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}

          {/* Input Bar */}
          <InputBar
            value={inputText}
            onChangeText={setInputText}
            onSend={sendMessage}
            disabled={isLoading}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontSize: 20,
    color: theme.colors.text,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: theme.spacing.md,
    flexGrow: 1,
  },
});