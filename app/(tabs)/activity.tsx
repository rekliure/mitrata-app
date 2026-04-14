import { useCallback, useState } from 'react';
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
import { getActivityItems } from '@/lib/activity';
import { palette } from '@/lib/theme';
import type { ActivityItem } from '@/types';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActivityItem[]>([]);

  const loadActivity = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getActivityItems(user.id, 40);

    if (result.error) {
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(result.data);
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadActivity();
    }, [loadActivity])
  );

  const formatTime = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const Avatar = ({
    avatarUrl,
    size = 48,
  }: {
    avatarUrl?: string | null;
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
        <Text style={styles.avatarText}>✨</Text>
      </View>
    );
  };

  const buildTitle = (item: ActivityItem) => {
    const name = item.actor_profile?.display_name || 'Someone';

    if (item.kind === 'request') return `${name} sent you a request`;
    if (item.kind === 'like') return `${name} liked your post`;
    return `${name} commented on your post`;
  };

  const buildBody = (item: ActivityItem) => {
    if (item.kind === 'comment') {
      return item.comment_preview || 'New comment';
    }

    if (item.kind === 'like') {
      return item.post_preview || 'Your post';
    }

    return 'Check your requests tab to respond.';
  };

  const onOpenItem = (item: ActivityItem) => {
    if (item.kind === 'request') {
      router.push('/requests');
      return;
    }

    router.push('/');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Activity"
        subtitle="See what’s happening around your space."
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accentDeep} />
        </View>
      ) : items.length === 0 ? (
        <RetroCard>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyText}>
            Likes, comments, and requests will appear here.
          </Text>
        </RetroCard>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onOpenItem(item)}
              style={styles.cardWrap}
            >
              <RetroCard style={styles.itemCard}>
                <Avatar avatarUrl={item.actor_profile?.avatar_url} />

                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{buildTitle(item)}</Text>
                  <Text style={styles.itemText}>{buildBody(item)}</Text>
                  <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
                </View>
              </RetroCard>
            </Pressable>
          ))}
        </View>
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
  list: {
    gap: 12,
  },
  cardWrap: {
    borderRadius: 16,
  },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    backgroundColor: palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 16,
  },
  itemText: {
    color: palette.text,
    lineHeight: 20,
  },
  itemTime: {
    color: palette.subtext,
    fontSize: 12,
    marginTop: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 6,
  },
  emptyText: {
    color: palette.subtext,
    lineHeight: 22,
  },
});