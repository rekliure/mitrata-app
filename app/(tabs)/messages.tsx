import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SectionTitle } from '@/components/SectionTitle';
import { RetroCard } from '@/components/RetroCard';
import { loadThreads } from '@/lib/storage';
import { palette } from '@/lib/theme';
import { Thread } from '@/types';

export default function MessagesScreen() {
  const [threads, setThreads] = useState<Thread[]>([]);
  useEffect(() => { (async () => setThreads(await loadThreads()))(); }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Messages" subtitle="Keep it warm, simple, and intentional." />
      {threads.map((thread) => (
        <RetroCard key={thread.id} style={styles.threadCard}>
          <View style={styles.topRow}>
            <Text style={styles.avatar}>{thread.withAvatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{thread.withUserName}</Text>
              <Text style={styles.message}>{thread.lastMessage}</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.time}>{thread.updatedAt}</Text>
              {thread.unreadCount > 0 ? <Text style={styles.unread}>{thread.unreadCount}</Text> : null}
            </View>
          </View>
        </RetroCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 14, paddingBottom: 120 },
  threadCard: { gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { fontSize: 28 },
  name: { fontWeight: '700', color: palette.text, fontSize: 16 },
  message: { color: palette.subtext, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  time: { color: palette.subtext, fontSize: 12 },
  unread: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
    backgroundColor: palette.blush,
    color: palette.text,
    fontWeight: '700',
    fontSize: 12,
  },
});
