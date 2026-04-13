import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { loadPosts } from '@/lib/storage';
import { palette } from '@/lib/theme';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { Post } from '@/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    const next = await loadPosts();
    setPosts(next);
    setRefreshing(false);
  }

  useEffect(() => { void refresh(); }, []);

  const menu = [
    { title: 'Search', text: 'Find people with absolute filters and calm intent.' },
    { title: 'Messages', text: 'Move from hello to meaningful conversation.' },
    { title: 'Create', text: 'Post what you are looking for or planning offline.' },
    { title: 'Profile', text: 'Shape how people discover the real you.' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.accentDeep} />}
    >
      <SectionTitle title={`Hi ${user?.name?.split(' ')[0] ?? 'there'}, welcome back`} subtitle="A retro-calm social space for real-world connection." />

      <RetroCard>
        <Text style={styles.heroTitle}>Mitrata menu</Text>
        <View style={styles.grid}>
          {menu.map((item) => (
            <View key={item.title} style={styles.menuTile}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </RetroCard>

      <SectionTitle title="Today’s circle" subtitle="A soft public feed designed for intent, not noise." />
      {posts.map((post) => (
        <RetroCard key={post.id} style={styles.postCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.postAuthor}>{post.authorName}</Text>
            <Text style={styles.postTime}>{post.createdAt}</Text>
          </View>
          <Text style={styles.postContent}>{post.content}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.badge}>{post.mood}</Text>
            <Text style={styles.likes}>{post.likes} likes</Text>
          </View>
        </RetroCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: 12 },
  grid: { gap: 10 },
  menuTile: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  menuTitle: { fontWeight: '700', color: palette.text, marginBottom: 4 },
  menuText: { color: palette.subtext, lineHeight: 20 },
  postCard: { gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postAuthor: { fontWeight: '700', fontSize: 16, color: palette.text },
  postTime: { color: palette.subtext, fontSize: 12 },
  postContent: { color: palette.text, lineHeight: 22 },
  badge: {
    color: palette.accentDeep,
    backgroundColor: '#e6f0f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '600',
  },
  likes: { color: palette.subtext, fontSize: 12 },
});
