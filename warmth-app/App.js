import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ChatScreen from './src/screens/ChatScreen';
import JournalsScreen from './src/screens/JournalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import api from './src/services/api';
import theme from './src/theme';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize authentication
      try {
        const deviceId = 'mobile_user_' + Math.random().toString(36).substr(2, 9);
        await api.createDevUser(deviceId, 'Warmth Mobile User');
        console.log('✅ Authentication initialized');
      } catch (authError) {
        console.error('⚠️ Auth initialization failed:', authError);
        // Continue anyway - app can still work without auth for some features
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading Warmth AI...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          animationEnabled: true,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Journals" component={JournalsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});