import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [pastSchedules, setPastSchedules] = useState([]);
  const [selectedArea, setSelectedArea] = useState(route.params?.selectedArea || null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        // Fetch upcoming 5 schedules
        const upcomingResponse = await axios.get('http://192.168.1.105:5000/api/schedules/upcoming', {
          headers: { Authorization: `Bearer ${token}` },
          params: { area: selectedArea, limit: 5 },
        });
        console.log('Upcoming schedules fetched:', upcomingResponse.data); 
        setUpcomingSchedules(upcomingResponse.data);

        // Fetch past 10 schedules
        const pastResponse = await axios.get('http://192.168.1.105:5000/api/schedules/past', {
          headers: { Authorization: `Bearer ${token}` },
          params: { area: selectedArea, limit: 10 },
        });
        console.log('Past schedules fetched:', pastResponse.data); 
        setPastSchedules(pastResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);

        // Display a user-friendly error message
        if (error.response && error.response.status === 500) {
          Alert.alert('Server Error', 'An error occurred on the server. Please try again later.');
        } else {
          Alert.alert('Network Error', 'Failed to fetch data. Please check your connection.');
        }
      }
    };

    fetchData();
  }, [selectedArea]);

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
        <TouchableOpacity onPress={() => navigation.navigate('Filter')}>
          <MaterialIcons name="filter-list" size={24} color="#000" />
        </TouchableOpacity>
      </View>

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
});

export default HomeScreen;