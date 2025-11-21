import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '🤗', label: 'Loved', value: 'loved' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
];

const MoodScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    try {
      setRefreshing(true);
      const data = await api.getMoodHistory();
      setMoodHistory(data.history || data.moods || []);
    } catch (error) {
      console.error('Error loading mood history:', error);
      Alert.alert('Error', 'Failed to load mood history. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMoodHistory();
  };

  const handleLogMood = async () => {
    if (!selectedMood) {
      Alert.alert('Please select a mood');
      return;
    }

    try {
      setLoading(true);
      await api.logMood(selectedMood.value, note);

      Alert.alert('Success', 'Mood logged successfully!');
      setSelectedMood(null);
      setNote('');
      loadMoodHistory(); // Reload history
    } catch (error) {
      console.error('Error logging mood:', error);
      Alert.alert('Error', 'Failed to log mood. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (moodValue) => {
    const mood = MOODS.find(m => m.value === moodValue);
    return mood ? mood.emoji : '😐';
  };

  const getMoodLabel = (moodValue) => {
    const mood = MOODS.find(m => m.value === moodValue);
    return mood ? mood.label : 'Unknown';
  };

  const renderMoodItem = ({ item, index }) => (
    <View style={styles.moodItem}>
      <View style={styles.moodHeader}>
        <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
        <View style={styles.moodInfo}>
          <Text style={styles.moodLabel}>{getMoodLabel(item.mood)}</Text>
          <Text style={styles.moodDate}>
            {new Date(item.timestamp || item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
      {item.note && (
        <Text style={styles.moodNote}>{item.note}</Text>
      )}
    </View>
  );

  const renderEmptyHistory = () => (
    <View style={styles.emptyHistory}>
      <Text style={styles.emptyHistoryTitle}>No Mood History</Text>
      <Text style={styles.emptyHistoryText}>
        Start tracking your moods to see them here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mood Tracking</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
        }
      >
        {/* Mood Selection */}
        <View style={styles.moodSelection}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  selectedMood?.value === mood.value && styles.selectedMood,
                ]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodOptionLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note Input */}
        <View style={styles.noteSection}>
          <Text style={styles.sectionTitle}>Add a note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="What's on your mind?"
            placeholderTextColor="#999999"
            multiline
            maxLength={200}
          />
        </View>

        {/* Log Button */}
        <TouchableOpacity
          style={[
            styles.logButton,
            (!selectedMood || loading) && styles.logButtonDisabled,
          ]}
          onPress={handleLogMood}
          disabled={!selectedMood || loading}
        >
          <Text style={[
            styles.logButtonText,
            (!selectedMood || loading) && styles.logButtonTextDisabled,
          ]}>
            {loading ? 'Logging...' : 'Log Mood'}
          </Text>
        </TouchableOpacity>

        {/* Mood History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Moods</Text>
          {moodHistory.length === 0 ? (
            renderEmptyHistory()
          ) : (
            moodHistory.slice(0, 10).map((item, index) => renderMoodItem({ item, index }))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  moodSelection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CD2C58',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: screenWidth * 0.22,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  selectedMood: {
    backgroundColor: '#CD2C58',
    borderColor: '#CD2C58',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  selectedMood: {
    color: '#FFFFFF',
  },
  noteSection: {
    marginBottom: 24,
  },
  noteInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  logButton: {
    backgroundColor: '#CD2C58',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  logButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  logButtonTextDisabled: {
    color: '#999999',
  },
  historySection: {
    marginBottom: 20,
  },
  moodItem: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#CD2C58',
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  moodDate: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  moodNote: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default MoodScreen;