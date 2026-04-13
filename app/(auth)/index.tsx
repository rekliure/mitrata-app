import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { palette } from '@/lib/theme';
import { RetroCard } from '@/components/RetroCard';

export default function AuthScreen() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Digital warmth. Real-world friendships.'
        : 'Find your circle with intention, calm, and clarity.',
    [mode],
  );

  if (user) return <Redirect href="/(tabs)" />;

  async function handleSubmit() {
    try {
      setLoading(true);
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      Alert.alert('Mitrata', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[palette.bg, '#eef4f7', '#fbf6ed']} style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>Mitrata</Text>
            <Text style={styles.tagline}>Connect in real life, with a gentle digital touch.</Text>
            <Text style={styles.subtag}>{subtitle}</Text>
          </View>

          <RetroCard style={styles.card}>
            <View style={styles.toggleWrap}>
              <Pressable style={[styles.toggle, mode === 'login' && styles.toggleActive]} onPress={() => setMode('login')}>
                <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Login</Text>
              </Pressable>
              <Pressable style={[styles.toggle, mode === 'signup' && styles.toggleActive]} onPress={() => setMode('signup')}>
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Sign up</Text>
              </Pressable>
            </View>

            {mode === 'signup' ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={palette.subtext}
                style={styles.input}
                autoCapitalize="words"
              />
            ) : null}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={palette.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={palette.subtext}
              secureTextEntry
              style={styles.input}
            />

            <Pressable style={[styles.cta, loading && styles.ctaDisabled]} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.ctaText}>{loading ? 'Please wait...' : mode === 'login' ? 'Enter Mitrata' : 'Create account'}</Text>
            </Pressable>

            <Text style={styles.footnote}>
              Local-first prototype: auth is stored on-device so you can test flows instantly.
            </Text>
          </RetroCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  hero: {
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: palette.text,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.accentDeep,
  },
  subtag: {
    fontSize: 14,
    color: palette.subtext,
    lineHeight: 20,
  },
  card: {
    gap: 12,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceStrong,
    padding: 4,
    borderRadius: 16,
  },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleActive: {
    backgroundColor: palette.white,
  },
  toggleText: {
    color: palette.subtext,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: palette.text,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.text,
  },
  cta: {
    backgroundColor: palette.accentDeep,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 16,
  },
  footnote: {
    color: palette.subtext,
    fontSize: 12,
    lineHeight: 18,
  },
});
