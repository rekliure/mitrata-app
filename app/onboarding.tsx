import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { updateMyProfile } from '@/lib/profile';
import { palette } from '@/lib/theme';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LOOKING_FOR_OPTIONS = ['Friendship', 'Dating', 'Both'];

export default function OnboardingScreen() {
  const { user, profile, refreshProfile, loading } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? 'India');
  const [lookingFor, setLookingFor] = useState(profile?.looking_for ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [submitting, setSubmitting] = useState(false);

  const alreadyComplete = useMemo(
    () => !!profile?.is_profile_complete,
    [profile?.is_profile_complete]
  );

  if (!loading && !user) {
    return <Redirect href="/(auth)" />;
  }

  if (!loading && alreadyComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSubmit = async () => {
    if (!user) return;

    const cleanName = displayName.trim();
    const cleanCity = city.trim();
    const cleanCountry = country.trim();
    const cleanBio = bio.trim();

    if (!cleanName) {
      Alert.alert('Missing name', 'Please enter your display name.');
      return;
    }

    if (!age.trim()) {
      Alert.alert('Missing age', 'Please enter your age.');
      return;
    }

    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      Alert.alert('Invalid age', 'Please enter a valid age between 18 and 100.');
      return;
    }

    if (!gender) {
      Alert.alert('Missing gender', 'Please choose a gender option.');
      return;
    }

    if (!cleanCity) {
      Alert.alert('Missing city', 'Please enter your city.');
      return;
    }

    if (!cleanCountry) {
      Alert.alert('Missing country', 'Please enter your country.');
      return;
    }

    if (!lookingFor) {
      Alert.alert('Missing preference', 'Please choose what you are looking for.');
      return;
    }

    if (!cleanBio) {
      Alert.alert('Missing bio', 'Please add a short bio.');
      return;
    }

    setSubmitting(true);

    const result = await updateMyProfile(user.id, {
      display_name: cleanName,
      age: parsedAge,
      gender,
      city: cleanCity,
      country: cleanCountry,
      looking_for: lookingFor,
      bio: cleanBio,
      is_profile_complete: true,
      is_visible: true,
    });

    setSubmitting(false);

    if (result.error) {
      Alert.alert('Could not complete onboarding', result.error);
      return;
    }

    await refreshProfile();
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Welcome to Mitrata"
        subtitle="Set up your profile so the right people can find you."
      />

      <RetroCard>
        <Text style={styles.heading}>Basic identity</Text>

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
      </RetroCard>

      <RetroCard>
        <Text style={styles.heading}>Choose your profile options</Text>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.choiceWrap}>
          {GENDER_OPTIONS.map((option) => {
            const active = gender === option;
            return (
              <Pressable
                key={option}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => setGender(option)}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    active && styles.choiceChipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Looking for</Text>
        <View style={styles.choiceWrap}>
          {LOOKING_FOR_OPTIONS.map((option) => {
            const active = lookingFor === option;
            return (
              <Pressable
                key={option}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => setLookingFor(option)}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    active && styles.choiceChipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </RetroCard>

      <RetroCard>
        <Text style={styles.heading}>Location and bio</Text>

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
          style={[styles.input, styles.bioInput]}
          placeholder="Short bio"
          placeholderTextColor={palette.subtext}
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </RetroCard>

      <Pressable
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Saving...' : 'Complete profile'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 80 },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginTop: 4,
    marginBottom: 8,
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
    minHeight: 110,
    textAlignVertical: 'top',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  choiceChip: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceChipActive: {
    backgroundColor: palette.accentDeep,
  },
  choiceChipText: {
    color: palette.text,
    fontWeight: '700',
  },
  choiceChipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: palette.accentDeep,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});