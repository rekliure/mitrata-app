import { supabase } from '@/lib/supabase';
import type { FeedPost, Post, PostVisibility, Profile } from '@/types';
import { getBlockedRelationships } from '@/lib/social';

export async function createPost(
  userId: string,
  content: string,
  mood: string | null,
  visibility: PostVisibility
) {
  const trimmed = content.trim();

  if (!trimmed) {
    return { data: null, error: 'Post content cannot be empty.' };
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: trimmed,
      mood: mood?.trim() || null,
      visibility,
    })
    .select()
    .single();

  return {
    data: (data as Post | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function getMyPosts(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    data: (data as Post[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function getFeedPosts(currentUserId: string, limit = 20) {
  const blockedResult = await getBlockedRelationships(currentUserId);
  const blockedIds = new Set(blockedResult.data ?? []);

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (postsError) {
    return {
      data: [] as FeedPost[],
      error: postsError.message,
    };
  }

  const typedPosts = (posts as Post[]) ?? [];

  const visiblePosts = typedPosts.filter((post) => !blockedIds.has(post.user_id));

  const profileIds = [...new Set(visiblePosts.map((post) => post.user_id))];

  if (profileIds.length === 0) {
    return {
      data: [] as FeedPost[],
      error: null,
    };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', profileIds);

  if (profilesError) {
    return {
      data: visiblePosts.map((post) => ({ post, profile: null })),
      error: profilesError.message,
    };
  }

  const profileMap: Record<string, Profile> = {};
  for (const profile of ((profiles as Profile[]) ?? [])) {
    profileMap[profile.user_id] = profile;
  }

  const feed = visiblePosts.filter((post) => {
    if (post.visibility === 'public') return true;
    return post.user_id === currentUserId;
  });

  return {
    data: feed.map((post) => ({
      post,
      profile: profileMap[post.user_id] ?? null,
    })),
    error: null,
  };
}