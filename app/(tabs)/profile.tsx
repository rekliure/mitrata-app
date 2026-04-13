import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { palette } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Profile" subtitle="Your calm digital identity for real-life connection." />
      <RetroCard style={styles.profileCard}>
        <View style={styles.avatarWrap}><Text style={styles.avatar}>🌙</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.bio}>Curious, kind, and open to meaningful people over endless scrolling.</Text>
      </RetroCard>

      <RetroCard>
        <Text style={styles.heading}>Retro menu</Text>
        <Text style={styles.item}>• Search with precision filters</Text>
        <Text style={styles.item}>• Message with intent</Text>
        <Text style={styles.item}>• Create gentle posts</Text>
        <Text style={styles.item}>• Iterate the product from real usage</Text>
      </RetroCard>

      <Pressable style={styles.button} onPress={() => void signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  profileCard: { alignItems: 'center', gap: 8 },
  avatarWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceStrong },
  avatar: { fontSize: 38 },
  name: { fontSize: 22, fontWeight: '800', color: palette.text },
  email: { color: palette.subtext },
  bio: { color: palette.text, lineHeight: 22, textAlign: 'center' },
  heading: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 10 },
  item: { color: palette.subtext, lineHeight: 22 },
  button: { backgroundColor: palette.blush, borderRadius: 16, alignItems: 'center', paddingVertical: 14 },
  buttonText: { color: palette.text, fontWeight: '700' },
});
