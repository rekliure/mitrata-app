import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuth } from '@/context/AuthContext';
import {
  createMatch,
  getIncomingRequests,
  getOutgoingRequests,
  updateRequestStatus,
} from '@/lib/requests';
import { getBlockedRelationships, getProfilesByUserIds } from '@/lib/social';
import { palette } from '@/lib/theme';
import type { ConnectionRequest, Profile } from '@/types';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const [incomingResult, outgoingResult, blockedResult] = await Promise.all([
      getIncomingRequests(user.id),
      getOutgoingRequests(user.id),
      getBlockedRelationships(user.id),
    ]);

    const blockedIds = new Set(blockedResult.data ?? []);

    const safeIncoming = incomingResult.data.filter(
      (r) => !blockedIds.has(r.sender_user_id)
    );
    const safeOutgoing = outgoingResult.data.filter(
      (r) => !blockedIds.has(r.receiver_user_id)
    );

    setIncoming(safeIncoming);
    setOutgoing(safeOutgoing);

    const relatedIds = [
      ...safeIncoming.map((r) => r.sender_user_id),
      ...safeOutgoing.map((r) => r.receiver_user_id),
    ];

    const profilesResult = await getProfilesByUserIds(relatedIds);

    if (!profilesResult.error) {
      const map: Record<string, Profile> = {};
      for (const profile of profilesResult.data) {
        map[profile.user_id] = profile;
      }
      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests])
  );

  const onAccept = async (request: ConnectionRequest) => {
    const updated = await updateRequestStatus(request.id, 'accepted');
    if (updated.error) {
      Alert.alert('Could not accept', updated.error);
      return;
    }

    const matched = await createMatch(
      request.sender_user_id,
      request.receiver_user_id
    );

    if (matched.error) {
      Alert.alert('Accepted, but match failed', matched.error);
      return;
    }

    Alert.alert('Accepted', 'Connection accepted successfully.');
    await loadRequests();
  };

  const onDecline = async (request: ConnectionRequest) => {
    const updated = await updateRequestStatus(request.id, 'declined');
    if (updated.error) {
      Alert.alert('Could not decline', updated.error);
      return;
    }

    await loadRequests();
  };

  const incomingCount = useMemo(() => incoming.length, [incoming]);
  const outgoingCount = useMemo(() => outgoing.length, [outgoing]);

  const Avatar = ({ profile }: { profile?: Profile }) => {
    if (profile?.avatar_url) {
      return <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />;
    }

    return (
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>✨</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Requests"
        subtitle="Manage incoming and outgoing connection requests."
      />

      {!loading ? (
        <Text style={styles.summary}>
          {incomingCount} incoming • {outgoingCount} outgoing
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accentDeep} />
        </View>
      ) : (
        <>
          <RetroCard>
            <Text style={styles.heading}>Incoming</Text>
            {incoming.length === 0 ? (
              <Text style={styles.emptyText}>No incoming requests.</Text>
            ) : (
              incoming.map((request) => {
                const sender = profilesMap[request.sender_user_id];

                return (
                  <View key={request.id} style={styles.requestItem}>
                    <View style={styles.requestTop}>
                      <Avatar profile={sender} />

                      <View style={styles.requestBody}>
                        <Text style={styles.requestName}>
                          {sender?.display_name || 'Unknown user'}
                        </Text>
                        <Text style={styles.requestMeta}>
                          {[sender?.age ? `${sender.age}` : null, sender?.city]
                            .filter(Boolean)
                            .join(' • ') || 'Profile details unavailable'}
                        </Text>
                        <Text style={styles.requestMessage}>
                          {request.intro_message || 'No intro message'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <Pressable
                        style={styles.acceptBtn}
                        onPress={() => void onAccept(request)}
                      >
                        <Text style={styles.btnText}>Accept</Text>
                      </Pressable>

                      <Pressable
                        style={styles.declineBtn}
                        onPress={() => void onDecline(request)}
                      >
                        <Text style={styles.btnText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </RetroCard>

          <RetroCard>
            <Text style={styles.heading}>Outgoing</Text>
            {outgoing.length === 0 ? (
              <Text style={styles.emptyText}>No outgoing requests.</Text>
            ) : (
              outgoing.map((request) => {
                const receiver = profilesMap[request.receiver_user_id];

                return (
                  <View key={request.id} style={styles.requestItem}>
                    <View style={styles.requestTop}>
                      <Avatar profile={receiver} />

                      <View style={styles.requestBody}>
                        <Text style={styles.requestName}>
                          {receiver?.display_name || 'Unknown user'}
                        </Text>
                        <Text style={styles.requestMeta}>
                          {[receiver?.age ? `${receiver.age}` : null, receiver?.city]
                            .filter(Boolean)
                            .join(' • ') || 'Profile details unavailable'}
                        </Text>
                        <Text style={styles.requestMessage}>
                          {request.intro_message || 'No intro message'}
                        </Text>
                        <Text style={styles.pending}>Pending</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </RetroCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  center: { paddingVertical: 30, alignItems: 'center', justifyContent: 'center' },
  summary: { color: palette.subtext, fontWeight: '600', paddingHorizontal: 4 },
  heading: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 10 },
  emptyText: { color: palette.subtext },
  requestItem: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
    marginTop: 12,
    gap: 10,
  },
  requestTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  requestBody: {
    flex: 1,
    gap: 4,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 22,
  },
  requestName: { color: palette.text, fontWeight: '800', fontSize: 18 },
  requestMeta: { color: palette.subtext },
  requestMessage: { color: palette.text, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  acceptBtn: {
    backgroundColor: palette.accentDeep,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  declineBtn: {
    backgroundColor: palette.blush,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  pending: { color: palette.subtext, fontStyle: 'italic', marginTop: 4 },
});