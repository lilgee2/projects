import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';

const ScheduleScreen = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [filterLoading, setFilterLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        // Fetch current schedules
        const currentSchedulesResponse = await axios.get('http://192.168.1.105:5000/api/schedules/current', {
          headers: { Authorization: `Bearer ${token}` },
          params: { area_code: activeCategory || null }, 
        });
        setScheduleData(currentSchedulesResponse.data);

        // Fetch area codes
        const areaCodesResponse = await axios.get('http://192.168.1.105:5000/api/schedules/areacodes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const areaCodes = areaCodesResponse.data.map(item => ({
          title: `Area ${item.area_code}`,
          code: item.area_code.toString(),
        }));
        setCategories([{ title: 'All', code: '' }, ...areaCodes]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCategory]); 

  useEffect(() => {
    if (scheduleData) {
      setFilterLoading(true); 

      const filteredData = scheduleData.filter(item => {
        const area = item.area || item.zone || '';
        return area.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (!activeCategory || item.area_code === activeCategory); 
      });

      // Simulate a delay to show the loading spinner (optional)
      setTimeout(() => {
        setFilteredSchedule(filteredData);
        setFilterLoading(false); 
      }, 500); 
    }
  }, [searchQuery, scheduleData, activeCategory]);

  const handleCategoryChange = (code) => {
    setActiveCategory(code); 
    console.log("Active Category:", code); 
  };

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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error fetching schedule: {error.message}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.scheduleItem}>
      <Text style={styles.area}>{item.area || item.zone} ({item.area_code})</Text>
      <Text style={styles.date}>Date: {formatDate(item.start_time)}</Text>
      <Text style={styles.time}>Start: {formatTime(item.start_time)}</Text>
      <Text style={styles.time}>End: {formatTime(item.end_time)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { fontFamily: 'SpaceGroteskBold', color: 'blue', fontSize: 42 }]}>Discover</Text>
        <Text style={styles.subHeader}>Load Shedding Schedules</Text>
      </View>

      <View style={styles.floatingSearchContainer}>
        <TouchableOpacity style={styles.searchIcon}>
          <MagnifyingGlassIcon size={25} color="gray" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search area/zone"
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />
      </View>

      <View style={styles.headerContainer}>
        <Text style={[styles.sectionHeader, { fontFamily: 'SpaceGroteskBold', color: 'black', fontSize: 24 }]}>
          Schedules
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category, index) => {
          const isActive = category.code === activeCategory;
          const textClass = isActive ? styles.activeText : styles.inactiveText;
          const buttonClass = isActive ? styles.activeButton : styles.inactiveButton;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleCategoryChange(category.code)}
              style={[styles.categoryButton, buttonClass]}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, textClass, { paddingHorizontal: 15 }]} numberOfLines={1} ellipsizeMode="tail">
                {category.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>


      {filterLoading ? ( // Show loading spinner while filtering
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={filteredSchedule}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 15,
  },
  header: {
    textAlign: 'left',
  },
  subHeader: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'left',
    marginTop: 10,
    marginBottom: 20,
  },
  floatingSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    paddingLeft: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'black',
    marginLeft: 10,
  },
  categoriesContainer: {
    marginBottom: 15,
    height: 50,
  },
  categoryText: {
    fontSize: 16,
    textAlign: 'center',
  },
  categoryButton: {
    borderRadius: 10,
    marginRight: 10,
    height: 25,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: 'blue',
  },
  inactiveButton: {
    backgroundColor: '#ddd',
  },
  activeText: {
    color: 'white',
  },
  inactiveText: {
    color: 'grey',
  },
  scheduleItem: {
    padding: 15,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
  },
  area: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  time: {
    fontSize: 16,
    color: 'gray',
  },
  date: {
    fontSize: 14,
    color: 'gray',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScheduleScreen;