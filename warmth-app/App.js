import {
    CormorantGaramond_600SemiBold,
    useFonts as useCormorantFonts
} from '@expo-google-fonts/cormorant-garamond';
import {
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    useFonts as useNunitoFonts
} from '@expo-google-fonts/nunito';
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

  // Load Fonts
  let [cormorantLoaded] = useCormorantFonts({
    CormorantGaramond_600SemiBold,
  });

  let [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const fontsLoaded = cormorantLoaded && nunitoLoaded;

  // Initialize app
  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-refresh token every 50 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('Auto-refreshing token...');
          const response = await api.refreshToken(refreshToken);

          if (response?.access_token) {
            await AsyncStorage.setItem('auth_token', response.access_token);
            if (response.refresh_token) {
              await AsyncStorage.setItem('refresh_token', response.refresh_token);
            }
            api.setAuthToken(response.access_token);
            console.log('Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        api.setAuthToken(token);
        try {
          await api.getUserProfile();
          setIsAuthenticated(true);
        } catch (error) {
          console.log('Token invalid, attempting refresh...');
          const refreshToken = await AsyncStorage.getItem('refresh_token');

          if (refreshToken) {
            try {
              const response = await api.refreshToken(refreshToken);
              if (response?.access_token) {
                await AsyncStorage.setItem('auth_token', response.access_token);
                if (response.refresh_token) {
                  await AsyncStorage.setItem('refresh_token', response.refresh_token);
                }
                api.setAuthToken(response.access_token);
                setIsAuthenticated(true);
                console.log('Token refreshed successfully');
                return;
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
          await handleLogout();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
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
            <Text style={styles.loadingText}>Loading Warmth...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      api.clearAuthToken();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
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
            {props => <AuthScreen {...props} onLogin={checkAuth} />}
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
    fontFamily: theme.typography.bodyFont,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});