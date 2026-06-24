import { Text, View, Image, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../src/AppContext";
import { useUserProfile, resetDatabase, updateUserProfile } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { currency, colors, forceReset, showAlert } = useAppContext();
  const profile = useUserProfile();
  const navigation = useNavigation();

  const handleToggleBiometrics = async (value) => {
    if (!profile) {
      showAlert("Profile Required", "Please configure profile details first before enabling security locks.");
      return;
    }

    try {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          showAlert("Not Supported", "Biometric locks (FaceID/Fingerprint) are not configured or supported on this device.");
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirm identity to enable startup lock",
          fallbackLabel: "Use passcode",
        });

        if (result.success) {
          await updateUserProfile(profile.id, { biometricsEnabled: true });
        }
      } else {
        await updateUserProfile(profile.id, { biometricsEnabled: false });
      }
    } catch (err) {
      showAlert("Error", "Failed to update security setting: " + err.message);
    }
  };

  const settingsOptions = [
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: 'person-outline',
      onPress: () => navigation.navigate('Profile')
    },
    {
      id: 'sync',
      label: profile?.email && profile.email !== 'local@offline.com' ? 'Cloud Sync: Active' : 'Sign In to Cloud',
      icon: profile?.email && profile.email !== 'local@offline.com' ? 'cloud-done-outline' : 'cloud-upload-outline',
      onPress: () => {
        if (profile?.email && profile.email !== 'local@offline.com') {
          showAlert('Cloud Sync', 'Your data is backed up to the cloud.');
        } else {
          navigation.navigate('Login');
        }
      }
    },
    {
      id: 'currency',
      label: `Currency: ${currency}`,
      icon: 'cash-outline',
      onPress: () => navigation.navigate('Currencies')
    },
    {
      id: 'themes',
      label: 'Themes',
      icon: 'color-palette-outline',
      onPress: () => navigation.navigate('ThemeSelection')
    },
    {
      id: 'biometrics',
      label: 'Startup Biometric Lock',
      icon: 'finger-print-outline',
      isSwitch: true,
      switchValue: profile?.biometricsEnabled || false,
      onToggle: handleToggleBiometrics
    },
    {
      id: 'reminders',
      label: 'Reminder Settings',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('Reminders')
    },
    {
      id: 'reset',
      label: 'Reset App Data',
      icon: 'trash-outline',
      onPress: () => {
        showAlert(
          'Reset Data',
          'Are you sure you want to delete all transactions, custom categories, and user profile data? This will restore the database to a fresh state and cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reset Database', 
              style: 'destructive', 
              onPress: async () => {
                try {
                  await resetDatabase();
                  showAlert('Reset Complete', 'All data has been wiped. You can fresh start now!', [
                    { text: 'OK', onPress: () => forceReset() }
                  ]);
                } catch (err) {
                  showAlert('Error', 'Failed to reset database: ' + err.message);
                }
              }
            }
          ]
        );
      }
    }
  ];

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>App preferences & profile</Text>
      </View>
      <View style={styles.profileSection}>
        <View style={[styles.ImageContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {profile?.imageUri ? (
            <Image
              style={styles.image}
              resizeMode="cover"
              source={{ uri: profile.imageUri }}
            />
          ) : (
            <Image
              style={styles.image}
              resizeMode="cover"
              source={require("../assets/images/people.png")}
            />
          )}
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{profile?.name || 'Guest User'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {!profile?.email || profile.email === 'local@offline.com' ? 'Not signed in' : profile.email}
        </Text>
      </View>
      
      <View style={[styles.groupContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {settingsOptions.map((option, idx) => (
          <View key={option.id}>
            {option.isSwitch ? (
              <View style={styles.optionRow}>
                <View style={styles.optionLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                    <Ionicons name={option.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                </View>
                <Switch
                  value={option.switchValue}
                  onValueChange={option.onToggle}
                  trackColor={{ false: colors.border, true: colors.primary + "80" }}
                  thumbColor={option.switchValue ? colors.primary : colors.textSecondary}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.optionRow} onPress={option.onPress}>
                <View style={styles.optionLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
                    <Ionicons name={option.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {idx < settingsOptions.length - 1 && (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  screenHeader: {
    paddingTop: 15,
    paddingBottom: 5,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  ImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  groupContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginLeft: 64,
  },
});

