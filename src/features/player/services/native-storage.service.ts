import { NativeModules, Platform } from 'react-native';

export type NativeStorageVolume = {
  path: string;
  freeBytes: number;
  totalBytes: number;
  isRemovable?: boolean;
  isPrimary?: boolean;
};

const { NativeStorageManager } = NativeModules;

export const nativeStorageService = {
  isAvailable() {
    return Platform.OS === 'android' && Boolean(NativeStorageManager);
  },

  async getAvailableStorageVolumes(): Promise<NativeStorageVolume[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const volumes = await NativeStorageManager.getAvailableStorageVolumes();

    if (!Array.isArray(volumes)) {
      return [];
    }

    return volumes;
  },
};
