// Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Header() {
  const navigation = useNavigation();

  return (
    <View className="flex-row justify-between items-center mx-4 mt-4">
      <View className="flex-row items-center">
        <View>
          <Text
            className="text-2xl text-blue-600"
            style={{ fontFamily: 'SpaceGroteskBold' }}
          >
            zesa
          </Text>
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={() => navigation.navigate('Filter')}
            className="ml-2"
            accessibilityLabel="Filter"
            accessibilityRole="button"
          >
            <MaterialIcons name="filter-list" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Schedule')}
            className="ml-2"
            accessibilityLabel="Search"
            accessibilityRole="button"
          >
            <MaterialIcons name="search" size={24} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}