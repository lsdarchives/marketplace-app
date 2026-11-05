import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Screen } from './screen';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Button } from './ui/button';

type SignInPromptProps = {
  title: string;
  message: string;
};

/** Shown on tabs that need an account when nobody is signed in. */
export function SignInPrompt({ title, message }: SignInPromptProps) {
  return (
    <Screen title={title}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText>{message}</ThemedText>
        <Button title="Sign in or create account" onPress={() => router.push('/sign-in')} />
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, borderRadius: Spacing.four, gap: Spacing.three },
});
