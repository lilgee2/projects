import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://192.168.1.105:5000/api/users/register', {
        email: email,
        password: password,
      });

      if (response.status === 201) {
        const token = response.data.token;
        const userId = String(response.data.userId); 

        // Save token and userId to AsyncStorage
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userId', userId);

        Alert.alert('Success', 'Registration successful. Please login.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'Registration failed.');
      }
    } catch (error) {
      console.error('Registration error:', error); 
      console.error('Full error object:', error.toJSON()); 
      Alert.alert('Error', 'Registration failed. Please check your details.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Register" onPress={handleRegister} />
      <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  linkText: {
    marginTop: 15,
    textAlign: 'center',
    color: 'blue',
  },
});

export default RegisterScreen;