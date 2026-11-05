import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BackendStatus } from '@/lib/backend-status';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const COPY: Record<BackendStatus, { label: string; detail: string; color: ThemeColor }> = {
  unconfigured: {
    label: 'Not configured',
    detail: 'Copy apps/mobile/.env.example to .env and add your Supabase URL and anon key.',
    color: 'textSecondary',
  },
  checking: { label: 'Checking…', detail: 'Contacting the marketplace backend.', color: 'textSecondary' },
  online: { label: 'Online', detail: 'Connected to the marketplace backend.', color: 'success' },
  offline: {
    label: 'Offline',
    detail: 'Could not reach the backend. Is Supabase running and the URL reachable from this device?',
    color: 'danger',
  },
};

type Props = {
  status: BackendStatus;
  onRetry?: () => void;
};

export function BackendStatusCard({ status, onRetry }: Props) {
  const theme = useTheme();
  const copy = COPY[status];

  return (
    <ThemedView type="backgroundElement" style={styles.card} testID="backend-status">
      <View style={styles.row}>
        {status === 'checking' ? (
          <ActivityIndicator size="small" color={theme.textSecondary} />
        ) : (
          <View style={[styles.dot, { backgroundColor: theme[copy.color] }]} />
        )}
        <ThemedText type="smallBold">Backend: {copy.label}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {copy.detail}
      </ThemedText>
      {status === 'offline' && onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="tint">
            Retry
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
