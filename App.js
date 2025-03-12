import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import PreferencesScreen from './src/screens/PreferencesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import * as Notifications from 'expo-notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Schedule') {
            iconName = 'calendar-outline';
          } else if (route.name === 'History') {
            iconName = 'receipt-outline';
          } else if (route.name === 'Preferences') {
            iconName = 'settings-outline';
          }
          const customizeSize = 25;
          return (
            <Ionicons
              name={iconName}
              size={customizeSize}
              color={focused ? 'blue' : 'gray'}
            />
          );
        },
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          fontSize: 12,
          fontFamily: 'SpaceGroteskMedium',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Preferences" component={PreferencesScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        SpaceGroteskBold: require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
        SpaceGroteskMedium: require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
      });
      setFontLoaded(true);
    }

    loadFonts();

    // Configure notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Listen for notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    return () => subscription.remove();
  }, []);

  if (!fontLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}