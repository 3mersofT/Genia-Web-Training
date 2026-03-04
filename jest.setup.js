// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Global mock for next-intl used across all i18n-enabled components
jest.mock('next-intl', () => {
  const frMessages = require('./messages/fr.json');
  return {
    useTranslations: (namespace) => {
      const parts = namespace ? namespace.split('.') : [];
      let section = frMessages;
      for (const p of parts) {
        section = section?.[p];
      }
      const t = (key, params) => {
        const keyParts = key.split('.');
        let val = section;
        for (const k of keyParts) {
          val = val?.[k];
        }
        if (val == null) return key;
        if (typeof val === 'string' && params) {
          return val.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
        }
        return val;
      };
      return t;
    },
    useLocale: () => 'fr',
    useMessages: () => frMessages,
    NextIntlClientProvider: ({ children }) => children,
  };
});

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};
