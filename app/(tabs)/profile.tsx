import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { pickAvatarImage, uploadAvatar } from '@/lib/avatar';
import { updateMyProfile } from '@/lib/profile';
import { palette } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setAge(profile?.age ? String(profile.age) : '');
    setGender(profile?.gender ?? '');
    setCity(profile?.city ?? '');
    setCountry(profile?.country ?? '');
    setLookingFor(profile?.looking_for ?? '');
    setBio(profile?.bio ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert('Missing name', 'Please enter a display name.');
      return;
    }

    let parsedAge: number | null = null;

    if (age.trim()) {
      parsedAge = Number(age);
      if (!Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 100) {
        Alert.alert('Invalid age', 'Please enter a valid age between 18 and 100.');
        return;
      }
    }

    setSaving(true);

    const { error } = await updateMyProfile(user.id, {
      display_name: displayName.trim(),
      age: parsedAge,
      gender: gender.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      looking_for: lookingFor.trim() || null,
      bio: bio.trim() || null,
    });

    setSaving(false);

    if (error) {
      Alert.alert('Could not save profile', error);
      return;
    }

    await refreshProfile();
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const handleAvatarUpload = async () => {
    if (!user) return;

    setUploadingAvatar(true);

    const picked = await pickAvatarImage();

    if (picked.error) {
      setUploadingAvatar(false);
      Alert.alert('Could not pick image', picked.error);
      return;
    }

    if (!picked.asset) {
      setUploadingAvatar(false);
      return;
    }

    const uploaded = await uploadAvatar(user.id, picked.asset);

    if (uploaded.error || !uploaded.publicUrl) {
      setUploadingAvatar(false);
      Alert.alert('Could not upload avatar', uploaded.error || 'Unknown error');
      return;
    }

    const updated = await updateMyProfile(user.id, {
      avatar_url: uploaded.publicUrl,
    });

    setUploadingAvatar(false);

    if (updated.error) {
      Alert.alert('Could not save avatar', updated.error);
      return;
    }

    await refreshProfile();
    Alert.alert('Updated', 'Your avatar has been updated.');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayTitle =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Mitrata User';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Profile"
        subtitle="Shape your calm digital identity."
      />

      <RetroCard style={styles.profileCard}>
        <Pressable onPress={handleAvatarUpload} disabled={uploadingAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarWrap}>
              <Text style={styles.avatar}>🌙</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={styles.avatarButton}
          onPress={handleAvatarUpload}
          disabled={uploadingAvatar}
        >
          <Text style={styles.avatarButtonText}>
            {uploadingAvatar ? 'Uploading...' : 'Change photo'}
          </Text>
        </Pressable>

        <Text style={styles.name}>{displayTitle}</Text>
        <Text style={styles.email}>{user?.email ?? 'No email found'}</Text>
      </RetroCard>

      <RetroCard>
        <Text style={styles.heading}>Edit profile</Text>

        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor={palette.subtext}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor={palette.subtext}
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
        />

        <TextInput
          style={styles.input}
          placeholder="Gender"
          placeholderTextColor={palette.subtext}
          value={gender}
          onChangeText={setGender}
        />

        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor={palette.subtext}
          value={city}
          onChangeText={setCity}
        />

        <TextInput
          style={styles.input}
          placeholder="Country"
          placeholderTextColor={palette.subtext}
          value={country}
          onChangeText={setCountry}
        />

        <TextInput
          style={styles.input}
          placeholder="Looking for"
          placeholderTextColor={palette.subtext}
          value={lookingFor}
          onChangeText={setLookingFor}
        />

        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Bio"
          placeholderTextColor={palette.subtext}
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save profile'}
          </Text>
        </Pressable>
      </RetroCard>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  profileCard: { alignItems: 'center', gap: 8 },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceStrong,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatar: { fontSize: 40 },
  avatarButton: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
  name: { fontSize: 22, fontWeight: '800', color: palette.text },
  email: { color: palette.subtext },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    color: palette.text,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: palette.accentDeep,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: palette.blush,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  signOutButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
});