import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuth } from '@/context/AuthContext';
import { createPost } from '@/lib/posts';
import { palette } from '@/lib/theme';
import type { PostVisibility } from '@/types';

const MOOD_OPTIONS = [
  'Calm',
  'Curious',
  'Happy',
  'Thoughtful',
  'Excited',
  'Reflective',
];

const VISIBILITY_OPTIONS: PostVisibility[] = ['public', 'mitras_only'];

export default function CreateScreen() {
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>('Calm');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [posting, setPosting] = useState(false);

  const handleCreatePost = async () => {
    if (!user) return;

    const trimmed = content.trim();

    if (!trimmed) {
      Alert.alert('Missing content', 'Please write something before posting.');
      return;
    }

    if (trimmed.length < 3) {
      Alert.alert('Too short', 'Please write at least a few words.');
      return;
    }

    setPosting(true);

    const result = await createPost(user.id, trimmed, mood, visibility);

    setPosting(false);

    if (result.error) {
      Alert.alert('Could not create post', result.error);
      return;
    }

    setContent('');
    setMood('Calm');
    setVisibility('public');

    Alert.alert('Posted', 'Your post is now live.', [
      {
        text: 'Go to Home',
        onPress: () => router.push('/'),
      },
      {
        text: 'Stay here',
        style: 'cancel',
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle
        title="Create"
        subtitle="Share something gentle, honest, or meaningful."
      />

      <RetroCard>
        <Text style={styles.heading}>What’s on your mind?</Text>

        <TextInput
          style={styles.textarea}
          placeholder="Write a short post for your space..."
          placeholderTextColor={palette.subtext}
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={500}
        />

        <Text style={styles.counter}>{content.trim().length}/500</Text>
      </RetroCard>

      <RetroCard>
        <Text style={styles.heading}>Mood</Text>
        <View style={styles.choiceWrap}>
          {MOOD_OPTIONS.map((option) => {
            const active = mood === option;
            return (
              <Pressable
                key={option}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => setMood(option)}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    active && styles.choiceChipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </RetroCard>

      <RetroCard>
        <Text style={styles.heading}>Visibility</Text>
        <View style={styles.choiceWrap}>
          {VISIBILITY_OPTIONS.map((option) => {
            const active = visibility === option;
            const label = option === 'public' ? 'Public' : 'Mitras only';

            return (
              <Pressable
                key={option}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => setVisibility(option)}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    active && styles.choiceChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.helperText}>
          Public posts can be seen in the broader feed. Mitras only stays more personal.
        </Text>
      </RetroCard>

      <Pressable
        style={[styles.postButton, posting && styles.postButtonDisabled]}
        onPress={handleCreatePost}
        disabled={posting}
      >
        <Text style={styles.postButtonText}>
          {posting ? 'Posting...' : 'Post now'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 10,
  },
  textarea: {
    minHeight: 140,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.text,
    textAlignVertical: 'top',
  },
  counter: {
    marginTop: 8,
    color: palette.subtext,
    textAlign: 'right',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceChipActive: {
    backgroundColor: palette.accentDeep,
  },
  choiceChipText: {
    color: palette.text,
    fontWeight: '700',
  },
  choiceChipTextActive: {
    color: '#fff',
  },
  helperText: {
    color: palette.subtext,
    marginTop: 10,
    lineHeight: 20,
  },
  postButton: {
    backgroundColor: palette.accentDeep,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  postButtonDisabled: {
    opacity: 0.7,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});