import { supabase } from '@/lib/supabase';
import type { Match, Profile } from '@/types';

export async function getRecentMitras(userId: string, limit = 5) {
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (matchError) {
    return {
      data: [] as Array<{ match: Match; profile: Profile | null }>,
      error: matchError.message,
    };
  }

  const typedMatches = (matches as Match[]) ?? [];

  const otherUserIds = typedMatches.map((match) =>
    match.user_a === userId ? match.user_b : match.user_a
  );

  if (otherUserIds.length === 0) {
    return {
      data: [] as Array<{ match: Match; profile: Profile | null }>,
      error: null,
    };
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', otherUserIds);

  if (profileError) {
    return {
      data: typedMatches.map((match) => ({ match, profile: null })),
      error: profileError.message,
    };
  }

  const profileMap: Record<string, Profile> = {};
  for (const profile of ((profiles as Profile[]) ?? [])) {
    profileMap[profile.user_id] = profile;
  }

  return {
    data: typedMatches.map((match) => {
      const otherUserId = match.user_a === userId ? match.user_b : match.user_a;
      return {
        match,
        profile: profileMap[otherUserId] ?? null,
      };
    }),
    error: null,
  };
}