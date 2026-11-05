import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MAX_LISTING_PHOTOS } from '@marketplace/shared';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PickedPhoto } from '@/lib/photos';

import { ThemedText } from './themed-text';

type Props = {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
  error?: string;
};

export function PhotoPicker({ photos, onChange, error }: Props) {
  const theme = useTheme();
  const remaining = MAX_LISTING_PHOTOS - photos.length;

  const add = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      orderedSelection: true,
      quality: 1, // compression happens once, in preparePhoto()
    });
    if (result.canceled) return;
    const added = result.assets.map(({ uri, width, height }) => ({ uri, width, height }));
    onChange([...photos, ...added].slice(0, MAX_LISTING_PHOTOS));
  };

  const remove = (index: number) => onChange(photos.filter((_, i) => i !== index));

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">
        Photos ({photos.length}/{MAX_LISTING_PHOTOS})
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.thumbWrap}>
            <Image source={photo.uri} style={styles.thumb} contentFit="cover" />
            {index === 0 ? (
              <View style={[styles.cover, { backgroundColor: theme.tint }]}>
                <ThemedText type="small" style={styles.coverLabel}>
                  Cover
                </ThemedText>
              </View>
            ) : null}
            <Pressable
              onPress={() => remove(index)}
              style={[styles.remove, { backgroundColor: theme.text }]}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${index + 1}`}
              hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                ×
              </ThemedText>
            </Pressable>
          </View>
        ))}
        {remaining > 0 ? (
          <Pressable
            onPress={add}
            style={[
              styles.thumb,
              styles.add,
              { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.backgroundSelected },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add photos">
            <ThemedText type="subtitle">+</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Add
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          The first photo is the cover. Clear, bright photos sell faster.
        </ThemedText>
      )}
    </View>
  );
}

const SIZE = 96;

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  row: { gap: Spacing.two },
  thumbWrap: { width: SIZE, height: SIZE },
  thumb: { width: SIZE, height: SIZE, borderRadius: Spacing.three },
  add: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  cover: {
    position: 'absolute',
    bottom: Spacing.one,
    left: Spacing.one,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.one,
  },
  coverLabel: { color: '#ffffff', fontSize: 11, lineHeight: 16 },
  remove: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
