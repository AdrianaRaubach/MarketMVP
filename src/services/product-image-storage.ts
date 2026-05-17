import { getLocalProductImageUrl, getUploadDriver, type UploadDriver } from '../config/upload';

export type StoredProductImage = {
  imageUrl: string;
  imageStorage: UploadDriver;
};

export async function storeProductImage(file?: Express.Multer.File): Promise<StoredProductImage | null> {
  if (!file) {
    return null;
  }

  const uploadDriver = getUploadDriver();

  return {
    imageUrl: getLocalProductImageUrl(file),
    imageStorage: 'local',
  };
}
