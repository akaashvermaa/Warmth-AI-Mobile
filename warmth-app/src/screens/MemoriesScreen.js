import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const MemoriesScreen = ({ navigation }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await api.getMemories();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error loading memories:', error);
      Alert.alert('Error', 'Failed to load memories. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMemories();
  };

  const handleForgetMemory = (memoryId) => {
    Alert.alert(
      'Forget Memory',
      'Are you sure you want to forget this memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forget',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.forgetMemory(memoryId);
              loadMemories(); // Reload memories
            } catch (error) {
              console.error('Error forgetting memory:', error);
              Alert.alert('Error', 'Failed to forget memory. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEraseAll = () => {
    Alert.alert(
      'Erase All Data',
      'This will permanently delete all your memories and mood data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase All',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.eraseAllData();
              setMemories([]);
              Alert.alert('Success', 'All data has been erased.');
            } catch (error) {
              console.error('Error erasing data:', error);
              Alert.alert('Error', 'Failed to erase data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMemory = ({ item }) => (
    <View style={styles.memoryContainer}>
      <View style={styles.memoryHeader}>
        <Text style={styles.memoryDate}>
          {new Date(item.timestamp || item.created_at).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.forgetButton}
          onPress={() => handleForgetMemory(item.id)}
        >
          <Text style={styles.forgetButtonText}>Forget</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.memoryText}>{item.content || item.text}</Text>
      {item.mood && (
        <Text style={styles.memoryMood}>Mood: {item.mood}</Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Memories Yet</Text>
      <Text style={styles.emptyStateText}>
        Your memories will appear here as you chat with Warmth.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memories</Text>
        <TouchableOpacity style={styles.eraseButton} onPress={handleEraseAll}>
          <Text style={styles.eraseButtonText}>Erase All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          renderItem={renderMemory}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#CD2C58',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  eraseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#CD2C58',
    borderRadius: 8,
  },
  eraseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  },
  listContent: {
    padding: 16,
  },
  memoryContainer: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#CD2C58',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryDate: {
    fontSize: 12,
    color: '#999999',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  forgetButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#CD2C58',
    borderRadius: 6,
  },
  forgetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  memoryText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  memoryMood: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#CD2C58',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default MemoriesScreen;