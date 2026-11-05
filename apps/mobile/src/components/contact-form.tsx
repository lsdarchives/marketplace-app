import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { whatsappSchema } from '@marketplace/shared';

import { Spacing } from '@/constants/theme';
import { fetchSellerWhatsApp, saveWhatsApp } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

import { ThemedText } from './themed-text';
import { Button } from './ui/button';
import { TextField } from './ui/text-field';

/** Optional WhatsApp number buyers use to reach this seller (until in-app chat ships). */
export function ContactForm({ userId }: { userId: string }) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(whatsappSchema), defaultValues: { whatsapp: '' } });

  useEffect(() => {
    if (!supabase) return;
    void fetchSellerWhatsApp(supabase, userId).then((value) => reset({ whatsapp: value ?? '' }));
  }, [userId, reset]);

  const onSave = handleSubmit(async ({ whatsapp }) => {
    if (!supabase) return;
    const result = await saveWhatsApp(supabase, userId, whatsapp);
    if (!result.ok) return setMessage({ text: result.message, ok: false });
    reset({ whatsapp: whatsapp ?? '' });
    setMessage({ text: whatsapp ? 'Number saved.' : 'Number removed.', ok: true });
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="whatsapp"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="WhatsApp number (optional)"
            placeholder="082 123 4567"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.whatsapp?.message}
            hint="Only signed-in buyers can see it, so they can ask about your items."
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        )}
      />
      {message ? (
        <ThemedText type="small" themeColor={message.ok ? 'success' : 'danger'}>
          {message.text}
        </ThemedText>
      ) : null}
      <Button
        title="Save number"
        variant="secondary"
        onPress={() => onSave()}
        loading={isSubmitting}
        disabled={!isDirty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
});
