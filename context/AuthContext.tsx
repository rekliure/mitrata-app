import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { clearSession, loadSession, saveSession } from '@/lib/storage';
import { SessionUser } from '@/types';

type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const current = await loadSession();
      setUser(current);
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    signIn: async (email, password) => {
      const safeEmail = email.trim().toLowerCase();
      if (!validateEmail(safeEmail)) {
        throw new Error('Enter a valid email address.');
      }
      if (password.trim().length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const session: SessionUser = {
        id: `u-${safeEmail}`,
        name: safeEmail.split('@')[0].replace(/[^a-z]/gi, ' ').trim() || 'Mitrata User',
        email: safeEmail,
      };
      await saveSession(session);
      setUser(session);
    },
    signUp: async (name, email, password) => {
      const safeName = name.trim();
      const safeEmail = email.trim().toLowerCase();
      if (safeName.length < 2) {
        throw new Error('Name should have at least 2 characters.');
      }
      if (!validateEmail(safeEmail)) {
        throw new Error('Enter a valid email address.');
      }
      if (password.trim().length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      const session: SessionUser = {
        id: `u-${safeEmail}`,
        name: safeName,
        email: safeEmail,
      };
      await saveSession(session);
      setUser(session);
    },
    signOut: async () => {
      await clearSession();
      setUser(null);
      Alert.alert('Signed out', 'You have been signed out of Mitrata.');
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
