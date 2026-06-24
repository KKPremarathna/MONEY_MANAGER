import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { createUserProfile, updateUserProfile, useUserProfile } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../src/AppContext';
import { supabase, isSupabaseConfigured } from '../src/db/supabase';
import { syncAll, syncDown } from '../src/db/syncEngine';

export default function Login() {
  const profile = useUserProfile();
  const { colors, showAlert } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleOfflineSetup = async () => {
    if (!name.trim() || !email.trim()) {
      showAlert("Validation Error", "Please enter both Display Name and Email Address.");
      return;
    }
    setLoading(true);
    try {
      if (profile) {
        await updateUserProfile(profile.id, { name, email });
      } else {
        await createUserProfile(name, email);
      }
      showAlert("Local Profile Saved", "Offline profile successfully created/updated!");
      navigation.goBack();
    } catch (err) {
      showAlert("Error", err.message || "Failed to save offline profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Validation Error", "Please enter both Email and Password.");
      return;
    }

    if (isSignUp && !name.trim()) {
      showAlert("Validation Error", "Please enter a Display Name.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });

        if (error) throw error;

        // Create local profile
        if (profile) {
          await updateUserProfile(profile.id, { name, email });
        } else {
          await createUserProfile(name, email);
        }

        // Run initial sync up to register local default categories
        await syncAll();

        showAlert("Success", "Account created successfully! Check your email for verification if required.");
        navigation.goBack();
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Get user profile metadata
        const userMeta = data.user?.user_metadata || {};
        const displayName = userMeta.display_name || userMeta.name || 'Cloud User';
        const avatarUrl = userMeta.avatar_url || null;

        // Update local user profile
        if (profile) {
          await updateUserProfile(profile.id, { name: displayName, email, imageUri: avatarUrl });
        } else {
          await createUserProfile(displayName, email, avatarUrl);
        }

        // Sync remote data down
        await syncDown();

        showAlert("Success", "Signed in successfully!");
        navigation.goBack();
      }
    } catch (error) {
      showAlert("Authentication Error", error.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={require('../assets/images/people.png')} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Welcome to Money Manager</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isConfigured ? "Authenticate to synchronize your data with the cloud." : "Let's set up your profile."}
      </Text>

      {!isConfigured && (
        <View style={[styles.warningBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <Text style={[styles.warningTitle, { color: colors.primary }]}>Offline Mode</Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Supabase credentials are not configured in src/db/supabase.js. Creating a local-only offline profile.
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        {isConfigured && (
          <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={[styles.tab, !isSignUp && { backgroundColor: colors.background }]} 
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.tabText, { color: !isSignUp ? colors.text : colors.textSecondary }]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, isSignUp && { backgroundColor: colors.background }]} 
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.tabText, { color: isSignUp ? colors.text : colors.textSecondary }]}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {(isSignUp || !isConfigured) && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} 
              placeholder="John Doe" 
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} 
          placeholder="john@example.com" 
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        {isConfigured && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} 
              placeholder="••••••••" 
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </>
        )}

        <TouchableOpacity 
          style={[styles.button, { opacity: loading ? 0.7 : 1 }]} 
          onPress={isConfigured ? handleAuth : handleOfflineSetup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isConfigured ? (isSignUp ? 'Sign Up' : 'Sign In') : 'Save Profile'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
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
    width: 90,
    height: 90,
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center'
  },
  warningBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  warningTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
  },
  inputContainer: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
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
    height: 52,
    justifyContent: 'center',
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

