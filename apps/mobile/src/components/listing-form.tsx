import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  CONDITIONS,
  listingSchema,
  type ListingFormInput,
  type ListingFormOutput,
} from '@marketplace/shared';

import { Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import type { PickedPhoto } from '@/lib/photos';

import { PhotoPicker } from './photo-picker';
import { ThemedText } from './themed-text';
import { Button } from './ui/button';
import { Chip } from './ui/chip';
import { TextField } from './ui/text-field';

type Props = {
  defaultValues: ListingFormInput;
  submitLabel: string;
  /** Photo editing is only offered when creating a listing (v1). */
  withPhotos?: boolean;
  onSubmit: (values: ListingFormOutput, photos: PickedPhoto[]) => Promise<string | null>;
  busyLabel?: string | null;
};

export const EMPTY_LISTING: ListingFormInput = {
  title: '',
  description: '',
  price: '',
  category_slug: '',
  condition: '' as ListingFormInput['condition'],
  brand: '',
  region: '',
};

export function ListingForm({ defaultValues, submitLabel, withPhotos, onSubmit, busyLabel }: Props) {
  const categories = useCategories();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(listingSchema), defaultValues });

  const submit = handleSubmit(async (values) => {
    if (withPhotos && photos.length === 0) {
      setPhotoError('Add at least one photo.');
      return;
    }
    setServerError(null);
    const error = await onSubmit(values, photos);
    if (error) setServerError(error);
  });

  return (
    <View style={styles.form}>
      {withPhotos ? (
        <PhotoPicker
          photos={photos}
          onChange={(next) => {
            setPhotos(next);
            setPhotoError(undefined);
          }}
          error={photoError}
        />
      ) : null}

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Title"
            placeholder="e.g. Trek road bike, 56cm"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.title?.message}
            maxLength={80}
          />
        )}
      />

      <Controller
        control={control}
        name="price"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Price (R)"
            placeholder="0"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.price?.message}
            keyboardType="decimal-pad"
          />
        )}
      />

      <Controller
        control={control}
        name="category_slug"
        render={({ field: { onChange, value } }) => (
          <View style={styles.group}>
            <ThemedText type="smallBold">Category</ThemedText>
            <View style={styles.chips}>
              {categories.map((category) => (
                <Chip
                  key={category.slug}
                  label={category.name}
                  selected={value === category.slug}
                  onPress={() => onChange(category.slug)}
                />
              ))}
            </View>
            {errors.category_slug ? (
              <ThemedText type="small" themeColor="danger">
                {errors.category_slug.message}
              </ThemedText>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="condition"
        render={({ field: { onChange, value } }) => (
          <View style={styles.group}>
            <ThemedText type="smallBold">Condition</ThemedText>
            <View style={styles.chips}>
              {CONDITIONS.map((condition) => (
                <Chip
                  key={condition.value}
                  label={condition.label}
                  selected={value === condition.value}
                  onPress={() => onChange(condition.value)}
                />
              ))}
            </View>
            {errors.condition ? (
              <ThemedText type="small" themeColor="danger">
                {errors.condition.message}
              </ThemedText>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="brand"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Brand (optional)"
            placeholder="e.g. Samsung, Nike, Trek"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.brand?.message}
            hint="Helps buyers search and gives better price suggestions later"
          />
        )}
      />

      <Controller
        control={control}
        name="region"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Area"
            placeholder="e.g. Cape Town"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.region?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Description"
            placeholder="Size, age, any wear or faults, what's included, collection or delivery…"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            multiline
            style={styles.description}
            textAlignVertical="top"
          />
        )}
      />

      {serverError ? (
        <ThemedText type="small" themeColor="danger">
          {serverError}
        </ThemedText>
      ) : null}
      {busyLabel ? (
        <ThemedText type="small" themeColor="textSecondary">
          {busyLabel}
        </ThemedText>
      ) : null}

      <Button title={submitLabel} onPress={() => submit()} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  description: { minHeight: 120, paddingTop: Spacing.two },
});
