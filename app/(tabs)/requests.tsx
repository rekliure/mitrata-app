import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { palette } from '@/lib/theme';
import type { ConnectionRequest } from '@/types';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user) return;

    setLoading(true);

    const [incomingResult, outgoingResult] = await Promise.all([
      getIncomingRequests(user.id),
      getOutgoingRequests(user.id),
    ]);

    setIncoming(incomingResult.data);
    setOutgoing(outgoingResult.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [user?.id])
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Requests"
        subtitle="Manage incoming and outgoing connection requests."
      />

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
              incoming.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <Text style={styles.requestText}>
                    From: {request.sender_user_id}
                  </Text>
                  <Text style={styles.requestMessage}>
                    {request.intro_message || 'No intro message'}
                  </Text>

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
              ))
            )}
          </RetroCard>

          <RetroCard>
            <Text style={styles.heading}>Outgoing</Text>
            {outgoing.length === 0 ? (
              <Text style={styles.emptyText}>No outgoing requests.</Text>
            ) : (
              outgoing.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <Text style={styles.requestText}>
                    To: {request.receiver_user_id}
                  </Text>
                  <Text style={styles.requestMessage}>
                    {request.intro_message || 'No intro message'}
                  </Text>
                  <Text style={styles.pending}>Pending</Text>
                </View>
              ))
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
  heading: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 10 },
  emptyText: { color: palette.subtext },
  requestItem: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
    marginTop: 12,
    gap: 6,
  },
  requestText: { color: palette.text, fontWeight: '600' },
  requestMessage: { color: palette.subtext, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
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