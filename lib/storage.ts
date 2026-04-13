import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedPosts, seedThreads } from '@/data/mock';
import { Post, SessionUser, Thread } from '@/types';

const keys = {
  session: 'mitrata.session',
  posts: 'mitrata.posts',
  threads: 'mitrata.threads',
};

export async function loadSession(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem(keys.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function saveSession(session: SessionUser): Promise<void> {
  await AsyncStorage.setItem(keys.session, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(keys.session);
}

export async function loadPosts(): Promise<Post[]> {
  const raw = await AsyncStorage.getItem(keys.posts);
  if (!raw) {
    await AsyncStorage.setItem(keys.posts, JSON.stringify(seedPosts));
    return seedPosts;
  }
  try {
    return JSON.parse(raw) as Post[];
  } catch {
    return seedPosts;
  }
}

export async function savePosts(posts: Post[]): Promise<void> {
  await AsyncStorage.setItem(keys.posts, JSON.stringify(posts));
}

export async function loadThreads(): Promise<Thread[]> {
  const raw = await AsyncStorage.getItem(keys.threads);
  if (!raw) {
    await AsyncStorage.setItem(keys.threads, JSON.stringify(seedThreads));
    return seedThreads;
  }
  try {
    return JSON.parse(raw) as Thread[];
  } catch {
    return seedThreads;
  }
}
