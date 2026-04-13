import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { palette, shadow } from '@/lib/theme';

export function RetroCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    padding: 16,
    ...shadow,
  },
});
