import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { OTP_LENGTH, otpSchema } from '@marketplace/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { friendlyAuthError } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(otpSchema), defaultValues: { token: '' } });

  const onSubmit = handleSubmit(async ({ token }) => {
    setServerError(null);
    setNotice(null);
    if (!supabase || !email) return;
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    // On success the auth listener marks the user signed in, and the protected sign-in
    // screens close automatically, returning to the tabs.
    if (error) setServerError(friendlyAuthError(error));
  });

  const resend = async () => {
    if (!supabase || !email) return;
    setResending(true);
    setServerError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setResending(false);
    if (error) setServerError(friendlyAuthError(error));
    else setNotice('A new code is on its way.');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        We sent a {OTP_LENGTH}-digit code to {email}. It expires in 10 minutes.
      </ThemedText>

      <Controller
        control={control}
        name="token"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Code"
            placeholder="123456"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.token?.message}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={OTP_LENGTH}
            onSubmitEditing={() => onSubmit()}
            autoFocus
          />
        )}
      />

      {serverError ? (
        <ThemedText type="small" themeColor="danger">
          {serverError}
        </ThemedText>
      ) : null}
      {notice ? (
        <ThemedText type="small" themeColor="success">
          {notice}
        </ThemedText>
      ) : null}

      <Button title="Verify and sign in" onPress={() => onSubmit()} loading={isSubmitting} />
      <Button title="Send a new code" variant="secondary" onPress={resend} loading={resending} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.three },
});
