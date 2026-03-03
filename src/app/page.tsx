'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Brain, Trophy, Users, 
  CheckCircle, Star, Zap, BookOpen, MessageCircle,
  ChevronDown, Play, Award, TrendingUp, Globe, 
  Linkedin, Mail, GraduationCap, Lightbulb,
  LogIn, UserPlus
} from 'lucide-react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeGENIATab, setActiveGENIATab] = useState(0);

  const features = [
    {
      icon: Brain,
      title: "IA Française Mistral",
      description: "Technologie de pointe française pour votre apprentissage"
    },
    {
      icon: GraduationCap,
      title: "Méthode GENIA",
      description: "5 piliers pédagogiques pour maîtriser le prompting"
    },
    {
      icon: Award,
      title: "Formation Certifiante",
      description: "Obtenez votre certificat de compétence reconnu"
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Badges, points et défis pour rester motivé"
    }
  ];

  const methodology = [
    { 
      letter: 'G', 
      title: 'Guide progressif', 
      color: 'from-blue-500 to-blue-600', 
      description: 'Apprentissage structuré étape par étape',
      details: 'Chaque concept est décomposé en étapes simples et progressives pour une compréhension optimale.'
    },
    { 
      letter: 'E', 
      title: 'Exemples concrets', 
      color: 'from-green-500 to-green-600', 
      description: 'Cas pratiques du monde réel',
      details: 'Des exemples tirés de situations professionnelles réelles pour une application immédiate.'
    },
    { 
      letter: 'N', 
      title: 'Niveau adaptatif', 
      color: 'from-purple-500 to-purple-600', 
      description: "Contenu qui s'ajuste à votre rythme",
      details: 'Le système s\'adapte automatiquement à votre niveau et votre vitesse d\'apprentissage.'
    },
    { 
      letter: 'I', 
      title: 'Interaction pratique', 
      color: 'from-orange-500 to-orange-600', 
      description: 'Exercices et défis engageants',
      details: 'Mettez en pratique immédiatement avec des exercices interactifs et des défis stimulants.'
    },
    { 
      letter: 'A', 
      title: 'Assessment continu', 
      color: 'from-indigo-500 to-indigo-600', 
      description: 'Évaluation bienveillante de vos progrès',
      details: 'Suivez vos progrès en temps réel avec des évaluations constructives et encourageantes.'
    }
  ];

  // Stats corrigées avec les vraies données
  const stats = [
    { value: "3", label: "Modules complets", icon: BookOpen },
    { value: "36", label: "Capsules", icon: Lightbulb },
    { value: "3h", label: "De formation", icon: TrendingUp },
    { value: "1", label: "Certificat", icon: Award }
  ];

  const testimonials = [
    {
      name: "Marie L.",
      role: "Product Manager",
      content: "GENIA m'a permis de passer de novice à experte en prompt engineering en seulement 3 mois !",
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
      question: "Qu'est-ce que GENIA Web Training ?",
      answer: "GENIA Web Training est une plateforme de formation au Prompt Engineering, utilisant l'IA Mistral et une méthode pédagogique unique en 5 piliers. Notre assistant GENIA accompagne les apprenants inscrits tout au long de leur parcours."
    },
    {
      question: "Comment fonctionne l'assistant GENIA ?",
      answer: "GENIA est un assistant pédagogique exclusivement réservé aux apprenants inscrits. Il applique notre méthode en 5 piliers pour vous guider, vous donner des exemples adaptés, proposer des exercices et suivre vos progrès tout au long de votre formation."
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
      question: "Qu'est-ce que la méthode GENIA ?",
      answer: "La méthode GENIA est notre approche pédagogique exclusive en 5 piliers : Guide progressif, Exemples concrets, Niveau adaptatif, Interaction pratique et Assessment continu. Cette méthode garantit un apprentissage efficace et durable."
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
                src="/logo/GENIA Logo.png" 
                alt="GENIA Logo" 
                width={48} 
                height={48}
                className="w-12 h-12 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GENIA Web Training
              </span>
            </div>
            
            {/* Zone de connexion */}
            <div className="flex gap-3">
              <Link 
                href="/login" 
                className="inline-flex items-center px-4 py-2 text-foreground bg-card border border-input rounded-lg hover:bg-accent transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section avec Logo GENIA en arrière-plan */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-end))] to-pink-50 dark:to-pink-950/30 opacity-70" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse" />
          {/* Logo GENIA en filigrane */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
            <Image 
              src="/logo/GENIA Logo.png" 
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
                src="/logo/GENIA Logo.png" 
                alt="GENIA Logo" 
                width={120} 
                height={120}
                className="w-30 h-30 object-contain animate-pulse"
              />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Maîtrisez le 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Prompt Engineering</span>
              <br />avec la Méthode GENIA
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Formation complète et structurée pour devenir expert 
              en intelligence artificielle générative
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                <Play className="w-5 h-5 mr-2" />
                Commencer la Formation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a href="#method" className="inline-flex items-center px-8 py-4 bg-card text-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-border">
                <MessageCircle className="w-5 h-5 mr-2" />
                Découvrir la Méthode
              </a>
            </div>
            
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Une plateforme pensée pour votre réussite
            </h2>
            <p className="text-xl text-muted-foreground">
              Tous les outils pour devenir expert en Prompt Engineering
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group hover:scale-105 transition-transform duration-200">
                  <div className="bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 h-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GENIA Method Section avec logo */}
      <section id="method" className="py-20 bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] relative">
        {/* Logo en filigrane */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image 
            src="/logo/GENIA Logo.png" 
            alt="" 
            width={400} 
            height={400}
            className="w-[400px] h-[400px] object-contain"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              La Méthode GENIA
            </h2>
            <p className="text-xl text-muted-foreground">
              Une approche pédagogique unique en 5 piliers
            </p>
          </div>
          
          {/* Lettres GENIA horizontales */}
          <div className="flex justify-center gap-4 mb-8">
            {methodology.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveGENIATab(index)}
                className={`group transition-all duration-300 ${activeGENIATab === index ? 'scale-110' : 'hover:scale-105'}`}
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
                Méthode développée par Hemerson KOFFI, expert en pédagogie IA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Prix caché */}
      <section id="pricing" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Investissez dans votre avenir professionnel
            </h2>
            <p className="text-xl text-muted-foreground">
              Une formation d'exception à un prix accessible
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-2xl shadow-2xl overflow-hidden p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Formation Complète</h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 px-4 py-2 rounded-full inline-block mb-4">
                  🎉 Lancement Bientôt
                </div>
                <p className="text-muted-foreground">
                  Le tarif sera communiqué lors du lancement officiel
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Accès illimité à la plateforme</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Assistant pédagogique GENIA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">3 modules complets (36 capsules)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Certificat de réussite officiel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Mises à jour régulières</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Support technique par email</span>
                </li>
              </ul>
              
              <Link href="/register" className="block w-full text-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                S'inscrire à la liste d'attente
              </Link>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                Soyez parmi les premiers informés du lancement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ils ont transformé leur carrière
            </h2>
            <p className="text-xl text-muted-foreground">
              Rejoignez nos apprenants satisfaits
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Questions Fréquentes
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-muted rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent transition-colors"
                >
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 border-t border-border bg-card">
                    <p className="text-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Des questions ? Contactez-nous
          </h3>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.linkedin.com/in/hemersonkoffi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Linkedin className="w-5 h-5 mr-2" />
              LinkedIn
            </a>
            <a 
              href="mailto:contact@geniawebtraining.com" 
              className="inline-flex items-center px-6 py-3 bg-card text-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-border"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à devenir expert en Prompt Engineering ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Rejoignez GENIA Web Training aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center px-8 py-4 bg-card text-primary font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <Zap className="w-5 h-5 mr-2" />
              S'inscrire maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="#method" className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-200">
              <BookOpen className="w-5 h-5 mr-2" />
              Voir la méthode
            </a>
          </div>
        </div>
      </section>

      {/* Footer avec logo */}
      <footer className="bg-background text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image 
                src="/logo/GENIA Logo.png" 
                alt="GENIA Logo" 
                width={32} 
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold">GENIA Web Training</span>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              Plateforme de formation au Prompt Engineering
            </p>
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h4 className="font-semibold mb-4">Formation</h4>
                <div className="flex justify-center gap-4 text-muted-foreground text-sm">
                  <Link href="/dashboard" className="hover:text-white transition-colors">Programme</Link>
                  <span className="text-muted-foreground">|</span>
                  <a href="#method" className="hover:text-white transition-colors">Méthode</a>
                  <span className="text-muted-foreground">|</span>
                  <Link href="/dashboard/achievements" className="hover:text-white transition-colors">Certificats</Link>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Ressources</h4>
                <div className="flex justify-center gap-4 text-muted-foreground text-sm">
                  <a href="#" className="hover:text-white transition-colors">Blog</a>
                  <span className="text-muted-foreground">|</span>
                  <a href="#" className="hover:text-white transition-colors">Documentation</a>
                  <span className="text-muted-foreground">|</span>
                  <a href="#" className="hover:text-white transition-colors">Support</a>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Informations</h4>
                <div className="flex justify-center gap-4 text-muted-foreground text-sm">
                  <a href="#" className="hover:text-white transition-colors">CGU</a>
                  <span className="text-muted-foreground">|</span>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
                  <span className="text-muted-foreground">|</span>
                  <a href="#" className="hover:text-white transition-colors">À propos</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>© 2025 GENIA Web Training. Créé par Hemerson KOFFI. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}