import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Subtle breathing animation for header
  const headerOpacity = useSharedValue(1);

  useEffect(() => {
    headerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2500 }),
        withTiming(1, { duration: 2500 })
      ),
      -1,
      false
    );
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Load chat history on mount
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    // Always start fresh - don't load chat history
    // Only memories, moods, and insights are saved, not chat messages
    setMessages([{
      id: '1',
      message: "Hi—welcome back. How are you feeling right now? I'm here to listen.",
      isUser: false,
      timestamp: new Date().toISOString(),
    }]);
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;

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
      // Call API (backend uses authenticated user from JWT token)
      // Note: We still pass null for userId since backend ignores it
      const response = await api.sendMessage(userMessage.message, null, false);

      // Add AI response with emotions
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: response.reply || response.response || response.message,
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

  // Memoize render function for better performance
  const renderMessage = useCallback(({ item }) => (
    <MessageBubble
      message={item.message}
      isUser={item.isUser}
      timestamp={item.timestamp}
      emotions={item.emotions}
    />
  ), []);

  // Optimize getItemLayout for better scrolling performance
  const getItemLayout = useCallback((data, index) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  return (
    <LinearGradient
      colors={theme.colors.backgroundGradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Notch-Safe Header with subtle animation */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? theme.spacing.xl : insets.top + 8 }]}>
          <Animated.View style={headerAnimatedStyle}>
            <Text style={styles.headerTitle}>Warmth</Text>
            <Text style={styles.headerQuote}>A safe space for your thoughts</Text>
          </Animated.View>
          <TopRightIcons />
        </View>

        {/* Date + Time Pill */}
        <View style={styles.datePillContainer}>
          <View style={styles.datePill}>
            <Text style={styles.dateText}>
              Today · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Chat Messages */}
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            style={{ flex: 1 }}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
            updateCellsBatchingPeriod={50}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
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
    paddingHorizontal: 20,
    paddingBottom: theme.spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 26,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  headerQuote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 3,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
  datePillContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: 8,
  },
  datePill: {
    backgroundColor: 'rgba(255, 245, 239, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontFamily: theme.typography.caption.fontFamily,
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
});