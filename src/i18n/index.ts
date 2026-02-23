import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/src/i18n/locales/en/common.json'
import heCommon from '@/src/i18n/locales/he/common.json'

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon },
      he: { common: heCommon },
    },
    lng: 'he',
    fallbackLng: 'he',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
}

export default i18n
