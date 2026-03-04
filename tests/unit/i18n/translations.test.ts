import frMessages from '../../../messages/fr.json';
import enMessages from '../../../messages/en.json';

/**
 * Recursively extracts all keys from a nested object as dot-separated paths
 */
function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return getAllKeys(value, fullKey);
    }
    return [fullKey];
  });
}

/**
 * Recursively extracts all top-level keys
 */
function getTopLevelKeys(obj: Record<string, any>): string[] {
  return Object.keys(obj);
}

/**
 * Gets value at a dot-separated path
 */
function getValueAtPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

describe('Translation files consistency', () => {
  const frKeys = getAllKeys(frMessages);
  const enKeys = getAllKeys(enMessages);

  it('should have the same top-level keys in both fr.json and en.json', () => {
    const frTopLevel = getTopLevelKeys(frMessages).sort();
    const enTopLevel = getTopLevelKeys(enMessages).sort();
    expect(enTopLevel).toEqual(frTopLevel);
  });

  it('should have the same nested keys in both files', () => {
    const frSet = new Set(frKeys);
    const enSet = new Set(enKeys);

    const missingInEn = frKeys.filter(k => !enSet.has(k));
    const missingInFr = enKeys.filter(k => !frSet.has(k));

    if (missingInEn.length > 0) {
      console.warn('Keys in fr.json missing from en.json:', missingInEn);
    }
    if (missingInFr.length > 0) {
      console.warn('Keys in en.json missing from fr.json:', missingInFr);
    }

    expect(missingInEn).toEqual([]);
    expect(missingInFr).toEqual([]);
  });

  it('should have no empty string values in en.json', () => {
    const emptyKeys = enKeys.filter(key => {
      const value = getValueAtPath(enMessages, key);
      return typeof value === 'string' && value.trim() === '';
    });

    if (emptyKeys.length > 0) {
      console.warn('Empty values in en.json:', emptyKeys);
    }

    expect(emptyKeys).toEqual([]);
  });

  it('should have no empty string values in fr.json', () => {
    const emptyKeys = frKeys.filter(key => {
      const value = getValueAtPath(frMessages, key);
      return typeof value === 'string' && value.trim() === '';
    });

    expect(emptyKeys).toEqual([]);
  });

  it('should have at least 100 translation keys', () => {
    expect(frKeys.length).toBeGreaterThanOrEqual(100);
    expect(enKeys.length).toBeGreaterThanOrEqual(100);
  });
});
