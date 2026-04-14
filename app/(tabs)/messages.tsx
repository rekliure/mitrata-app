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
import { getMessagesForMatch, getMyMatches, sendMessage } from '@/lib/messages';
import { palette } from '@/lib/theme';
import type { Match, Message } from '@/types';

export default function MessagesScreen() {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMatches = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await getMyMatches(user.id);

    if (error) {
      Alert.alert('Could not load matches', error);
      setMatches([]);
      setLoading(false);
      return;
    }

    setMatches(data);

    if (data.length > 0) {
      const first = data[0];
      setSelectedMatch(first);

      const messagesResult = await getMessagesForMatch(first.id);
      if (messagesResult.error) {
        Alert.alert('Could not load messages', messagesResult.error);
        setMessages([]);
      } else {
        setMessages(messagesResult.data);
      }
    } else {
      setSelectedMatch(null);
      setMessages([]);
    }

    setLoading(false);
  };

  const loadMessages = async (matchId: string) => {
    const { data, error } = await getMessagesForMatch(matchId);

    if (error) {
      Alert.alert('Could not load messages', error);
      setMessages([]);
      return;
    }

    setMessages(data);
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMatches();
    }, [user?.id])
  );

  const onSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    await loadMessages(match.id);
  };

  const onSend = async () => {
    if (!user || !selectedMatch) return;

    setSending(true);

    const result = await sendMessage(selectedMatch.id, user.id, draft);

    setSending(false);

    if (result.error) {
      Alert.alert('Could not send message', result.error);
      return;
    }

    setDraft('');
    await loadMessages(selectedMatch.id);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Messages"
        subtitle="Talk to people you have already matched with."
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accentDeep} />
        </View>
      ) : matches.length === 0 ? (
        <RetroCard>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            Accept a connection request first to start chatting.
          </Text>
        </RetroCard>
      ) : (
        <>
          <RetroCard>
            <Text style={styles.heading}>Your matches</Text>
            <View style={styles.matchList}>
              {matches.map((match) => (
                <Pressable
                  key={match.id}
                  style={[
                    styles.matchChip,
                    selectedMatch?.id === match.id && styles.matchChipActive,
                  ]}
                  onPress={() => void onSelectMatch(match)}
                >
                  <Text
                    style={[
                      styles.matchChipText,
                      selectedMatch?.id === match.id && styles.matchChipTextActive,
                    ]}
                  >
                    {match.id.slice(0, 8)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </RetroCard>

          <RetroCard>
            <Text style={styles.heading}>Conversation</Text>

            {messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet. Start the conversation.</Text>
            ) : (
              messages.map((message) => {
                const mine = message.sender_user_id === user?.id;

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      mine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        mine ? styles.myBubbleText : styles.theirBubbleText,
                      ]}
                    >
                      {message.body}
                    </Text>
                  </View>
                );
              })
            )}

            <View style={styles.composeBox}>
              <TextInput
                style={styles.input}
                placeholder="Write a message..."
                placeholderTextColor={palette.subtext}
                value={draft}
                onChangeText={setDraft}
              />
              <Pressable style={styles.sendButton} onPress={() => void onSend()} disabled={sending}>
                <Text style={styles.sendButtonText}>
                  {sending ? 'Sending...' : 'Send'}
                </Text>
              </Pressable>
            </View>
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
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyText: { color: palette.subtext, lineHeight: 22 },
  matchList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  matchChip: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  matchChipActive: {
    backgroundColor: palette.accentDeep,
  },
  matchChipText: { color: palette.text, fontWeight: '700' },
  matchChipTextActive: { color: '#fff' },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: palette.accentDeep,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surfaceStrong,
  },
  messageText: { lineHeight: 20 },
  myBubbleText: { color: '#fff' },
  theirBubbleText: { color: palette.text },
  composeBox: {
    marginTop: 14,
    gap: 10,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.text,
  },
  sendButton: {
    backgroundColor: palette.blush,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  sendButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
});