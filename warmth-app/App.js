import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load Inter fonts
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Initialize app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        api.setAuthToken(token);

        // Quick validation: try to fetch chat history
        try {
          await api.getChatHistory(1); // Just fetch 1 message to test
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          console.log('Token invalid, clearing...');
          await AsyncStorage.removeItem('auth_token');
          api.clearAuthToken();
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !fontsLoaded) {
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

  const handleLogout = async () => {
    try {
      // Clear token from storage
      await AsyncStorage.removeItem('auth_token');
      // Clear token from API client
      api.clearAuthToken();
      // Update auth state
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        {!isAuthenticated ? (
          <Stack.Screen name="Auth">
            {props => <AuthScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Journals" component={JournalsScreen} />
            <Stack.Screen name="Settings">
              {props => <SettingsScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          </>
        )}
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