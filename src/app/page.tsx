'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { BRAND, BRAND_FULL_NAME, BRAND_NAME } from '@/config/branding';
import {
  fadeInUp, staggerContainer, staggerItem, hoverLift, scaleIn, duration
} from '@/lib/animation-presets';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Brain, Trophy, Users,
  CheckCircle, Star, Zap, BookOpen, MessageCircle,
  ChevronDown, Play, Award, TrendingUp, Globe,
  Linkedin, Mail, GraduationCap, Lightbulb,
  LogIn, UserPlus
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('landing');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeGENIATab, setActiveGENIATab] = useState(0);

  const features = [
    {
      icon: Brain,
      title: t('features.ai.title'),
      description: t('features.ai.description')
    },
    {
      icon: GraduationCap,
      title: t('features.method.title'),
      description: t('features.method.description')
    },
    {
      icon: Award,
      title: t('features.certificate.title'),
      description: t('features.certificate.description')
    },
    {
      icon: Trophy,
      title: t('features.gamification.title'),
      description: t('features.gamification.description')
    }
  ];

  const methodLetters = ['G', 'E', 'N', 'I', 'A'] as const;
  const methodColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-indigo-500 to-indigo-600',
  ];
  const methodology = methodLetters.map((letter, i) => ({
    letter,
    title: t(`methodology.${letter}.title`),
    color: methodColors[i],
    description: t(`methodology.${letter}.description`),
    details: t(`methodology.${letter}.details`),
  }));

  const stats = [
    { value: "3", label: t('stats.modules'), icon: BookOpen },
    { value: "36", label: t('stats.capsules'), icon: Lightbulb },
    { value: "3h", label: t('stats.training'), icon: TrendingUp },
    { value: "1", label: t('stats.certificate'), icon: Award }
  ];

  const testimonials = [
    {
      name: "Marie L.",
      role: "Product Manager",
      content: `${BRAND_NAME} m'a permis de passer de novice à experte en prompt engineering en seulement 3 mois !`,
      rating: 5
    },
    {
      name: "Thomas D.",
      role: "Développeur",
      content: "La méthode pédagogique est brillante. J'utilise maintenant l'IA 10x plus efficacement.",
      rating: 5
    },
    {
      name: "Sophie M.",
      role: "Consultante",
      content: "Une formation complète et structurée, avec un accompagnement personnalisé exceptionnel.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: `Qu'est-ce que ${BRAND_FULL_NAME} ?`,
      answer: `${BRAND_FULL_NAME} est une plateforme de formation au Prompt Engineering, utilisant l'IA Mistral et une méthode pédagogique unique en 5 piliers. Notre assistant ${BRAND_NAME} accompagne les apprenants inscrits tout au long de leur parcours.`
    },
    {
      question: `Comment fonctionne l'assistant ${BRAND_NAME} ?`,
      answer: `${BRAND_NAME} est un assistant pédagogique exclusivement réservé aux apprenants inscrits. Il applique notre méthode en 5 piliers pour vous guider, vous donner des exemples adaptés, proposer des exercices et suivre vos progrès tout au long de votre formation.`
    },
    {
      question: "À qui s'adresse cette formation ?",
      answer: "Du débutant complet au professionnel confirmé, notre méthode adaptative s'ajuste à votre niveau et votre rythme d'apprentissage. Idéal pour les managers, développeurs, consultants et tous les professionnels souhaitant maîtriser l'IA."
    },
    {
      question: "Quelle est la durée de la formation ?",
      answer: "La formation complète représente environ 3 heures de contenu réparti en 36 capsules. Vous progressez à votre rythme, avec un accès illimité dans le temps à tous les contenus et mises à jour."
    },
    {
      question: `Qu'est-ce que la ${BRAND.method.name} ?`,
      answer: `La ${BRAND.method.name} est notre approche pédagogique exclusive en 5 piliers : Guide progressif, Exemples concrets, Niveau adaptatif, Interaction pratique et Assessment continu. Cette méthode garantit un apprentissage efficace et durable.`
    },
    {
      question: "Quel est le prix de la formation ?",
      answer: "Le prix sera communiqué lors du lancement officiel. Nous préparons une offre de lancement exceptionnelle pour les premiers inscrits. Inscrivez-vous à notre liste d'attente pour être informé en priorité !"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Header avec zone de connexion */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo GENIA */}
            <div className="flex items-center gap-3">
              <Image 
                src={BRAND.assets.logo} 
                alt={`${BRAND_NAME} Logo`} 
                width={48} 
                height={48}
                className="w-12 h-12 object-contain"
              />
              <span className="text-xl font-bold font-display text-gradient">
                {BRAND_FULL_NAME}
              </span>
            </div>
            
            {/* Zone de connexion */}
            <nav aria-label="Main navigation">
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 text-foreground bg-card border border-input rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('hero.login')}
                </Link>
                <Button variant="brand" asChild>
                  <Link href="/register">
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('hero.register')}
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section avec Logo GENIA en arrière-plan */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-end))] to-pink-50 dark:to-pink-950/30 opacity-70" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse" />
          {/* Logo GENIA en filigrane */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
            <Image 
              src={BRAND.assets.logo} 
              alt="" 
              width={600} 
              height={600}
              className="w-[600px] h-[600px] object-contain"
            />
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            {/* Logo GENIA central */}
            <div className="mb-8 flex justify-center">
              <Image 
                src={BRAND.assets.logo} 
                alt={`${BRAND_NAME} Logo`} 
                width={120} 
                height={120}
                className="w-30 h-30 object-contain animate-pulse"
              />
            </div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold font-display text-foreground mb-6"
            >
              {t('hero.title')}
              <span className="text-gradient"> Prompt Engineering</span>
              <br />{t('hero.titleHighlight')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
            >
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button variant="brand" size="lg" asChild className="px-8 py-4 h-auto text-base font-semibold rounded-xl">
                <Link href="/register">
                  <Play className="w-5 h-5 mr-2" />
                  {t('hero.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 py-4 h-auto text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <a href="#method">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('hero.ctaSecondary')}
                </a>
              </Button>
            </motion.div>
            
            {/* Stats corrigées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={index} variants={staggerItem} {...hoverLift}>
                  <div className="bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-[hsl(228,80%,66%)] to-[hsl(271,37%,46%)] rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* GENIA Method Section avec logo */}
      <section id="method" className="py-20 bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] relative">
        {/* Logo en filigrane */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image 
            src={BRAND.assets.logo} 
            alt="" 
            width={400} 
            height={400}
            className="w-[400px] h-[400px] object-contain"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              {t('methodology.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('methodology.subtitle')}
            </p>
          </motion.div>
          
          {/* Lettres GENIA horizontales */}
          <div className="flex justify-center gap-4 mb-8">
            {methodology.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveGENIATab(index)}
                className={`group transition-all duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeGENIATab === index ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg ${activeGENIATab === index ? 'ring-4 ring-white ring-offset-2' : ''}`}>
                  {item.letter}
                </div>
              </button>
            ))}
          </div>
          
          {/* Contenu de l'onglet actif */}
          <div className="bg-card rounded-xl shadow-xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {methodology[activeGENIATab].title}
            </h3>
            <p className="text-lg text-foreground mb-4">
              {methodology[activeGENIATab].description}
            </p>
            <p className="text-muted-foreground">
              {methodology[activeGENIATab].details}
            </p>
          </div>
          
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-card px-6 py-3 rounded-full shadow-lg">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-foreground font-medium">
                {t('methodology.authorCredit')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Prix caché */}
      <section id="pricing" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('pricing.subtitle')}
            </p>
          </motion.div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-2xl shadow-2xl overflow-hidden p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">{t('pricing.planTitle')}</h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 px-4 py-2 rounded-full inline-block mb-4">
                  🎉 {t('pricing.comingSoon')}
                </div>
                <p className="text-muted-foreground">
                  {t('pricing.priceInfo')}
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {(['unlimited', 'assistant', 'modules', 'certificate', 'updates', 'support'] as const).map((key) => (
                  <li key={key} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{t(`pricing.features.${key}`)}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant="brand" size="lg" asChild className="w-full h-auto px-8 py-4 text-base font-semibold rounded-xl">
                <Link href="/register">
                  {t('waitlist')}
                </Link>
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('pricing.earlyInfo')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('testimonials.subtitle')}
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={staggerItem} {...hoverLift} className="bg-card rounded-xl p-6 shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mr-3" />
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              {t('faq.title')}
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-muted rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <motion.div animate={{ rotate: openFaq === index ? 180 : 0 }} transition={{ duration: duration.fast }}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: duration.normal }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 border-t border-border bg-card">
                        <p className="text-foreground">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            {t('contact.title')}
          </h3>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.linkedin.com/in/hemersonkoffi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Linkedin className="w-5 h-5 mr-2" />
              LinkedIn
            </a>
            <a 
              href="mailto:contact@geniawebtraining.com" 
              className="inline-flex items-center px-6 py-3 bg-card text-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[hsl(228,80%,66%)] to-[hsl(271,37%,46%)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center px-8 py-4 bg-card text-primary font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Zap className="w-5 h-5 mr-2" />
              {t('cta.register')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="#method" className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <BookOpen className="w-5 h-5 mr-2" />
              {t('cta.method')}
            </a>
          </div>
        </div>
      </section>
      </main>

      {/* Footer avec logo */}
      <footer className="bg-background text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image 
                src={BRAND.assets.logo} 
                alt={`${BRAND_NAME} Logo`} 
                width={32} 
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold">{BRAND_FULL_NAME}</span>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('footer.description')}
            </p>
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h4 className="font-semibold mb-4">{t('footer.training')}</h4>
                <div className="flex justify-center gap-4 text-muted-foreground text-sm">
                  <Link href="/dashboard" className="hover:text-white transition-colors">{t('footer.program')}</Link>
                  <span className="text-muted-foreground">|</span>
                  <a href="#method" className="hover:text-white transition-colors">{t('footer.method')}</a>
                  <span className="text-muted-foreground">|</span>
                  <Link href="/dashboard/achievements" className="hover:text-white transition-colors">{t('footer.certificates')}</Link>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">{t('footer.resources')}</h4>
                <div className="flex justify-center gap-4 text-muted-foreground text-sm">
                  <Link href="/blog" className="hover:text-white transition-colors">{t('footer.blog')}</Link>
                  <span className="text-muted-foreground">|</span>
                  <Link href="/docs" className="hover:text-white transition-colors">{t('footer.documentation')}</Link>
                  <span className="text-muted-foreground">|</span>
                  <Link href="/support" className="hover:text-white transition-colors">{t('footer.support')}</Link>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">{t('footer.info')}</h4>
                <div className="flex justify-center gap-4 text-muted-foreground text-sm">
                  <Link href="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
                  <span className="text-muted-foreground">|</span>
                  <Link href="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
                  <span className="text-muted-foreground">|</span>
                  <Link href="/about" className="hover:text-white transition-colors">{t('footer.about')}</Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}