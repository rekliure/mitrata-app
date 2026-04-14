import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data: data as Profile | null, error: error?.message ?? null };
}

export async function upsertMyProfile(profile: Partial<Profile> & { user_id: string }) {
  const payload = {
    ...profile,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  return { data: data as Profile | null, error: error?.message ?? null };
}

export async function updateMyProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .single();

  return {
    data: (data as Profile | null) ?? null,
    error: error?.message ?? null,
  };
}