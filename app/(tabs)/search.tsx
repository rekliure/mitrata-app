import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuth } from '@/context/AuthContext';
import { getDiscoverProfiles } from '@/lib/discover';
import { sendConnectionRequest } from '@/lib/requests';
import { palette } from '@/lib/theme';
import type { Profile } from '@/types';

export default function SearchScreen() {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const loadProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await getDiscoverProfiles(user.id, {
      city: city.trim() || undefined,
      gender: gender.trim() || undefined,
      looking_for: lookingFor.trim() || undefined,
    });

    if (error) {
      setError(error);
      setProfiles([]);
    } else {
      setProfiles(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfiles();
    }, [user?.id])
  );

  const onConnect = async (profile: Profile) => {
    if (!user) return;

    setSendingTo(profile.user_id);

    const { error } = await sendConnectionRequest(
      user.id,
      profile.user_id,
      `Hi ${profile.display_name || ''}, I’d like to connect on Mitrata.`
    );

    setSendingTo(null);

    if (error) {
      Alert.alert('Could not send request', error);
      return;
    }

    Alert.alert('Request sent', `Your request was sent to ${profile.display_name || 'this user'}.`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Discover" subtitle="Find real people with intention, not noise." />

      <RetroCard>
        <Text style={styles.filterTitle}>Filters</Text>

        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor={palette.subtext}
          value={city}
          onChangeText={setCity}
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
          placeholder="Looking for (friendship / dating / both)"
          placeholderTextColor={palette.subtext}
          value={lookingFor}
          onChangeText={setLookingFor}
        />

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => void loadProfiles()}>
            <Text style={styles.buttonText}>Apply filters</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              setCity('');
              setGender('');
              setLookingFor('');
              setTimeout(() => void loadProfiles(), 0);
            }}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Reset</Text>
          </Pressable>
        </View>
      </RetroCard>

      {!loading && !error ? (
        <Text style={styles.resultCount}>
          {profiles.length} profile{profiles.length === 1 ? '' : 's'} found
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accentDeep} />
        </View>
      ) : error ? (
        <RetroCard>
          <Text style={styles.errorText}>{error}</Text>
        </RetroCard>
      ) : profiles.length === 0 ? (
        <RetroCard>
          <Text style={styles.emptyTitle}>No profiles found</Text>
          <Text style={styles.emptyText}>Try changing your filters and search again.</Text>
        </RetroCard>
      ) : (
        profiles.map((profile) => (
          <RetroCard key={profile.id} style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatar}>✨</Text>
            </View>

            <View style={styles.profileMeta}>
              <Text style={styles.name}>
                {profile.display_name || 'Mitrata User'}
                {profile.age ? `, ${profile.age}` : ''}
              </Text>

              <Text style={styles.subline}>
                {[profile.city, profile.country].filter(Boolean).join(', ') || 'Location not added'}
              </Text>

              <Text style={styles.subline}>
                {(profile.gender || 'Gender not added') +
                  ' • ' +
                  (profile.looking_for || 'Intent not added')}
              </Text>

              <Text style={styles.bio}>{profile.bio || 'No bio added yet.'}</Text>

              <Pressable
                style={styles.connectButton}
                onPress={() => void onConnect(profile)}
                disabled={sendingTo === profile.user_id}
              >
                <Text style={styles.connectButtonText}>
                  {sendingTo === profile.user_id ? 'Sending...' : 'Connect'}
                </Text>
              </Pressable>
            </View>
          </RetroCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  filterTitle: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 10 },
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  button: {
    flex: 1,
    backgroundColor: palette.accentDeep,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { backgroundColor: palette.surfaceStrong },
  secondaryButtonText: { color: palette.text },
  resultCount: { color: palette.subtext, fontWeight: '600', paddingHorizontal: 4 },
  center: { paddingVertical: 30, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#B00020', fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyText: { color: palette.subtext, lineHeight: 22 },
  profileCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 16 },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { fontSize: 24 },
  profileMeta: { flex: 1, gap: 6 },
  name: { fontSize: 18, fontWeight: '800', color: palette.text },
  subline: { color: palette.subtext },
  bio: { color: palette.text, lineHeight: 21, marginTop: 4 },
  connectButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: palette.blush,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  connectButtonText: { color: palette.text, fontWeight: '700' },
});