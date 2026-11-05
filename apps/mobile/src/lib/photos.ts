import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
};

const MAX_EDGE = 1600;

/**
 * Downscales to at most 1600px on the long edge and re-encodes as JPEG (~200–400 KB),
 * which keeps uploads fast on mobile data and strips most metadata (e.g. GPS EXIF).
 */
export async function preparePhoto(photo: PickedPhoto): Promise<PickedPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  const longEdge = Math.max(photo.width, photo.height);
  if (longEdge > MAX_EDGE) {
    context.resize(photo.width >= photo.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return { uri: result.uri, width: result.width, height: result.height };
}
