import { supabase } from '@/lib/supabase';

export async function unfriendMatch(matchId: string) {
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId);

  return {
    error: error?.message ?? null,
  };
}