import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { profileSchema, type Profile } from '@marketplace/shared';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { updateProfile, uploadAvatar } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { setProfile } from '@/stores/auth';

import { ThemedText } from './themed-text';
import { Button } from './ui/button';
import { TextField } from './ui/text-field';

type Props = {
  profile: Profile;
  email: string | undefined;
};

export function ProfileEditor({ profile, email }: Props) {
  const theme = useTheme();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);
  const isNew = !profile.username;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username ?? '',
      display_name: profile.display_name ?? '',
      region: profile.region ?? '',
    },
  });

  const onSave = handleSubmit(async (values) => {
    if (!supabase) return;
    setMessage(null);
    const result = await updateProfile(supabase, profile.id, values);
    if (!result.ok) {
      setMessage({ text: result.message, ok: false });
      return;
    }
    setProfile(result.data);
    reset({
      username: result.data.username ?? '',
      display_name: result.data.display_name ?? '',
      region: result.data.region ?? '',
    });
    setMessage({ text: 'Profile saved.', ok: true });
  });

  const pickAvatar = async () => {
    if (!supabase) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (picked.canceled || !picked.assets[0]) return;

    setUploading(true);
    setMessage(null);
    const result = await uploadAvatar(supabase, profile.id, picked.assets[0]);
    setUploading(false);
    if (result.ok) setProfile(result.data);
    else setMessage({ text: result.message, ok: false });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={pickAvatar}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo">
          {profile.avatar_url ? (
            <Image source={profile.avatar_url} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="subtitle">
                {(profile.display_name || profile.username || email || '?')[0]?.toUpperCase()}
              </ThemedText>
            </View>
          )}
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="smallBold">{uploading ? 'Uploading…' : 'Tap photo to change'}</ThemedText>
          {email ? (
            <ThemedText type="small" themeColor="textSecondary">
              {email}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {isNew ? (
        <ThemedText type="small" themeColor="textSecondary">
          Choose a username so buyers and sellers can recognise you.
        </ThemedText>
      ) : null}

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Username"
            placeholder="e.g. vintage_finds"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.username?.message}
            hint="Lowercase letters, numbers and underscores"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      />
      <Controller
        control={control}
        name="display_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Name (optional)"
            placeholder="How you’d like to be shown"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.display_name?.message}
            autoComplete="name"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Area (optional)"
            placeholder="e.g. Cape Town"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.region?.message}
            hint="Helps buyers find items near them"
          />
        )}
      />

      {message ? (
        <ThemedText type="small" themeColor={message.ok ? 'success' : 'danger'}>
          {message.text}
        </ThemedText>
      ) : null}

      <Button
        title={isNew ? 'Create profile' : 'Save changes'}
        onPress={() => onSave()}
        loading={isSubmitting}
        disabled={!isDirty}
      />
      <Button title="Sign out" variant="secondary" onPress={() => supabase?.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerText: { flex: 1, gap: Spacing.half },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
