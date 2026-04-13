import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AuthScreen() {
  const { user, signIn, signUp, loading } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    const result =
      mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

    setSubmitting(false);

    if (result.error) {
      Alert.alert(mode === 'login' ? 'Login failed' : 'Signup failed', result.error);
      return;
    }

    if (mode === 'signup') {
      Alert.alert(
        'Check your email',
        'Your account was created. If email confirmation is enabled, please verify before continuing.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mitrata</Text>
      <Text style={styles.subtitle}>Find real people. Build real warmth.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>
          {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
        </Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.switchText}>
          {mode === 'login'
            ? "New here? Create an account"
            : 'Already have an account? Login'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F2E8',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: '#3E4A46',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    color: '#6E776F',
  },
  input: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#D8D2C5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#7E9C92',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  switchText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#6C7E77',
  },
});