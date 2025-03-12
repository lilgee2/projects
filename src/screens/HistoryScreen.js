import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-gifted-charts';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { SafeAreaView } from 'react-native-safe-area-context';

const HistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(0);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get('http://192.168.1.105:5000/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setScheduleData(response.data); 
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error fetching schedule data: {error.message}</Text>
      </View>
    );
  }

  // Sort scheduleData by areaCode (e.g., N01, N02, N03, etc.)
  const sortedScheduleData = [...scheduleData].sort((a, b) => {
    return a.areaCode.localeCompare(b.areaCode, undefined, { numeric: true });
  });

  // Prepare data for the bar chart based on the selected period
  const periodKeys = ['daily', 'weekly', 'monthly'];
  const selectedPeriodKey = periodKeys[selectedPeriod];
  const barData = sortedScheduleData.map(areaData => ({
    value: parseFloat(areaData[`${selectedPeriodKey}Average`].replace(' hours', '')),
    label: areaData.areaCode,
    frontColor: '#177AD5', 
  }));

  // Calculate the width of the bar chart based on the number of bars
  const barWidth = 18; 
  const spacing = 20; 
  const chartWidth = barData.length * (barWidth + spacing) + 40; 

  return (
    <SafeAreaView style={styles.container}>

    
      <Text style={styles.header}>Schedule Data</Text>

      {/* Card for Bar Chart and Segmented Control */}
      <View style={styles.card}>
        {/* Segmented Control */}
        <SegmentedControl
          values={['Daily', 'Weekly', 'Monthly']}
          selectedIndex={selectedPeriod}
          onChange={(event) => {
            setSelectedPeriod(event.nativeEvent.selectedSegmentIndex);
          }}
          style={styles.segmentedControl}
        />

        {/* Horizontal ScrollView for Bar Chart */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <BarChart
            data={barData}
            height={200}
            width={chartWidth} 
            barWidth={barWidth}
            minHeight={3}
            barBorderRadius={3}
            spacing={spacing}
            noOfSections={4}
            yAxisThickness={0}
            xAxisLabelTextStyle={{ color: '#666', fontSize: 12 }}
            yAxisTextStyle={{ color: '#666', fontSize: 12 }}
            labelTextStyle={{ color: '#666', fontSize: 12 }}
           
          />
        </ScrollView>
      </View>
      <ScrollView style={styles.container}>
      {/* Schedule Details */}
      {sortedScheduleData.length === 0 ? (
        <Text style={styles.noDataText}>No schedule data found.</Text>
      ) : (
        sortedScheduleData.map((areaData, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>Area Code: {areaData.areaCode}</Text>
            <Text style={styles.cardText}>Daily Average: {areaData.dailyAverage}</Text>
            <Text style={styles.cardText}>Weekly Average: {areaData.weeklyAverage}</Text>
            <Text style={styles.cardText}>Monthly Average: {areaData.monthlyAverage}</Text>

            {/* Display a warning if any schedule has invalid data */}
            {areaData.schedules.some(schedule => {
              const startTime = new Date(schedule.start_time);
              const endTime = new Date(schedule.end_time);
              return endTime < startTime;
            }) && (
              <Text style={styles.warningText}>Warning: Some schedules have invalid data (end_time earlier than start_time).</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    color: 'blue',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden', 
  },
  segmentedControl: {
    marginBottom: 20,
  },
  chartScrollContainer: {
    alignItems: 'center', 
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  warningText: {
    fontSize: 14,
    color: 'lightblue',
    marginBottom: 10,
  },
});

export default HistoryScreen;