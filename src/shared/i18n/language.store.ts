import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

const LANGUAGE_STORAGE_KEY = 'app_language';

type AppLanguageStore = {
  language: LanguageValue;
  isHydrated: boolean;
  setLanguage: (language: LanguageValue) => Promise<void>;
  hydrateLanguage: () => Promise<void>;
};

export function normalizeLanguage(value: unknown): LanguageValue {
  if (value === 'zh-CN' || value === 'zh-TW' || value === 'en' || value === 'ms') {
    return value;
  }

  return 'zh-TW';
}

export const useAppLanguageStore = create<AppLanguageStore>((set) => ({
  language: 'zh-TW',
  isHydrated: false,

  setLanguage: async (language) => {
    set({ language });
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  },

  hydrateLanguage: async () => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      set({
        language: normalizeLanguage(storedLanguage),
        isHydrated: true,
      });
    } catch (error) {
      console.log('[LanguageStore] hydrate failed:', error);

      set({
        language: 'zh-TW',
        isHydrated: true,
      });
    }
  },
}));
