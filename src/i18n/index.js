import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import ha from './ha';
import yo from './yo';
import ig from './ig';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
];
const SUPPORTED = LANGUAGES.map((l) => l.code);
const STORAGE_KEY = 'pharm36.language';

function deviceLanguage() {
  try {
    const code = Localization.getLocales?.()[0]?.languageCode;
    return SUPPORTED.includes(code) ? code : 'en';
  } catch {
    return 'en';
  }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ha: { translation: ha }, yo: { translation: yo }, ig: { translation: ig } },
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Apply the saved choice (or the phone's language) as soon as storage answers.
AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => i18n.changeLanguage(SUPPORTED.includes(saved) ? saved : deviceLanguage()))
  .catch(() => i18n.changeLanguage(deviceLanguage()));

export async function setLanguage(code) {
  if (!SUPPORTED.includes(code)) return;
  await i18n.changeLanguage(code);
  try { await AsyncStorage.setItem(STORAGE_KEY, code); } catch { /* choice still applies for this session */ }
}

export default i18n;
