'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BRAND } from '@/config/branding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import { scaleIn } from '@/lib/animation-presets';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t('form.successTitle'),
      description: t('form.successMessage'),
    });
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

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

        <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-8">
          {t('title')}
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('form.title')}</CardTitle>
                <CardDescription>{t('form.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('form.name')}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('form.subject')}</Label>
                    <Select value={subject} onValueChange={setSubject} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.subjectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="question">{t('form.subjects.question')}</SelectItem>
                        <SelectItem value="bug">{t('form.subjects.bug')}</SelectItem>
                        <SelectItem value="partnership">{t('form.subjects.partnership')}</SelectItem>
                        <SelectItem value="other">{t('form.subjects.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('form.message')}</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" variant={submitted ? "default" : "brand"} className="w-full">
                    {submitted ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {/* TODO: i18n */}Envoye !
                      </motion.span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <a
                    href={`mailto:${BRAND.email.supportAddress}`}
                    className="text-foreground hover:underline"
                  >
                    {BRAND.email.supportAddress}
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('info.responseTime')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
