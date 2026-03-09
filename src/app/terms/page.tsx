import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BRAND } from '@/config/branding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections = [
    'purpose',
    'access',
    'intellectualProperty',
    'personalData',
    'liability',
    'modifications',
    'contact',
    'applicableLaw',
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToHome')}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('lastUpdated')}
        </p>

        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle>{t(`sections.${section}.title`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`sections.${section}.content`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>{t('contactInfo', { email: BRAND.email.supportAddress })}</p>
        </div>
      </div>
    </div>
  );
}
