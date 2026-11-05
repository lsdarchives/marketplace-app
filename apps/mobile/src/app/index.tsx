import { StyleSheet } from 'react-native';

import { BackendStatusCard } from '@/components/backend-status-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useBackendStatus } from '@/hooks/use-backend-status';

export default function HomeScreen() {
  const { status, refresh } = useBackendStatus();

  return (
    <Screen title="Marketplace">
      <ThemedText themeColor="textSecondary">
        Buy it now or win it at auction.
      </ThemedText>

      <BackendStatusCard status={status} onRetry={refresh} />

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Your feed will live here</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Fresh listings and live auctions near you arrive in Increment 2.
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
});
