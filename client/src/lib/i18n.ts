import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
import enTranslation from '../locales/en.json';
import arTranslation from '../locales/ar.json';
import urTranslation from '../locales/ur.json';
import hiTranslation from '../locales/hi.json';
import bnTranslation from '../locales/bn.json';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ar: {
        translation: arTranslation
      },
      ur: {
        translation: urTranslation
      },
      hi: {
        translation: hiTranslation
      },
      bn: {
        translation: bnTranslation
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;