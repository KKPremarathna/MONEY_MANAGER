import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createUserProfile, updateUserProfile, useUserProfile } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../src/AppContext';

export default function Login() {
  const profile = useUserProfile();
  const { colors } = useAppContext();
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Please enter both Name and Email.");
      return;
    }
    
    if (profile) {
      await updateUserProfile(profile.id, { name, email });
    } else {
      await createUserProfile(name, email);
    }
    
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={require('../assets/images/people.png')} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Welcome to Money Manager</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Let's set up your local profile.</Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} 
          placeholder="John Doe" 
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} 
          placeholder="john@example.com" 
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center'
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2ECC71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold'
  }
});

