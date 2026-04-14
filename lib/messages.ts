import { supabase } from '@/lib/supabase';
import type { Match, Message } from '@/types';

export async function getMyMatches(userId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false });

  return {
    data: (data as Match[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function getMessagesForMatch(matchId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  return {
    data: (data as Message[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function sendMessage(
  matchId: string,
  senderUserId: string,
  body: string
) {
  const text = body.trim();

  if (!text) {
    return { data: null, error: 'Message cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_user_id: senderUserId,
      body: text,
    })
    .select()
    .single();

  return {
    data: (data as Message | null) ?? null,
    error: error?.message ?? null,
  };
}