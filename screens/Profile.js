import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUserProfile, updateUserProfile, createUserProfile, deleteUserProfile } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../src/AppContext';
import { supabase, isSupabaseConfigured } from '../src/db/supabase';
import { uploadAvatar, clearLocalData } from '../src/db/syncEngine';

export default function Profile() {
  const { colors, showAlert } = useAppContext();
  const profile = useUserProfile();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setImageUri(profile.imageUri || null);
    }
  }, [profile]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Name cannot be empty.');
      return;
    }
    
    setSaving(true);

    try {
      let finalImageUri = imageUri;
      
      // If user is connected to Supabase Cloud, upload the avatar
      if (isSupabaseConfigured() && profile?.email && profile.email !== 'local@offline.com') {
        if (imageUri && (imageUri.startsWith('file:') || imageUri.startsWith('content:') || !imageUri.startsWith('http'))) {
          const publicUrl = await uploadAvatar(imageUri);
          if (!publicUrl) {
            throw new Error('Failed to upload profile picture to cloud storage.');
          }
          finalImageUri = publicUrl;
          await supabase.auth.updateUser({
            data: {
              display_name: name,
              avatar_url: publicUrl
            }
          });
        } else {
          await supabase.auth.updateUser({
            data: {
              display_name: name
            }
          });
        }
      }

      if (profile) {
        await updateUserProfile(profile.id, { name, imageUri: finalImageUri });
      } else {
        await createUserProfile(name, 'local@offline.com', finalImageUri);
      }
      
      showAlert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage} disabled={saving}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={[styles.profileImage, { borderColor: colors.border }]} />
          ) : (
            <Image source={require('../assets/images/people.png')} style={[styles.profileImage, { borderColor: colors.border }]} />
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="white" />
          </View>
        </TouchableOpacity>

        {profile?.email && profile.email !== 'local@offline.com' && (
          <>
            <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>Cloud Account</Text>
            <Text style={[styles.emailValue, { color: colors.text }]}>{profile.email}</Text>
          </>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textSecondary}
          editable={!saving}
        />

        <TouchableOpacity style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          disabled={saving}
          onPress={async () => {
            showAlert("Log Out", "Are you sure you want to log out? Cloud sessions will close and local transaction cache will be cleared.", [
              { text: "Cancel", style: "cancel" },
              { text: "Log Out", style: "destructive", onPress: async () => {
                  if (isSupabaseConfigured()) {
                    await supabase.auth.signOut();
                  }
                  await clearLocalData();
                  navigation.navigate('Root');
              }}
            ]);
          }}
        >
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
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
    padding: 30,
    alignItems: 'center'
  },
  imageContainer: {
    marginBottom: 30,
    position: 'relative'
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e55a54',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white'
  },
  emailLabel: {
    fontSize: 12,
    marginBottom: 5,
    alignSelf: 'flex-start'
  },
  emailValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    alignSelf: 'flex-start'
  },
  label: {
    fontSize: 12,
    marginBottom: 5,
    alignSelf: 'flex-start'
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#2ECC71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  logoutButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

