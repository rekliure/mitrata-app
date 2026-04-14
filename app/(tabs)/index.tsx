import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuth } from '@/context/AuthContext';
import { getRecentMitras } from '@/lib/home';
import { getUnreadMessageCount } from '@/lib/messages';
import {
  deletePost,
  getFeedPosts,
  likePost,
  unlikePost,
} from '@/lib/posts';
import { getPendingRequestCount } from '@/lib/requests';
import { palette } from '@/lib/theme';
import type { FeedPost, Match, Profile } from '@/types';

type RecentMitraItem = {
  match: Match;
  profile: Profile | null;
};

type FeedFilter = 'all' | 'public' | 'mine';

export default function HomeScreen() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentMitras, setRecentMitras] = useState<RecentMitraItem[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const loadHome = async () => {
    if (!user) return;

    setLoading(true);

    const [requestsResult, messagesResult, mitrasResult, feedResult] =
      await Promise.all([
        getPendingRequestCount(user.id),
        getUnreadMessageCount(user.id),
        getRecentMitras(user.id, 5),
        getFeedPosts(user.id, 20),
      ]);

    setPendingRequests(requestsResult.count);
    setUnreadMessages(messagesResult.count);
    setRecentMitras(mitrasResult.data);
    setFeedPosts(feedResult.data);

    setLoading(false);
  };

  useEffect(() => {
    void loadHome();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [user?.id])
  );

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Mitra';

  const Avatar = ({
    avatarUrl,
    emoji = '🌙',
    size = 64,
  }: {
    avatarUrl?: string | null;
    emoji?: string;
    size?: number;
  }) => {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarWrap,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.avatarEmoji, { fontSize: size * 0.42 }]}>{emoji}</Text>
      </View>
    );
  };

  const filteredFeed = useMemo(() => {
    if (!user) return feedPosts;

    switch (feedFilter) {
      case 'public':
        return feedPosts.filter((item) => item.post.visibility === 'public');
      case 'mine':
        return feedPosts.filter((item) => item.post.user_id === user.id);
      default:
        return feedPosts;
    }
  }, [feedPosts, feedFilter, user?.id]);

  const formatVisibility = (value: string) =>
    value === 'mitras_only' ? 'Mitras only' : 'Public';

  const handleLikeToggle = async (item: FeedPost) => {
    if (!user) return;

    setBusyPostId(item.post.id);

    const result = item.liked_by_me
      ? await unlikePost(item.post.id, user.id)
      : await likePost(item.post.id, user.id);

    setBusyPostId(null);

    if (result.error) {
      Alert.alert('Could not update like', result.error);
      return;
    }

    await loadHome();
  };

  const handleDeletePost = async (item: FeedPost) => {
    if (!user) return;

    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyPostId(item.post.id);

            const result = await deletePost(item.post.id, user.id);

            setBusyPostId(null);

            if (result.error) {
              Alert.alert('Could not delete post', result.error);
              return;
            }

            await loadHome();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Mitrata"
        subtitle="A calm social space for real people and real connection."
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accentDeep} />
        </View>
      ) : (
        <>
          <RetroCard style={styles.heroCard}>
            <Avatar avatarUrl={profile?.avatar_url} />
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Welcome, {displayName}</Text>
              <Text style={styles.heroSubtitle}>
                Keep your circle intentional and your connections meaningful.
              </Text>
            </View>
          </RetroCard>

          <View style={styles.statsRow}>
            <RetroCard style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingRequests}</Text>
              <Text style={styles.statLabel}>Pending requests</Text>
            </RetroCard>

            <RetroCard style={styles.statCard}>
              <Text style={styles.statNumber}>{unreadMessages}</Text>
              <Text style={styles.statLabel}>Unread messages</Text>
            </RetroCard>
          </View>

          <RetroCard>
            <Text style={styles.heading}>Quick actions</Text>

            <View style={styles.actionsGrid}>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/search')}
              >
                <Text style={styles.actionTitle}>Discover</Text>
                <Text style={styles.actionSub}>Find people</Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/requests')}
              >
                <Text style={styles.actionTitle}>Requests</Text>
                <Text style={styles.actionSub}>Review invites</Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/messages')}
              >
                <Text style={styles.actionTitle}>Messages</Text>
                <Text style={styles.actionSub}>Continue chats</Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/create')}
              >
                <Text style={styles.actionTitle}>Create</Text>
                <Text style={styles.actionSub}>Share a post</Text>
              </Pressable>
            </View>
          </RetroCard>

          <RetroCard>
            <Text style={styles.heading}>Recent Mitras</Text>

            {recentMitras.length === 0 ? (
              <Text style={styles.emptyText}>
                No Mitras yet. Start by exploring new people.
              </Text>
            ) : (
              <View style={styles.mitraList}>
                {recentMitras.map(({ match, profile: mitra }) => (
                  <Pressable
                    key={match.id}
                    style={styles.mitraRow}
                    onPress={() => router.push('/messages')}
                  >
                    <Avatar avatarUrl={mitra?.avatar_url} emoji="✨" size={48} />

                    <View style={styles.mitraBody}>
                      <Text style={styles.mitraName}>
                        {mitra?.display_name || 'Unknown Mitra'}
                      </Text>
                      <Text style={styles.mitraMeta}>
                        {[
                          mitra?.age ? `${mitra.age}` : null,
                          mitra?.city,
                          mitra?.looking_for,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Details not added'}
                      </Text>
                      <Text style={styles.mitraBio} numberOfLines={2}>
                        {mitra?.bio || 'No bio added yet.'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </RetroCard>

          <RetroCard>
            <View style={styles.feedHeader}>
              <Text style={styles.heading}>Recent feed</Text>
              <Pressable onPress={() => router.push('/create')}>
                <Text style={styles.feedAction}>Post</Text>
              </Pressable>
            </View>

            <View style={styles.filterRow}>
              {(['all', 'public', 'mine'] as FeedFilter[]).map((option) => {
                const active = feedFilter === option;
                const label =
                  option === 'all'
                    ? 'All'
                    : option === 'public'
                    ? 'Public'
                    : 'My posts';

                return (
                  <Pressable
                    key={option}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFeedFilter(option)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredFeed.length === 0 ? (
              <Text style={styles.emptyText}>
                No posts found for this filter.
              </Text>
            ) : (
              <View style={styles.feedList}>
                {filteredFeed.map((item) => (
                  <View key={item.post.id} style={styles.feedCard}>
                    <View style={styles.feedTop}>
                      <Avatar
                        avatarUrl={item.profile?.avatar_url}
                        emoji="✨"
                        size={42}
                      />

                      <View style={styles.feedMetaWrap}>
                        <Text style={styles.feedName}>
                          {item.profile?.display_name || 'Unknown user'}
                        </Text>
                        <Text style={styles.feedMeta}>
                          {[item.profile?.city, formatVisibility(item.post.visibility)]
                            .filter(Boolean)
                            .join(' • ')}
                        </Text>
                      </View>
                    </View>

                    {item.post.mood ? (
                      <Text style={styles.feedMood}>Mood: {item.post.mood}</Text>
                    ) : null}

                    <Text style={styles.feedContent}>{item.post.content}</Text>

                    <View style={styles.feedActions}>
                      <Pressable
                        style={[
                          styles.feedActionButton,
                          busyPostId === item.post.id && styles.feedActionButtonDisabled,
                        ]}
                        onPress={() => void handleLikeToggle(item)}
                        disabled={busyPostId === item.post.id}
                      >
                        <Text style={styles.feedActionButtonText}>
                          {item.liked_by_me ? 'Unlike' : 'Like'} ({item.like_count})
                        </Text>
                      </Pressable>

                      {item.post.user_id === user?.id ? (
                        <Pressable
                          style={[
                            styles.deleteActionButton,
                            busyPostId === item.post.id && styles.feedActionButtonDisabled,
                          ]}
                          onPress={() => void handleDeletePost(item)}
                          disabled={busyPostId === item.post.id}
                        >
                          <Text style={styles.deleteActionButtonText}>Delete</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </RetroCard>

          <RetroCard>
            <Text style={styles.heading}>Today’s pulse</Text>
            <Text style={styles.pulseText}>
              {pendingRequests > 0
                ? `You have ${pendingRequests} request${pendingRequests === 1 ? '' : 's'} waiting.`
                : 'No pending requests right now.'}{' '}
              {unreadMessages > 0
                ? `There ${unreadMessages === 1 ? 'is' : 'are'} ${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}.`
                : 'Your inbox is calm.'}
            </Text>
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
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heroTextWrap: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
  },
  heroSubtitle: {
    color: palette.subtext,
    lineHeight: 22,
  },
  avatarWrap: {
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.accentDeep,
  },
  statLabel: {
    marginTop: 6,
    color: palette.subtext,
    textAlign: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    width: '48%',
    backgroundColor: palette.surfaceStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  actionTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 16,
  },
  actionSub: {
    color: palette.subtext,
    marginTop: 4,
  },
  mitraList: {
    gap: 12,
  },
  mitraRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingTop: 6,
  },
  mitraBody: {
    flex: 1,
    gap: 4,
  },
  mitraName: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 17,
  },
  mitraMeta: {
    color: palette.subtext,
  },
  mitraBio: {
    color: palette.text,
    lineHeight: 20,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedAction: {
    color: palette.accentDeep,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: palette.accentDeep,
  },
  filterChipText: {
    color: palette.text,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  feedList: {
    gap: 12,
  },
  feedCard: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  feedTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  feedMetaWrap: {
    flex: 1,
  },
  feedName: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 15,
  },
  feedMeta: {
    color: palette.subtext,
    marginTop: 2,
  },
  feedMood: {
    color: palette.accentDeep,
    fontWeight: '700',
  },
  feedContent: {
    color: palette.text,
    lineHeight: 22,
  },
  feedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  feedActionButton: {
    backgroundColor: palette.blush,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feedActionButtonDisabled: {
    opacity: 0.7,
  },
  feedActionButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
  deleteActionButton: {
    backgroundColor: palette.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteActionButtonText: {
    color: palette.white,
    fontWeight: '700',
  },
  emptyText: {
    color: palette.subtext,
    lineHeight: 22,
  },
  pulseText: {
    color: palette.text,
    lineHeight: 22,
  },
});