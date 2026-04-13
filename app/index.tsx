import { Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(tabs)' : '/(auth)'} />;
}
