'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const currentLocale = (typeof document !== 'undefined'
    ? document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1]
    : 'fr') || 'fr';

  const handleChange = (value: string) => {
    document.cookie = `NEXT_LOCALE=${value};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  };

  return (
    <Select value={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-auto gap-2 h-9 px-3 text-sm">
        <Globe className="w-4 h-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            <span className="flex items-center gap-2">
              <span>{locale === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
              <span>{localeNames[locale]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
