import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { mockUsers, defaultFilters } from '@/data/mock';
import { palette } from '@/lib/theme';
import { RetroCard } from '@/components/RetroCard';
import { SectionTitle } from '@/components/SectionTitle';
import { SearchFilters } from '@/types';

export default function SearchScreen() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const results = useMemo(() => mockUsers.filter((user) => {
    const query = filters.query.trim().toLowerCase();
    const matchesQuery = !query || user.name.toLowerCase().includes(query) || user.interests.some((i) => i.toLowerCase().includes(query));
    const matchesCity = !filters.city.trim() || user.city.toLowerCase().includes(filters.city.trim().toLowerCase());
    const matchesAge = user.age >= filters.minAge && user.age <= filters.maxAge;
    const matchesGender = filters.gender === 'Any' || user.gender === filters.gender;
    const matchesPremium = !filters.premiumOnly || !!user.isPremium;
    return matchesQuery && matchesCity && matchesAge && matchesGender && matchesPremium;
  }), [filters]);

  const genders = ['Any', 'Woman', 'Man', 'Non-binary'];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle title="Find your people" subtitle="Precision filters for real-world compatibility." />
      <RetroCard style={styles.filters}>
        <TextInput style={styles.input} placeholder="Search by name or interest" placeholderTextColor={palette.subtext} value={filters.query} onChangeText={(query) => setFilters((prev) => ({ ...prev, query }))} />
        <TextInput style={styles.input} placeholder="Location" placeholderTextColor={palette.subtext} value={filters.city} onChangeText={(city) => setFilters((prev) => ({ ...prev, city }))} />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.half]} keyboardType="number-pad" placeholder="Min age" placeholderTextColor={palette.subtext} value={String(filters.minAge)} onChangeText={(v) => setFilters((prev) => ({ ...prev, minAge: Number(v || 18) }))} />
          <TextInput style={[styles.input, styles.half]} keyboardType="number-pad" placeholder="Max age" placeholderTextColor={palette.subtext} value={String(filters.maxAge)} onChangeText={(v) => setFilters((prev) => ({ ...prev, maxAge: Number(v || 99) }))} />
        </View>
        <View style={styles.genderWrap}>
          {genders.map((gender) => (
            <Pressable key={gender} style={[styles.pill, filters.gender === gender && styles.pillActive]} onPress={() => setFilters((prev) => ({ ...prev, gender }))}>
              <Text style={[styles.pillText, filters.gender === gender && styles.pillTextActive]}>{gender}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Premium only</Text>
          <Switch value={filters.premiumOnly} onValueChange={(premiumOnly) => setFilters((prev) => ({ ...prev, premiumOnly }))} trackColor={{ false: '#d5ccc1', true: palette.accent }} />
        </View>
      </RetroCard>

      <SectionTitle title={`${results.length} matches`} subtitle="Intentional people, calm discovery." />
      {results.map((user) => (
        <RetroCard key={user.id} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.avatar}>{user.avatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.meta}>{user.age} · {user.gender} · {user.city}</Text>
            </View>
            {user.isPremium ? <Text style={styles.premium}>Premium</Text> : null}
          </View>
          <Text style={styles.bio}>{user.bio}</Text>
          <Text style={styles.tags}>{user.interests.join(' • ')}</Text>
        </RetroCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, gap: 16, paddingBottom: 120 },
  filters: { gap: 12 },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
  },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  genderWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: palette.surfaceStrong },
  pillActive: { backgroundColor: palette.accentDeep },
  pillText: { color: palette.text, fontWeight: '600' },
  pillTextActive: { color: palette.white },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchText: { color: palette.text, fontWeight: '600' },
  resultCard: { gap: 10 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { fontSize: 28 },
  name: { fontSize: 17, fontWeight: '700', color: palette.text },
  meta: { color: palette.subtext, fontSize: 13 },
  premium: { color: palette.accentDeep, fontSize: 12, fontWeight: '700' },
  bio: { color: palette.text, lineHeight: 20 },
  tags: { color: palette.subtext, fontSize: 13 },
});
