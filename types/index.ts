export type Gender = 'Woman' | 'Man' | 'Non-binary';

export type User = {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: Gender;
  city: string;
  bio: string;
  interests: string[];
  avatar: string;
  isPremium?: boolean;
};

export type SearchFilters = {
  query: string;
  city: string;
  minAge: number;
  maxAge: number;
  gender: string;
  premiumOnly: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  mood: string;
  createdAt: string;
  likes: number;
};

export type Thread = {
  id: string;
  withUserId: string;
  withUserName: string;
  withAvatar: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  dob: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  looking_for: string | null;
  languages: string[];
  interests: string[];
  avatar_url: string | null;
  is_profile_complete: boolean;
  is_visible: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type ConnectionRequest = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  intro_message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};