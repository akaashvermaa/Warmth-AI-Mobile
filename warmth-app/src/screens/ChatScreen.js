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
import api from '../services/apiExtended';
import theme from '../theme';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Subtle breathing animation for header
  const headerOpacity = useSharedValue(0.9);

  useEffect(() => {
    headerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 3000 }),
        withTiming(0.9, { duration: 3000 })
      ),
      -1,
      true
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

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Use streaming
    const aiMessageId = (Date.now() + 1).toString();

    try {
      await api.sendMessageStream(
        userMessage.message,
        // onToken - append each token
        (token) => {
          setMessages(prev => {
            // Check if AI message exists
            const exists = prev.some(msg => msg.id === aiMessageId);
            
            if (!exists) {
              // Create it on first token
              const aiMessage = {
                id: aiMessageId,
                message: token,
                isUser: false,
                timestamp: new Date().toISOString(),
              };
              return [...prev, aiMessage];
            }
            
            // Append token
            return prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, message: msg.message + token }
                : msg
            );
          });
        },
        // onComplete
        () => {
          setIsLoading(false);
          setTimeout(() => {
             if(flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
             }
          }, 100);
        },
        // onError
        (error) => {
          console.error('Streaming error:', error);
          setMessages(prev => {
             const exists = prev.some(msg => msg.id === aiMessageId);
             if (!exists) {
                 return [...prev, {
                    id: aiMessageId,
                    message: `Connection Error: ${error.message || "Please try again."}`,
                    isUser: false,
                    timestamp: new Date().toISOString(),
                 }];
             }
             return prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, message: msg.message + `\n[Error: ${error.message}]` }
                  : msg
              );
          });
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble
      message={item.message}
      isUser={item.isUser}
      timestamp={item.timestamp}
      emotions={item.emotions}
    />
  ), []);

  return (
    <LinearGradient
      colors={theme.colors.backgroundGradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? theme.spacing.xl : 8 }]}>
          <Animated.View style={headerAnimatedStyle}>
            <Text style={styles.headerTitle}>Warmth</Text>
            <Text style={styles.headerQuote}>A safe space for your thoughts</Text>
          </Animated.View>
          <TopRightIcons />
        </View>

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
          />

          {isLoading && <TypingIndicator />}

          <View style={styles.inputWrapper}>
            <InputBar
              value={inputText}
              onChangeText={setInputText}
              onSend={sendMessage}
              disabled={isLoading}
            />
          </View>
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
    paddingBottom: theme.spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: theme.typography.heading.fontFamily,
    fontSize: 32,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  headerQuote: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    opacity: 0.8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 8,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  inputWrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
});