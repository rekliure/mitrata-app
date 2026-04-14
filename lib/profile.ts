import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'display_name'
    | 'dob'
    | 'age'
    | 'gender'
    | 'city'
    | 'country'
    | 'bio'
    | 'looking_for'
    | 'languages'
    | 'interests'
    | 'avatar_url'
    | 'is_profile_complete'
    | 'is_visible'
    | 'is_verified'
  >
>;

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    data: (data as Profile | null) ?? null,
    error: error?.message ?? null,
  };
}

export function calculateProfileCompleteness(profileLike: Partial<Profile> | null) {
  if (!profileLike) return 0;

  const checks = [
    !!profileLike.display_name?.trim(),
    !!profileLike.age,
    !!profileLike.gender?.trim(),
    !!profileLike.city?.trim(),
    !!profileLike.country?.trim(),
    !!profileLike.looking_for?.trim(),
    !!profileLike.bio?.trim(),
    !!profileLike.avatar_url?.trim(),
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export async function updateMyProfile(userId: string, updates: ProfileUpdate) {
  const currentProfileResult = await getMyProfile(userId);

  const mergedProfile = {
    ...(currentProfileResult.data ?? {}),
    ...updates,
  } as Partial<Profile>;

  const completeness = calculateProfileCompleteness(mergedProfile);
  const isProfileComplete = completeness >= 75;

  const payload = {
    ...updates,
    is_profile_complete: isProfileComplete,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        ...payload,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  return {
    data: (data as Profile | null) ?? null,
    error: error?.message ?? null,
  };
}