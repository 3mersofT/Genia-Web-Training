import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BRAND } from '@/config/branding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';

export default function SupportPage() {
  const t = useTranslations('support');

  const faqKeys = ['resetPassword', 'howAiWorks', 'dataSecurity', 'contactSupport'] as const;

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
          {t('subtitle')}
        </p>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('faq.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqKeys.map((key) => (
                <details key={key} className="group border-b border-border last:border-0 pb-4 last:pb-0">
                  <summary className="cursor-pointer font-medium text-foreground hover:text-foreground/80 transition-colors list-none flex items-center justify-between">
                    {t(`faq.items.${key}.question`)}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                      &#9660;
                    </span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {t(`faq.items.${key}.answer`)}
                  </p>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>{t('needHelp.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('needHelp.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button>
                  {t('needHelp.contactButton')}
                </Button>
              </Link>
              <a href={`mailto:${BRAND.email.supportAddress}`}>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  {BRAND.email.supportAddress}
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
