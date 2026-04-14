import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

export async function pickAvatarImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { asset: null, error: 'Photo permission is required.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) {
    return { asset: null, error: null };
  }

  return { asset: result.assets[0], error: null };
}

export async function uploadAvatar(
  userId: string,
  asset: ImagePicker.ImagePickerAsset
) {
  if (!asset.base64) {
    return { publicUrl: null, error: 'Could not read selected image.' };
  }

  const ext = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/avatar.${ext}`;

  const contentType =
    asset.mimeType ||
    (ext === 'png'
      ? 'image/png'
      : ext === 'webp'
      ? 'image/webp'
      : 'image/jpeg');

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, decode(asset.base64), {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    return { publicUrl: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return { publicUrl: data.publicUrl, error: null };
}