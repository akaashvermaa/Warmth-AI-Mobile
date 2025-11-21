import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { api } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const MoodInsightsScreen = () => {
  const [moodHistory, setMoodHistory] = useState([]);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMoodHistory = useCallback(async () => {
    try {
      const response = await api.getMoodHistory();
      setMoodHistory(response.history || []);
      setAdvice(response.advice || '');
    } catch (error) {
      console.error('Error loading mood history:', error);
      setAdvice('Unable to load mood data at the moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMoodHistory();
  }, [loadMoodHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMoodHistory();
  }, [loadMoodHistory]);

  const getMoodColor = (score) => {
    if (score > 0.3) return '#FFC69D'; // Warm peach for positive
    if (score < -0.3) return '#CD2C58'; // Deep pink for negative
    return '#FFE6D4'; // Light cream for neutral
  };

  const getMoodEmoji = (score) => {
    if (score > 0.5) return '😊';
    if (score > 0.3) return '🙂';
    if (score > -0.3) return '😐';
    if (score > -0.5) return '😔';
    return '😢';
  };

  const formatChartData = () => {
    if (!moodHistory.length) return null;

    const sortedData = [...moodHistory].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    ).slice(-7); // Last 7 entries

    return {
      labels: sortedData.map((_, index) => `Day ${index + 1}`),
      datasets: [{
        data: sortedData.map(entry => entry.score),
        color: (opacity = 1) => `rgba(205, 44, 88, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const getBarChartData = () => {
    if (!moodHistory.length) return null;

    const moodCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    moodHistory.forEach(entry => {
      if (entry.score > 0.3) moodCounts.positive++;
      else if (entry.score < -0.3) moodCounts.negative++;
      else moodCounts.neutral++;
    });

    return {
      labels: ['Happy', 'Neutral', 'Sad'],
      datasets: [{
        data: [moodCounts.positive, moodCounts.neutral, moodCounts.negative]
      }]
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(205, 44, 88, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#CD2C58'
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CD2C58" />
        <Text style={styles.loadingText}>Loading your mood insights...</Text>
      </View>
    );
  }

  const lineChartData = formatChartData();
  const barChartData = getBarChartData();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Mood Journey</Text>
        <Text style={styles.subtitle}>Track your emotional patterns over time</Text>
      </View>

      {advice && (
        <View style={styles.adviceContainer}>
          <Text style={styles.adviceTitle}>💡 Insight</Text>
          <Text style={styles.adviceText}>{advice}</Text>
        </View>
      )}

      {lineChartData && lineChartData.datasets[0].data.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Mood Trends (Last 7 entries)</Text>
          <LineChart
            data={lineChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {barChartData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Mood Distribution</Text>
          <BarChart
            data={barChartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) =>
                `rgba(205, 44, 88, ${opacity})`
            }}
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Moods</Text>
        {moodHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No mood data yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with Warmth to track your mood automatically!
            </Text>
          </View>
        ) : (
          <View style={styles.moodList}>
            {[...moodHistory]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 10)
              .map((entry, index) => (
                <View key={entry.id || index} style={styles.moodItem}>
                  <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(entry.score) }]}>
                    <Text style={styles.moodEmoji}>{getMoodEmoji(entry.score)}</Text>
                  </View>
                  <View style={styles.moodDetails}>
                    <Text style={styles.moodLabel}>
                      {entry.label || 'Unknown'} • {entry.topic || 'General'}
                    </Text>
                    <Text style={styles.moodTime}>
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.moodScore}>
                    {entry.score > 0 ? '+' : ''}{(entry.score * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#CD2C58',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'System',
  },
  adviceContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFE6D4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#CD2C58',
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CD2C58',
    marginBottom: 8,
    fontFamily: 'System',
  },
  adviceText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: 'System',
  },
  chartContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'System',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  historyContainer: {
    margin: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'System',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
  moodList: {
    gap: 12,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  moodIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodDetails: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'System',
  },
  moodTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'System',
  },
  moodScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CD2C58',
    fontFamily: 'System',
  },
});

export default MoodInsightsScreen;