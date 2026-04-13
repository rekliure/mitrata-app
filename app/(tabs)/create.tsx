import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { loadPosts, savePosts } from '@/lib/storage';
import { palette } from '@/lib/theme';
import { Post } from '@/types';

export default function CreateScreen() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Open');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => { (async () => setPosts(await loadPosts()))(); }, []);

  async function publish() {
    const clean = content.trim();
    if (clean.length < 12) {
      Alert.alert('Mitrata', 'Write at least 12 characters so people understand your intent.');
      return;
    }
    const next: Post[] = [
      {
        id: `p-${Date.now()}`,
        authorId: user?.id ?? 'local-user',
        authorName: user?.name ?? 'Mitrata User',
        content: clean,
        mood,
        createdAt: 'Just now',
        likes: 0,
      },
      ...posts,
    ];
    await savePosts(next);
    setPosts(next);
    setContent('');
    Alert.alert('Posted', 'Your note is now live in the feed.');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Create" subtitle="Start a real conversation with a small honest post." />
      <RetroCard style={styles.card}>
        <TextInput
          style={styles.textarea}
          multiline
          placeholder="What are you looking for on Mitrata? A walk, coffee, friendship, a creative circle?"
          placeholderTextColor={palette.subtext}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
        <TextInput style={styles.input} placeholder="Mood" placeholderTextColor={palette.subtext} value={mood} onChangeText={setMood} />
        <Pressable style={styles.button} onPress={publish}>
          <Text style={styles.buttonText}>Publish</Text>
        </Pressable>
      </RetroCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  card: { gap: 12 },
  textarea: {
    minHeight: 180,
    borderRadius: 18,
    borderColor: palette.border,
    borderWidth: 1,
    backgroundColor: palette.surface,
    color: palette.text,
    padding: 14,
    lineHeight: 22,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderColor: palette.border,
    borderWidth: 1,
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: palette.green,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: { color: palette.text, fontWeight: '700' },
});
