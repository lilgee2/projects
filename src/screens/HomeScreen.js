import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [pastSchedules, setPastSchedules] = useState([]);
  const [selectedArea, setSelectedArea] = useState(route.params?.selectedArea || null);
  const [activeScheduleIndex, setActiveScheduleIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        // Fetch upcoming 5 schedules
        const upcomingResponse = await axios.get('http://192.168.1.110:5000/api/schedules/upcoming', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...(selectedArea && { area: selectedArea }),
            limit: 5,
          },
        });
        setUpcomingSchedules(upcomingResponse.data);

        // Fetch past 10 schedules
        const pastResponse = await axios.get('http://192.168.1.110:5000/api/schedules/past', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...(selectedArea && { area: selectedArea }),
            limit: 10,
          },
        });
        setPastSchedules(pastResponse.data);

        // Fetch areas from the database
        const areasResponse = await axios.get('http://192.168.1.110:5000/api/schedules/areas', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mappedAreas = areasResponse.data.map(area => ({
          area_name: area.area,
          area_code: area.area,
        }));
        setAreas(mappedAreas);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
        if (error.response && error.response.status === 500) {
          Alert.alert('Server Error', 'An error occurred on the server. Please try again later.');
        } else {
          Alert.alert('Network Error', 'Failed to fetch data. Please check your connection.');
        }
      }
    };

    fetchData();
  }, [selectedArea]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const ws = new WebSocket(`ws://192.168.1.105:5000?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'SCHEDULE_UPDATE') {
          console.log('Received schedule update:', message.data);
          setUpcomingSchedules(message.data.upcomingSchedules);
          setPastSchedules(message.data.pastSchedules);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        ws.close(); 
      };
    };

    connectWebSocket();
  }, []);

  

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') return 'N/A';
    
    const options = {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Check if a schedule is currently active and calculate progress
  useEffect(() => {
    const checkActiveSchedule = () => {
      const now = new Date();
      const activeIndex = upcomingSchedules.findIndex(schedule => {
        const startTime = new Date(schedule.start_time);
        const endTime = new Date(schedule.end_time);
        return now >= startTime && now <= endTime;
      });

      if (activeIndex !== -1) {
        const activeSchedule = upcomingSchedules[activeIndex];
        const startTime = new Date(activeSchedule.start_time).getTime();
        const endTime = new Date(activeSchedule.end_time).getTime();
        const currentTime = now.getTime();

        // Calculate progress (0 to 1)
        const totalDuration = endTime - startTime;
        const elapsedTime = currentTime - startTime;
        const progressValue = elapsedTime / totalDuration;

        setProgress(progressValue);
        setActiveScheduleIndex(activeIndex);
      } else {
        setProgress(0);
        setActiveScheduleIndex(null);
      }
    };

    // Check every minute
    const interval = setInterval(checkActiveSchedule, 60000);
    checkActiveSchedule(); 

    return () => clearInterval(interval);
  }, [upcomingSchedules]);

  // Toggle filter dropdown
  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };


 // Handle area selection
 const handleAreaSelect = async (area) => {
  setSelectedArea(area);
  setShowFilter(false);

  // Save the selected area to AsyncStorage
  await AsyncStorage.setItem('selectedArea', area || '');
};

// Schedule a notification for the next upcoming schedule
const scheduleNotification = async () => {
  const nextSchedule = upcomingSchedules[0]; 
  if (!nextSchedule) return;

  const notificationContent = {
    title: 'Upcoming Load Shedding Schedule',
    body: `Area: ${nextSchedule.area}, Start: ${formatTime(nextSchedule.start_time)}, End: ${formatTime(nextSchedule.end_time)}`,
    data: { schedule: nextSchedule },
  };

  const trigger = new Date(nextSchedule.start_time).getTime() - Date.now(); 
  if (trigger > 0) {
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: { seconds: trigger / 1000 },
    });
    console.log('Notification scheduled for:', nextSchedule.start_time);
  }
};

useEffect(() => {
  if (upcomingSchedules.length > 0) {
    scheduleNotification();
  }
}, [upcomingSchedules]);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error fetching data: {error.message}</Text>
      </View>
    );
  }

  // Solid colors for the cards
  const colors = ['#000080', 'red'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { fontFamily: 'SpaceGroteskBold' }]}>
          <Text style={{ color: 'red' }}>ZE</Text>
          <Text style={{ color: 'blue' }}>SA</Text>
        </Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <MagnifyingGlassIcon size={25} strokeWidth={2} color="blue" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Incoming Schedules Section */}
      {!loading && !error && upcomingSchedules.length > 0 && (
        <View>
          <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeader, { fontFamily: 'SpaceGroteskBold', color: 'blue' }]}>
              Incoming Schedules
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={[styles.viewAllText, { fontFamily: 'SpaceGroteskMedium' }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 210 }}>
            {upcomingSchedules.map((schedule, index) => (
              <View key={index} style={[styles.card, { backgroundColor: colors[index % colors.length], width: width * 0.8, marginRight: 16 }]}>
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                  style={styles.gradient}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}> {schedule.area}: {schedule.area_code}</Text>
                  <Text style={styles.cardText}>Date: {formatDate(schedule.start_time)}</Text>
                  <Text style={styles.cardText}>Start: {formatTime(schedule.start_time)}</Text>
                  <Text style={styles.cardText}>End: {formatTime(schedule.end_time)}</Text>
                </View>
                {/* Loading Icon for Active Schedule */}
                {activeScheduleIndex === index && (
                  <View style={styles.loadingIconContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* My Areas Section */}
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionHeader, { fontFamily: 'SpaceGroteskBold', color: 'blue' }]}>
          My Area
        </Text>
        <TouchableOpacity onPress={toggleFilter}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown */}
      {showFilter && (
  <View style={styles.filterDropdown}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {/* "All" Button */}
      <TouchableOpacity
        onPress={() => handleAreaSelect(null)}
        style={[
          styles.filterButton,
          selectedArea === null && styles.selectedFilterButton,
        ]}
      >
        <Text
          style={[
            styles.filterButtonText,
            selectedArea === null && styles.selectedFilterButtonText,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {/* Area Buttons */}
      {areas.map((area, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleAreaSelect(area.area_code)}
          style={[
            styles.filterButton,
            selectedArea === area.area_code && styles.selectedFilterButton,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedArea === area.area_code && styles.selectedFilterButtonText,
            ]}
          >
            {area.area_name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}

      {/* Progress Circle for Current Schedule */}
      {activeScheduleIndex !== null && (
        <View style={styles.progressContainer}>
          <Progress.Circle
            size={100}
            progress={progress}
            color="#000080"
            thickness={8}
            showsText
            formatText={() => `${Math.round(progress * 100)}%`}
          />
          <Text style={styles.progressText}>
            {formatTime(upcomingSchedules[activeScheduleIndex].start_time)} - {formatTime(upcomingSchedules[activeScheduleIndex].end_time)}
          </Text>
        </View>
      )}

      {/* Past Schedules Section with ScrollView */}
      {pastSchedules.length > 0 ? (
        <ScrollView
          nestedScrollEnabled={true}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {pastSchedules.map((schedule) => (
            <View key={schedule.id} style={styles.areaContainer}>
              <Text style={styles.areaName}>
                {schedule.area} :{schedule.area_code}
              </Text>
              <Text style={styles.areaDetails}>
                Date: {formatDate(schedule.start_time)}
              </Text>
              <Text style={styles.areaDetails}>
                Start: {formatTime(schedule.start_time)}
              </Text>
              <Text style={styles.areaDetails}>
                End: {formatTime(schedule.end_time)}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noLoadsheddingText}>No past schedules found.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'blue',
  },
  viewAllText: {
    fontSize: 16,
    color: '#4b5563',
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 24,
    height: 200,
    width: width * 0.8,
    marginRight: 16, 
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  loadingIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000080',
  },
  areaContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  areaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000080',
    marginBottom: 8,
  },
  areaDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noLoadsheddingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 15,
    height:25,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  selectedFilterButton: {
    backgroundColor: 'blue',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#000',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#666', 
  },
  selectedFilterButtonText: {
    color: '#fff', 
  },
});

export default HomeScreen;