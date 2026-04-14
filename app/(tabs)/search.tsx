import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { getMyMatches } from '@/lib/messages';
import { unfriendMatch } from '@/lib/matches';
import {
  getRelationshipStatuses,
  sendConnectionRequest,
} from '@/lib/requests';
import { palette } from '@/lib/theme';
import type { Match, Profile, RelationshipStatus } from '@/types';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LOOKING_FOR_OPTIONS = ['Friendship', 'Dating', 'Both'];
const AGE_RANGES = [
  { label: '18-24', min: 18, max: 24 },
  { label: '25-30', min: 25, max: 30 },
  { label: '31-40', min: 31, max: 40 },
  { label: '41+', min: 41, max: 100 },
];
const CITY_CHIPS = ['Delhi', 'Mumbai', 'Bangalore', 'Kangra', 'Chandigarh'];

export default function SearchScreen() {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [cityInput, setCityInput] = useState('');
  const [selectedCityChip, setSelectedCityChip] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedLookingFor, setSelectedLookingFor] = useState<string>('');
  const [selectedAgeLabel, setSelectedAgeLabel] = useState<string>('');
  const [minAge, setMinAge] = useState<number | undefined>(undefined);
  const [maxAge, setMaxAge] = useState<number | undefined>(undefined);

  const [error, setError] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const [relationshipMap, setRelationshipMap] = useState<
    Record<string, RelationshipStatus>
  >({});
  const [matchMap, setMatchMap] = useState<Record<string, Match>>({});

  const resolvedCity = useMemo(() => {
    const typed = cityInput.trim();
    if (typed) return typed;
    return selectedCityChip ?? '';
  }, [cityInput, selectedCityChip]);

  const loadProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setRelationshipMap({});
      setMatchMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await getDiscoverProfiles(user.id, {
      city: resolvedCity || undefined,
      gender: selectedGender || undefined,
      looking_for: selectedLookingFor || undefined,
      min_age: minAge,
      max_age: maxAge,
    });

    if (error) {
      setError(error);
      setProfiles([]);
      setRelationshipMap({});
      setMatchMap({});
      setLoading(false);
      return;
    }

    setProfiles(data);

    const relationshipResult = await getRelationshipStatuses(
      user.id,
      data.map((profile) => profile.user_id)
    );

    if (relationshipResult.error) {
      console.log('relationship status error:', relationshipResult.error);
      setRelationshipMap({});
    } else {
      setRelationshipMap(relationshipResult.data);
    }

    const matchesResult = await getMyMatches(user.id);

    if (!matchesResult.error) {
      const map: Record<string, Match> = {};
      for (const match of matchesResult.data) {
        const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
        map[otherUserId] = match;
      }
      setMatchMap(map);
    } else {
      setMatchMap({});
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

  const getRelationshipLabel = (profileUserId: string) => {
    const relation = relationshipMap[profileUserId];

    if (!relation) {
      return { label: 'Connect', disabled: false, isFriend: false };
    }

    switch (relation.state) {
      case 'friend':
        return { label: 'Mitra', disabled: true, isFriend: true };
      case 'incoming_request':
        return { label: 'Respond in Requests', disabled: true, isFriend: false };
      case 'outgoing_request':
        return { label: 'Request sent', disabled: true, isFriend: false };
      case 'declined_once':
        return { label: 'Declined 1/3', disabled: false, isFriend: false };
      case 'declined_twice':
        return { label: 'Declined 2/3', disabled: false, isFriend: false };
      case 'declined_limit_reached':
        return { label: 'Limit reached', disabled: true, isFriend: false };
      default:
        return { label: 'Connect', disabled: false, isFriend: false };
    }
  };

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

    Alert.alert(
      'Request sent',
      `Your request was sent to ${profile.display_name || 'this user'}.`
    );

    await loadProfiles();
  };

  const onUnfriend = async (profile: Profile) => {
    if (!user) return;

    const match = matchMap[profile.user_id];

    if (!match) {
      Alert.alert('Not found', 'Could not find the friendship record for this user.');
      return;
    }

    Alert.alert(
      'Remove Mitra',
      `Remove ${profile.display_name || 'this Mitra'} from your Mitra list? This will also delete chat history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingUserId(profile.user_id);

            const result = await unfriendMatch(match.id);

            setRemovingUserId(null);

            if (result.error) {
              Alert.alert('Could not remove Mitra', result.error);
              return;
            }

            Alert.alert(
              'Removed',
              `${profile.display_name || 'This user'} is no longer your Mitra.`
            );
            await loadProfiles();
          },
        },
      ]
    );
  };

  const resetFilters = async () => {
    setCityInput('');
    setSelectedCityChip(null);
    setSelectedGender('');
    setSelectedLookingFor('');
    setSelectedAgeLabel('');
    setMinAge(undefined);
    setMaxAge(undefined);
    setTimeout(() => {
      void loadProfiles();
    }, 0);
  };

  const pickAgeRange = (label: string, min: number, max: number) => {
    if (selectedAgeLabel === label) {
      setSelectedAgeLabel('');
      setMinAge(undefined);
      setMaxAge(undefined);
      return;
    }

    setSelectedAgeLabel(label);
    setMinAge(min);
    setMaxAge(max);
  };

  const Avatar = ({ profile }: { profile: Profile }) => {
    if (profile.avatar_url) {
      return (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
      );
    }

    return (
      <View style={styles.avatarWrap}>
        <Text style={styles.avatar}>✨</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Discover"
        subtitle="Find real people with intention, not noise."
      />

      <RetroCard>
        <Text style={styles.filterTitle}>Filters</Text>

        <Text style={styles.filterLabel}>Quick city picks</Text>
        <View style={styles.chipWrap}>
          {CITY_CHIPS.map((city) => {
            const active = selectedCityChip === city && !cityInput.trim();
            return (
              <Pressable
                key={city}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setCityInput('');
                  setSelectedCityChip(active ? null : city);
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {city}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Or type a city"
          placeholderTextColor={palette.subtext}
          value={cityInput}
          onChangeText={(text) => {
            setCityInput(text);
            if (text.trim()) {
              setSelectedCityChip(null);
            }
          }}
        />

        <Text style={styles.filterLabel}>Gender</Text>
        <View style={styles.chipWrap}>
          {GENDER_OPTIONS.map((option) => {
            const active = selectedGender === option;
            return (
              <Pressable
                key={option}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedGender(active ? '' : option)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.filterLabel}>Looking for</Text>
        <View style={styles.chipWrap}>
          {LOOKING_FOR_OPTIONS.map((option) => {
            const active = selectedLookingFor === option;
            return (
              <Pressable
                key={option}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedLookingFor(active ? '' : option)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.filterLabel}>Age range</Text>
        <View style={styles.chipWrap}>
          {AGE_RANGES.map((range) => {
            const active = selectedAgeLabel === range.label;
            return (
              <Pressable
                key={range.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => pickAgeRange(range.label, range.min, range.max)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => void loadProfiles()}>
            <Text style={styles.buttonText}>Apply filters</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => void resetFilters()}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Reset
            </Text>
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
          <Text style={styles.emptyText}>
            Try changing your filters and search again.
          </Text>
        </RetroCard>
      ) : (
        profiles.map((profile) => {
          const relationUi = getRelationshipLabel(profile.user_id);

          return (
            <RetroCard key={profile.id} style={styles.profileCard}>
              <Avatar profile={profile} />

              <View style={styles.profileMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>
                    {profile.display_name || 'Mitrata User'}
                    {profile.age ? `, ${profile.age}` : ''}
                  </Text>
                  {profile.is_verified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.subline}>
                  {[profile.city, profile.country].filter(Boolean).join(', ') ||
                    'Location not added'}
                </Text>

                <Text style={styles.subline}>
                  {(profile.gender || 'Gender not added') +
                    ' • ' +
                    (profile.looking_for || 'Intent not added')}
                </Text>

                <Text style={styles.bio}>
                  {profile.bio || 'No bio added yet.'}
                </Text>

                {relationUi.isFriend ? (
                  <View style={styles.friendActions}>
                    <View style={styles.mitraBadge}>
                      <Text style={styles.mitraBadgeText}>Mitra</Text>
                    </View>

                    <Pressable
                      style={[
                        styles.unfriendButton,
                        removingUserId === profile.user_id &&
                          styles.unfriendButtonDisabled,
                      ]}
                      onPress={() => void onUnfriend(profile)}
                      disabled={removingUserId === profile.user_id}
                    >
                      <Text style={styles.unfriendButtonText}>
                        {removingUserId === profile.user_id
                          ? 'Removing...'
                          : 'Unfriend'}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[
                      styles.connectButton,
                      relationUi.disabled && styles.connectButtonDisabled,
                    ]}
                    onPress={() => void onConnect(profile)}
                    disabled={sendingTo === profile.user_id || relationUi.disabled}
                  >
                    <Text style={styles.connectButtonText}>
                      {sendingTo === profile.user_id
                        ? 'Sending...'
                        : relationUi.label}
                    </Text>
                  </Pressable>
                )}
              </View>
            </RetroCard>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 10,
  },
  filterLabel: {
    color: palette.text,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 2,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    color: palette.text,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: palette.accentDeep,
  },
  chipText: {
    color: palette.text,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fff',
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
  resultCount: {
    color: palette.subtext,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  center: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: '#B00020', fontWeight: '600' },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 6,
  },
  emptyText: { color: palette.subtext, lineHeight: 22 },
  profileCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: 16,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatar: { fontSize: 24 },
  profileMeta: { flex: 1, gap: 6 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: { fontSize: 18, fontWeight: '800', color: palette.text },
  verifiedBadge: {
    backgroundColor: palette.accentDeep,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
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
  connectButtonDisabled: {
    opacity: 0.65,
  },
  connectButtonText: { color: palette.text, fontWeight: '700' },
  friendActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  mitraBadge: {
    backgroundColor: palette.accentDeep,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mitraBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  unfriendButton: {
    backgroundColor: palette.danger,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  unfriendButtonDisabled: {
    opacity: 0.7,
  },
  unfriendButtonText: {
    color: palette.white,
    fontWeight: '700',
  },
});