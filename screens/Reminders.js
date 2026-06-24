import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../src/AppContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Reminders() {
  const { theme, colors, showAlert } = useAppContext();
  const navigation = useNavigation();
  const [isReminderSet, setIsReminderSet] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        showAlert('Permission required', 'Please enable notifications in your phone settings.');
      }
    }
  };

  const scheduleDailyReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Schedule for 8:00 PM daily
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Log Expenses! 💰",
        body: "Don't forget to track your spending today to stay on top of your budget.",
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });

    setIsReminderSet(true);
    showAlert("Reminder Set!", "You will be reminded daily at 8:00 PM.");
  };

  const cancelReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setIsReminderSet(false);
    showAlert("Reminder Cancelled", "Your daily reminder has been turned off.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reminders</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="notifications-outline" size={80} color="#e55a54" style={{ marginBottom: 20 }} />
        <Text style={[styles.title, { color: colors.text }]}>Daily Reminder</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Set a daily reminder at 8:00 PM to log your daily expenses.
        </Text>

        {isReminderSet ? (
          <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={cancelReminder}>
            <Text style={styles.buttonText}>Cancel Reminder</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.setBtn]} onPress={scheduleDailyReminder}>
            <Text style={styles.buttonText}>Enable Daily Reminder</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  setBtn: {
    backgroundColor: '#2ECC71',
  },
  cancelBtn: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
