import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { getPendingRequestCount } from '@/lib/requests';
import { palette } from '@/lib/theme';
import type { Match, Profile } from '@/types';

type RecentMitraItem = {
  match: Match;
  profile: Profile | null;
};

export default function HomeScreen() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentMitras, setRecentMitras] = useState<RecentMitraItem[]>([]);

  const loadHome = async () => {
    if (!user) return;

    setLoading(true);

    const [requestsResult, messagesResult, mitrasResult] = await Promise.all([
      getPendingRequestCount(user.id),
      getUnreadMessageCount(user.id),
      getRecentMitras(user.id, 5),
    ]);

    setPendingRequests(requestsResult.count);
    setUnreadMessages(messagesResult.count);
    setRecentMitras(mitrasResult.data);

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

  const Avatar = ({ avatarUrl, emoji = '🌙' }: { avatarUrl?: string | null; emoji?: string }) => {
    if (avatarUrl) {
      return <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />;
    }

    return (
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarEmoji}>{emoji}</Text>
      </View>
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
                onPress={() => router.push('/profile')}
              >
                <Text style={styles.actionTitle}>Profile</Text>
                <Text style={styles.actionSub}>Edit identity</Text>
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
                    <Avatar avatarUrl={mitra?.avatar_url} emoji="✨" />

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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  emptyText: {
    color: palette.subtext,
    lineHeight: 22,
  },
  pulseText: {
    color: palette.text,
    lineHeight: 22,
  },
});