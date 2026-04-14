import { useCallback, useEffect, useState } from 'react';
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
import { blockUser, getBlockedUserIds, reportUser } from '@/lib/safety';
import { palette } from '@/lib/theme';
import type { Match, Profile, RelationshipStatus } from '@/types';

export default function SearchScreen() {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [relationshipMap, setRelationshipMap] = useState<
    Record<string, RelationshipStatus>
  >({});
  const [matchMap, setMatchMap] = useState<Record<string, Match>>({});
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const loadProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setRelationshipMap({});
      setMatchMap({});
      setBlockedIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const blockedResult = await getBlockedUserIds(user.id);
    const blocked = blockedResult.data ?? [];
    setBlockedIds(blocked);

    const discoverResult = await getDiscoverProfiles(user.id, {
      city: city.trim() || undefined,
      gender: gender.trim() || undefined,
      looking_for: lookingFor.trim() || undefined,
    });

    if (discoverResult.error) {
      setError(discoverResult.error);
      setProfiles([]);
      setRelationshipMap({});
      setMatchMap({});
      setLoading(false);
      return;
    }

    const filteredProfiles = discoverResult.data.filter(
      (profile) => !blocked.includes(profile.user_id)
    );

    setProfiles(filteredProfiles);

    const relationshipResult = await getRelationshipStatuses(
      user.id,
      filteredProfiles.map((profile) => profile.user_id)
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
        const otherUserId =
          match.user_a === user.id ? match.user_b : match.user_a;
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
        return {
          label: 'Respond in Requests',
          disabled: true,
          isFriend: false,
        };
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

    const result = await sendConnectionRequest(
      user.id,
      profile.user_id,
      `Hi ${profile.display_name || ''}, I’d like to connect on Mitrata.`
    );

    setSendingTo(null);

    if (result.error) {
      Alert.alert('Could not send request', result.error);
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
      Alert.alert(
        'Not found',
        'Could not find the friendship record for this user.'
      );
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

  const onBlock = async (profile: Profile) => {
    if (!user) return;

    Alert.alert(
      'Block user',
      `Block ${profile.display_name || 'this user'}? They will disappear from your discover list and won’t be part of your space anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setBlockingUserId(profile.user_id);

            const result = await blockUser(
              user.id,
              profile.user_id,
              'Blocked from discover'
            );

            setBlockingUserId(null);

            if (result.error) {
              Alert.alert('Could not block user', result.error);
              return;
            }

            const existingMatch = matchMap[profile.user_id];
            if (existingMatch) {
              await unfriendMatch(existingMatch.id);
            }

            Alert.alert('Blocked', 'User has been blocked.');
            await loadProfiles();
          },
        },
      ]
    );
  };

  const onReport = async (profile: Profile) => {
    if (!user) return;

    const result = await reportUser(
      user.id,
      profile.user_id,
      'User reported from discover',
      `Reported profile: ${profile.display_name || 'Unknown user'}`
    );

    if (result.error) {
      Alert.alert('Could not report user', result.error);
      return;
    }

    Alert.alert(
      'Reported',
      'Thanks. This report has been recorded for review.'
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
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatar}>✨</Text>
                </View>
              )}

              <View style={styles.profileMeta}>
                <Text style={styles.name}>
                  {profile.display_name || 'Mitrata User'}
                  {profile.age ? `, ${profile.age}` : ''}
                </Text>

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
                    disabled={
                      sendingTo === profile.user_id || relationUi.disabled
                    }
                  >
                    <Text style={styles.connectButtonText}>
                      {sendingTo === profile.user_id
                        ? 'Sending...'
                        : relationUi.label}
                    </Text>
                  </Pressable>
                )}

                <View style={styles.safetyRow}>
                  <Pressable
                    style={[
                      styles.safetyButton,
                      blockingUserId === profile.user_id &&
                        styles.safetyButtonDisabled,
                    ]}
                    onPress={() => void onBlock(profile)}
                    disabled={blockingUserId === profile.user_id}
                  >
                    <Text style={styles.safetyButtonText}>
                      {blockingUserId === profile.user_id
                        ? 'Blocking...'
                        : 'Block'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.safetyButton, styles.reportButton]}
                    onPress={() => void onReport(profile)}
                  >
                    <Text style={styles.safetyButtonText}>Report</Text>
                  </Pressable>
                </View>
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
  safetyRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  safetyButton: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  reportButton: {
    backgroundColor: palette.danger,
  },
  safetyButtonDisabled: {
    opacity: 0.7,
  },
  safetyButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
});