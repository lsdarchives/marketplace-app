import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Screen } from './screen';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type ComingSoonProps = {
  title: string;
  description: string;
  increment: string;
};

/** Placeholder for tabs whose feature lands in a later increment. */
export function ComingSoon({ title, description, increment }: ComingSoonProps) {
  return (
    <Screen title={title}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText>{description}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Arrives in {increment}
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, borderRadius: Spacing.four, gap: Spacing.two },
});
