import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUserProfile, updateUserProfile, createUserProfile, deleteUserProfile } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../src/AppContext';

export default function Profile() {
  const { colors, showAlert } = useAppContext();
  const profile = useUserProfile();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState(null);

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
    
    if (profile) {
      await updateUserProfile(profile.id, { name, imageUri });
    } else {
      await createUserProfile(name, 'local@offline.com', imageUri);
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
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
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            showAlert("Log Out", "Are you sure you want to log out? Local profile data will be cleared.", [
              { text: "Cancel", style: "cancel" },
              { text: "Log Out", style: "destructive", onPress: async () => {
                  await deleteUserProfile();
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

