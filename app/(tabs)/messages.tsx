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
import {
  getMessagesForMatch,
  getMyMatches,
  markMessagesAsRead,
  sendMessage,
  subscribeToMatchMessages,
} from '@/lib/messages';
import { unfriendMatch } from '@/lib/matches';
import { getProfilesByUserIds } from '@/lib/social';
import { palette } from '@/lib/theme';
import type { Match, Message, Profile } from '@/types';

export default function MessagesScreen() {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [removing, setRemoving] = useState(false);

  const loadMessages = async (matchId: string, markRead = false) => {
    if (markRead && user) {
      const readResult = await markMessagesAsRead(matchId, user.id);
      if (readResult.error) {
        console.log('markMessagesAsRead error:', readResult.error);
      }
    }

    const result = await getMessagesForMatch(matchId);

    if (result.error) {
      Alert.alert('Could not load messages', result.error);
      setMessages([]);
      return;
    }

    setMessages(result.data);
  };

  const loadMatches = async () => {
    if (!user) return;

    setLoading(true);

    const result = await getMyMatches(user.id);

    if (result.error) {
      Alert.alert('Could not load matches', result.error);
      setMatches([]);
      setMessages([]);
      setSelectedMatch(null);
      setLoading(false);
      return;
    }

    setMatches(result.data);

    const otherUserIds = result.data.map((match) =>
      match.user_a === user.id ? match.user_b : match.user_a
    );

    const profilesResult = await getProfilesByUserIds(otherUserIds);

    if (!profilesResult.error) {
      const map: Record<string, Profile> = {};
      for (const profile of profilesResult.data) {
        map[profile.user_id] = profile;
      }
      setProfilesMap(map);
    }

    if (result.data.length > 0) {
      const currentStillExists =
        selectedMatch && result.data.find((m) => m.id === selectedMatch.id);

      const matchToOpen = currentStillExists ?? result.data[0];

      setSelectedMatch(matchToOpen);
      await loadMessages(matchToOpen.id, true);
    } else {
      setSelectedMatch(null);
      setMessages([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMatches();
    }, [user?.id])
  );

  useEffect(() => {
    if (!selectedMatch || !user) return;

    const unsubscribe = subscribeToMatchMessages(selectedMatch.id, () => {
      void loadMessages(selectedMatch.id, true);
    });

    return unsubscribe;
  }, [selectedMatch?.id, user?.id]);

  const onSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    await loadMessages(match.id, true);
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
    await loadMessages(selectedMatch.id, true);
  };

  const onUnfriend = async () => {
    if (!selectedMatch) return;

    Alert.alert(
      'Remove Mitra',
      'This will remove the friendship and delete the chat history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            const result = await unfriendMatch(selectedMatch.id);
            setRemoving(false);

            if (result.error) {
              Alert.alert('Could not remove Mitra', result.error);
              return;
            }

            Alert.alert('Removed', 'This Mitra has been removed.');
            await loadMatches();
          },
        },
      ]
    );
  };

  const selectedOtherUserId = useMemo(() => {
    if (!selectedMatch || !user) return null;
    return selectedMatch.user_a === user.id
      ? selectedMatch.user_b
      : selectedMatch.user_a;
  }, [selectedMatch, user]);

  const selectedProfile = selectedOtherUserId
    ? profilesMap[selectedOtherUserId]
    : null;

  const HeaderAvatar = () => {
    if (selectedProfile?.avatar_url) {
      return (
        <Image
          source={{ uri: selectedProfile.avatar_url }}
          style={styles.headerAvatarImage}
        />
      );
    }

    return (
      <View style={styles.headerAvatarWrap}>
        <Text style={styles.headerAvatarText}>✨</Text>
      </View>
    );
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
              {matches.map((match) => {
                const otherUserId =
                  match.user_a === user?.id ? match.user_b : match.user_a;
                const otherProfile = profilesMap[otherUserId];

                return (
                  <Pressable
                    key={match.id}
                    style={[
                      styles.matchChip,
                      selectedMatch?.id === match.id && styles.matchChipActive,
                    ]}
                    onPress={() => void onSelectMatch(match)}
                  >
                    {otherProfile?.avatar_url ? (
                      <Image
                        source={{ uri: otherProfile.avatar_url }}
                        style={styles.matchChipAvatar}
                      />
                    ) : (
                      <View style={styles.matchChipAvatarFallback}>
                        <Text style={styles.matchChipAvatarText}>✨</Text>
                      </View>
                    )}

                    <Text
                      style={[
                        styles.matchChipText,
                        selectedMatch?.id === match.id &&
                          styles.matchChipTextActive,
                      ]}
                    >
                      {otherProfile?.display_name || 'Match'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </RetroCard>

          <RetroCard>
            <View style={styles.conversationHeader}>
              <Text style={styles.heading}>Conversation</Text>

              {selectedMatch ? (
                <Pressable
                  style={[
                    styles.removeButton,
                    removing && styles.removeButtonDisabled,
                  ]}
                  onPress={() => void onUnfriend()}
                  disabled={removing}
                >
                  <Text style={styles.removeButtonText}>
                    {removing ? 'Removing...' : 'Unfriend'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {selectedProfile ? (
              <View style={styles.profileHeader}>
                <HeaderAvatar />

                <View style={styles.profileHeaderBody}>
                  <Text style={styles.profileName}>
                    {selectedProfile.display_name || 'Unknown user'}
                  </Text>
                  <Text style={styles.profileMeta}>
                    {[
                      selectedProfile.age ? `${selectedProfile.age}` : null,
                      selectedProfile.city,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
              </View>
            ) : null}

            {messages.length === 0 ? (
              <Text style={styles.emptyText}>
                No messages yet. Start the conversation.
              </Text>
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

                    {!mine && !message.read_at ? (
                      <Text style={styles.unreadLabel}>New</Text>
                    ) : null}
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
              <Pressable
                style={styles.sendButton}
                onPress={() => void onSend()}
                disabled={sending}
              >
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
  center: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 6,
  },
  emptyText: { color: palette.subtext, lineHeight: 22 },
  matchList: { gap: 10 },
  matchChip: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchChipActive: {
    backgroundColor: palette.accentDeep,
  },
  matchChipAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  matchChipAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchChipAvatarText: {
    fontSize: 15,
  },
  matchChipText: { color: palette.text, fontWeight: '700' },
  matchChipTextActive: { color: '#fff' },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: palette.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeButtonDisabled: {
    opacity: 0.7,
  },
  removeButtonText: {
    color: palette.white,
    fontWeight: '700',
  },
  profileHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  profileHeaderBody: {
    flex: 1,
  },
  headerAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  headerAvatarText: {
    fontSize: 22,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  profileMeta: {
    color: palette.subtext,
    marginTop: 4,
  },
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
  unreadLabel: {
    marginTop: 6,
    color: palette.accentDeep,
    fontSize: 12,
    fontWeight: '700',
  },
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