import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BRAND, BRAND_FULL_NAME } from '@/config/branding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');

  const pillars = ['G', 'E', 'N', 'I', 'A'] as const;

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

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          {t('title')}
        </h1>

        {/* Presentation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('presentation.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {t('presentation.content')}
            </p>
          </CardContent>
        </Card>

        {/* Methode GENIA */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('method.title')}</CardTitle>
            <CardDescription>{t('method.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pillars.map((letter) => (
                <div key={letter} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {letter}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {BRAND.method.pillars[letter].name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t(`method.pillars.${letter}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technologies */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('technologies.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {t('technologies.content')}
            </p>
          </CardContent>
        </Card>

        {/* Createur */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('creator.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {t('creator.content')}
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {t('contactCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
