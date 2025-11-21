import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ChatScreen from './src/screens/ChatScreen';
import MemoriesScreen from './src/screens/MemoriesScreen';
import MoodInsightsScreen from './src/screens/MoodInsightsScreen';
import MoodScreen from './src/screens/MoodScreen';
import api from './src/services/api';

const { width: screenWidth } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Chat') {
            iconName = focused ? '💬' : '💭';
          } else if (route.name === 'Memories') {
            iconName = focused ? '🧠' : '🗒️';
          } else if (route.name === 'Mood') {
            iconName = focused ? '😊' : '😐';
          }
          return <Text style={{ fontSize: 24 }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#CD2C58',
        tabBarInactiveTintColor: '#FFC69D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingBottom: Platform.OS === 'ios' ? 20 : 0,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5E5',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
      })}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen
        name="Memories"
        component={MemoriesScreen}
        options={{ title: 'Memories' }}
      />
      <Tab.Screen
        name="Mood"
        component={MoodScreen}
        options={{ title: 'Mood' }}
      />
      <Tab.Screen
        name="MoodInsights"
        component={MoodInsightsScreen}
        options={{ title: 'Insights' }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [userName, setUserName] = useState('love');
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('warmth_user_name');
      if (savedName) {
        setUserName(savedName);
      }

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
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async (name) => {
    try {
      await AsyncStorage.setItem('warmth_user_name', name);
      setUserName(name);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading Warmth...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <TabNavigator />
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});