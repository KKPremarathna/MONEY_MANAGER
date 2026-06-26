import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { createUserProfile, updateUserProfile, useUserProfile } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../src/AppContext';
import { supabase, isSupabaseConfigured } from '../src/db/supabase';
import { syncAll, syncDown } from '../src/db/syncEngine';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const insets = useSafeAreaInsets();
  const profile = useUserProfile();
  const { colors, showAlert } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const navigation = useNavigation();

  // Real-time password rules validation
  const passwordRules = [
    { id: 'length', text: 'At least 8 characters', met: password.length >= 8 },
    { id: 'uppercase', text: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lowercase', text: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', text: 'At least 1 number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', text: 'At least 1 symbol (@, $, !, %, *, ?, &, #)', met: /[@$!%*?&#]/.test(password) },
  ];

  const resendVerification = async (userEmail) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      if (error) throw error;
      showAlert("Success", "Verification email sent! Please check your inbox and spam folder.");
    } catch (err) {
      showAlert("Error", err.message || "Failed to resend email.");
    }
  };

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
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      showAlert("Validation Error", "Please enter both Email and Password.");
      return;
    }

    if (isSignUp && !name.trim()) {
      showAlert("Validation Error", "Please enter a Display Name.");
      return;
    }

    if (isSignUp) {
      const allRulesMet = passwordRules.every(rule => rule.met);
      if (!allRulesMet) {
        showAlert("Weak Password", "Please fulfill all password security rules before registering.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              display_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        // If email confirmation is required, Supabase returns no session
        if (!data.session) {
          showAlert(
            "Verification Sent",
            "Account created! Please check your email for the verification code.",
            [
              { text: "OK" },
              { text: "Resend Code", onPress: () => resendVerification(cleanEmail) }
            ]
          );
          setPassword('');
          setShowOtpInput(true);
          return;
        }

        // Create local profile
        if (profile) {
          await updateUserProfile(profile.id, { name: name.trim(), email: cleanEmail });
        } else {
          await createUserProfile(name.trim(), cleanEmail);
        }

        // Run initial sync up to register local default categories
        await syncAll();

        showAlert("Success", "Account created successfully! Check your email for verification if required.");
        navigation.goBack();
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            showAlert(
              "Verification Required", 
              "Please verify your email address to sign in.", 
              [
                { text: "Cancel", style: "cancel" },
                { text: "Resend Email", onPress: () => resendVerification(cleanEmail) }
              ]
            );
            return;
          }
          throw error;
        }

        // Get user profile metadata
        const userMeta = data.user?.user_metadata || {};
        const displayName = userMeta.display_name || userMeta.name || 'Cloud User';
        const avatarUrl = userMeta.avatar_url || null;

        // Update local user profile
        if (profile) {
          await updateUserProfile(profile.id, { name: displayName, email: cleanEmail, imageUri: avatarUrl });
        } else {
          await createUserProfile(displayName, cleanEmail, avatarUrl);
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

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      showAlert("Validation Error", "Please enter the OTP code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'signup',
      });

      if (error) throw error;

      // OTP verification successful, create local profile
      if (profile) {
        await updateUserProfile(profile.id, { name: name.trim(), email: cleanEmail });
      } else {
        await createUserProfile(name.trim(), cleanEmail);
      }

      // Run initial sync up
      await syncAll();

      showAlert("Success", "Account verified and created successfully!");
      navigation.goBack();
    } catch (error) {
      showAlert("Verification Error", error.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            {isConfigured && !showOtpInput && (
              <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
                <TouchableOpacity 
                  style={[styles.tab, !isSignUp && { backgroundColor: colors.background }]} 
                  onPress={() => {
                    setIsSignUp(false);
                    setPassword('');
                  }}
                >
                  <Text style={[styles.tabText, { color: !isSignUp ? colors.text : colors.textSecondary }]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, isSignUp && { backgroundColor: colors.background }]} 
                  onPress={() => {
                    setIsSignUp(true);
                    setPassword('');
                  }}
                >
                  <Text style={[styles.tabText, { color: isSignUp ? colors.text : colors.textSecondary }]}>Create Account</Text>
                </TouchableOpacity>
              </View>
            )}

            {(isSignUp || !isConfigured) && !showOtpInput && (
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

            {!showOtpInput && (
              <>
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
              </>
            )}

            {isConfigured && !showOtpInput && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View style={[styles.passwordInputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <TextInput 
                    style={[styles.passwordInput, { color: colors.text }]} 
                    placeholder="••••••••" 
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                {isSignUp && (
                  <View style={[styles.passwordRulesContainer, { backgroundColor: colors.surface }]}>
                    {passwordRules.map((rule) => (
                      <View key={rule.id} style={styles.ruleRow}>
                        <Ionicons 
                          name={rule.met ? "checkmark-circle" : "ellipse-outline"} 
                          size={16} 
                          color={rule.met ? "#2ECC71" : colors.textSecondary} 
                        />
                        <Text style={[styles.ruleText, { color: rule.met ? colors.text : colors.textSecondary }]}>
                          {rule.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {showOtpInput ? (
              <>
                <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Verification Code (OTP)</Text>
                <TextInput 
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, letterSpacing: 5, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }]} 
                  placeholder="12345678" 
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={8}
                  value={otp}
                  onChangeText={setOtp}
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={[styles.button, { opacity: loading ? 0.7 : 1 }]} 
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Account</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
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
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={() => {
              if (showOtpInput) {
                setShowOtpInput(false);
                setOtp('');
              } else {
                navigation.goBack();
              }
            }} disabled={loading}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{showOtpInput ? 'Back to Sign Up' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
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
    marginBottom: 16,
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
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2ECC71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    height: 48,
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
  },
  passwordRulesContainer: {
    marginTop: -4,
    marginBottom: 16,
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleText: {
    fontSize: 11,
    fontWeight: '500',
  }
});

