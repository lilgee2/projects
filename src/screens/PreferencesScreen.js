import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

const PreferencesScreen = () => {
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get('http://192.168.1.105:5000/api/users/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const preferences = response.data;
        setPushNotificationsEnabled(preferences.pushNotificationsEnabled || false);
        setEmailNotificationsEnabled(preferences.emailNotificationsEnabled || false);
        setSmsNotificationsEnabled(preferences.smsNotificationsEnabled || false);
        setPhoneNumber(preferences.phone || ''); // Fetch saved phone number
        setLoading(false);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const requestPushNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to enable notifications in your settings.');
      return false;
    }
    return true;
  };

  const savePhoneNumber = async () => {
    try {
      setLoading(true); // Set loading state when saving the phone number
      console.log('Saving phone number...'); 

      const token = await AsyncStorage.getItem('userToken');
      console.log('Token retrieved:', token); 

      const userId = await AsyncStorage.getItem('userId');
      console.log('User ID retrieved:', userId); 

      // Save phone number to the backend
      await axios.post(
        'http://192.168.1.105:5000/api/users/preferences/phone',
        {
          phone: phoneNumber,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Phone number saved successfully!'); 
      setShowPhoneModal(false); 
      Alert.alert('Success', 'Phone number saved successfully!');
    } catch (error) {
      console.error('Error saving phone number:', error); 
      Alert.alert('Error', 'Failed to save phone number.');
    } finally {
      setLoading(false); 
      console.log('Loading state reset.'); 
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      console.log('Saving preferences...'); 

      const token = await AsyncStorage.getItem('userToken');
      console.log('Token retrieved:', token); 

      // Request push notification permission if enabled
      if (pushNotificationsEnabled) {
        console.log('Requesting push notification permission...'); 
        const permissionGranted = await requestPushNotificationPermission();
        if (!permissionGranted) {
          setPushNotificationsEnabled(false);
          setLoading(false); 
          return;
        }
      }

      // Check if SMS notifications are enabled and no phone number is saved
      if (smsNotificationsEnabled && !phoneNumber) {
        console.log('No phone number found. Showing modal...'); 
        setLoading(false); 
        setShowPhoneModal(true); 
        return;
      }

      // Save preferences to the backend
      console.log('Saving preferences to backend...'); 
      await axios.post(
        'http://192.168.1.105:5000/api/users/preferences',
        {
          pushNotificationsEnabled: pushNotificationsEnabled,
          emailNotificationsEnabled: emailNotificationsEnabled,
          smsNotificationsEnabled: smsNotificationsEnabled,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Preferences saved successfully!'); 
      Alert.alert('Success', 'Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error); 
      setError(error);
      Alert.alert('Error', 'Failed to save preferences.');
    } finally {
      setLoading(false); 
      console.log('Loading state reset.'); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[styles.header, { fontSize: 42 }]}>Settings</Text>
      <Text style={[styles.header, { color: 'gray' }]}>Update your preferences here</Text>
      <Text style={[styles.header, { color: 'gray' }]}>PREFERENCES</Text>

      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>Push Notifications</Text>
        <Switch
          value={pushNotificationsEnabled}
          onValueChange={setPushNotificationsEnabled}
        />
      </View>

      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>Email Notifications</Text>
        <Switch
          value={emailNotificationsEnabled}
          onValueChange={setEmailNotificationsEnabled}
        />
      </View>

      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>SMS Notifications</Text>
        <Switch
          value={smsNotificationsEnabled}
          onValueChange={setSmsNotificationsEnabled}
        />
      </View>

      <View style={styles.emergencyContainer}>
        <Text style={[styles.header, { color: 'gray' }]}>EMERGENCY RESOURCES</Text>
        <Text style={styles.resourceText}>Emergency Contact: 10111</Text>
        <Text style={styles.resourceText}>Power Outage Hotline: 0800 123 456</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={savePreferences}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>Error: {error.message}</Text>}

      {/* Phone Number Input Modal */}
      <Modal visible={showPhoneModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <Button title="Save" onPress={savePhoneNumber} />
            <Button title="Cancel" onPress={() => setShowPhoneModal(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 0,
  },
  preferenceLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'gray',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  emergencyContainer: {
    marginTop: 20,
  },
  resourceText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default PreferencesScreen;