import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { upsertMyProfile } from '@/lib/profile';
import { palette } from '@/lib/theme';

export default function OnboardingScreen() {
  const { user, profile, refreshProfile, loading } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [lookingFor, setLookingFor] = useState(profile?.looking_for ?? '');
  const [saving, setSaving] = useState(false);

  if (!loading && !user) {
    return <Redirect href="/(auth)" />;
  }

  if (!loading && profile?.is_profile_complete) {
    return <Redirect href="/(tabs)" />;
  }

  const onSave = async () => {
    if (!user) return;

    if (!displayName.trim() || !age.trim() || !gender.trim() || !city.trim() || !lookingFor.trim()) {
      Alert.alert('Missing details', 'Please fill all required fields.');
      return;
    }

    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      Alert.alert('Invalid age', 'Please enter a valid age between 18 and 100.');
      return;
    }

    setSaving(true);

    const { error } = await upsertMyProfile({
      user_id: user.id,
      display_name: displayName.trim(),
      age: parsedAge,
      gender: gender.trim(),
      city: city.trim(),
      country: country.trim() || null,
      bio: bio.trim() || null,
      looking_for: lookingFor.trim(),
      is_profile_complete: true,
    });

    setSaving(false);

    if (error) {
      Alert.alert('Could not save profile', error);
      return;
    }

    await refreshProfile();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>Set up your calm digital identity before entering Mitrata.</Text>

      <TextInput style={styles.input} placeholder="Display name" value={displayName} onChangeText={setDisplayName} />
      <TextInput style={styles.input} placeholder="Age" keyboardType="number-pad" value={age} onChangeText={setAge} />
      <TextInput style={styles.input} placeholder="Gender" value={gender} onChangeText={setGender} />
      <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />
      <TextInput
        style={styles.input}
        placeholder="Looking for (friendship / dating / both)"
        value={lookingFor}
        onChangeText={setLookingFor}
      />
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Short bio"
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Pressable style={styles.button} onPress={onSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Continue to Mitrata'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 24, gap: 12, paddingBottom: 80 },
  title: { fontSize: 30, fontWeight: '800', color: palette.text },
  subtitle: { color: palette.subtext, marginBottom: 10 },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: palette.accentDeep,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});