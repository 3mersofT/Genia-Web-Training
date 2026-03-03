'use client';

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, TrendingUp, DollarSign, 
  BookOpen, MessageCircle, Award, Settings,
  BarChart3, PieChart, Calendar, AlertCircle,
  CheckCircle, XCircle, Clock, Filter,
  Download, RefreshCw, Search, Eye, Shield,
  LogOut
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    revenue: 0,
    completionRate: 0,
    avgSessionTime: 0,
    totalMessages: 0,
    tokensUsed: 0
  });
  
  const router = useRouter();
  const supabase = createClient();

  // Vérification des droits admin
  useEffect(() => {
    checkAdminAccess();
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Contournement temporaire - utiliser l'email si pas de profile
    let userRole = profile?.role;
    if (!userRole && user.email) {
      if (user.email.includes('admin@') || user.email.startsWith('admin@')) {
        userRole = 'admin';
        console.log('Admin page: Using email-based admin access');
      }
    }

    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setIsAdmin(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Charger les statistiques depuis la base de données
      const [
        usersResult,
        messagesResult,
        progressResult,
        usageResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact' }),
        supabase.from('chat_messages').select('*', { count: 'exact' }),
        supabase.from('user_progress').select('*'),
        supabase.from('llm_usage').select('*')
      ]);

      // Calculer les stats
      const totalUsers = usersResult.count || 0;
      const activeUsers = usersResult.data?.filter((u: any) => {
        const lastSeen = new Date(u.updated_at);
        const daysSinceActive = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive < 7;
      }).length || 0;

      // Calculer les nouvelles inscriptions d'aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = usersResult.data?.filter((u: any) => {
        const createdAt = new Date(u.created_at);
        return createdAt >= today;
      }).length || 0;

      const totalMessages = messagesResult.count || 0;
      
      // Calculer tokens utilisés
      const tokensUsed = usageResult.data?.reduce((sum: number, usage: any) => sum + usage.total_tokens, 0) || 0;
      
      // Calculer le taux de complétion moyen
      const avgCompletion = progressResult.data?.reduce((sum: number, p: any) => {
        const completed = p.completed_capsules || 0;
        return sum + (completed / 36 * 100);
      }, 0) / (progressResult.data?.length || 1);

      setStats({
        totalUsers,
        activeUsers,
        newUsersToday,
        revenue: totalUsers > 0 ? Math.round(totalUsers * 29.99) : 0, // Prix plus réaliste
        completionRate: Math.round(avgCompletion || 0),
        avgSessionTime: 0, // À implémenter avec de vraies données
        totalMessages,
        tokensUsed
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès Restreint</h2>
          <p className="text-muted-foreground">Cette page est réservée aux administrateurs</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Administration</h1>
              <p className="text-sm text-muted-foreground">GENIA Web Training Platform</p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Barre de recherche globale */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher utilisateur, contenu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus-visible:ring-ring"
                />
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg mt-1 z-50">
                    <div className="p-2 text-sm text-muted-foreground border-b">Résultats de recherche</div>
                    <div className="p-2 hover:bg-accent cursor-pointer">
                      <div className="font-medium">Marie Dupont</div>
                      <div className="text-xs text-muted-foreground">marie.dupont@entreprise.com • Utilisateur</div>
                    </div>
                    <div className="p-2 hover:bg-accent cursor-pointer">
                      <div className="font-medium">Module 1 - Fondamentaux</div>
                      <div className="text-xs text-muted-foreground">Contenu • 12 capsules</div>
                    </div>
                    <div className="p-2 text-xs text-muted-foreground border-t">
                      Recherche : "{searchQuery}"
                    </div>
                  </div>
                )}
              </div>

              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
              <button 
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-muted border-b px-6 py-2">
        <nav className="flex items-center space-x-2 text-sm">
          <a href="/" className="text-primary hover:text-primary/80">GENIA</a>
          <span className="text-muted-foreground">/</span>
          <a href="/admin" className="text-primary hover:text-primary/80">Administration</a>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">Vue d'ensemble</span>
        </nav>
      </div>

      {/* Navigation */}
      <div className="bg-card border-b px-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </div>
          </button>
          <a
            href="/admin/users"
            className="py-3 px-1 border-b-2 border-transparent font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </div>
          </a>
          <a
            href="/admin/analytics"
            className="py-3 px-1 border-b-2 border-transparent font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Utilisation IA
            </div>
          </a>
          <a
            href="/admin/content"
            className="py-3 px-1 border-b-2 border-transparent font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Contenu
            </div>
          </a>
          <a
            href="/admin/feedback"
            className="py-3 px-1 border-b-2 border-transparent font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Feedbacks
            </div>
          </a>
          <a
            href="/admin/settings"
            className="py-3 px-1 border-b-2 border-transparent font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </div>
          </a>
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <>
            {/* Alertes système */}
            <div className="mb-6">
              {stats.totalUsers > 0 && stats.completionRate < 50 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                    <p className="text-yellow-700 text-sm">
                      <strong>Attention :</strong> Taux de complétion faible ({stats.completionRate}%).
                    </p>
                  </div>
                </div>
              )}
              
              {stats.tokensUsed > 50000 && (
                <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      <strong>Quota élevé :</strong> {Math.round(stats.tokensUsed / 1000)}k tokens utilisés ce mois.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cartes de statistiques enrichies */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Carte Utilisateurs avec mini-graphique */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  {stats.newUsersToday > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      +{stats.newUsersToday} aujourd'hui
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">Utilisateurs totaux</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {stats.activeUsers} actifs cette semaine
                </p>
                {stats.totalUsers > 0 && (
                  <div className="mt-3 h-8 bg-blue-50 rounded flex items-center justify-center">
                    <span className="text-xs text-blue-600">Données réelles</span>
                  </div>
                )}
              </div>

              {/* Carte Revenus avec tendance */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold">{stats.revenue}€</p>
                <p className="text-sm text-muted-foreground mt-1">Revenus estimés</p>
                {stats.revenue > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Revenus calculés
                  </p>
                )}
              </div>

              {/* Carte Complétion avec barre de progression */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Taux de complétion</p>
                <div className="mt-3">
                  <div className="bg-purple-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Carte Messages avec indicateur de charge */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="flex items-center text-xs">
                    <Activity className="w-3 h-3 text-orange-600 mr-1" />
                    <span className="text-orange-600">Actif</span>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-sm text-muted-foreground mt-1">Messages GENIA</p>
                <p className="text-xs text-orange-600 mt-2">
                  {Math.round(stats.tokensUsed / 1000)}k tokens utilisés
                </p>
              </div>
            </div>

            {/* Section Graphiques et Activité */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique évolution utilisateurs */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Évolution des inscriptions (7 derniers jours)
                </h3>
                <div className="h-32 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Graphique d'évolution</p>
                    <p className="text-xs text-muted-foreground mt-1">Données réelles en cours de collecte</p>
                  </div>
                </div>
              </div>

              {/* Activité récente */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Activité récente</h3>
                  <Eye className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  {stats.totalUsers === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">Aucune activité récente</p>
                      <p className="text-xs text-muted-foreground mt-1">Les logs d'activité apparaîtront ici</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">Logs d'activité en cours de développement</p>
                      <p className="text-xs text-muted-foreground mt-1">Données réelles bientôt disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="mt-6 bg-card rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a
                  href="/admin/users"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-border hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-foreground">Gérer utilisateurs</span>
                </a>
                <a
                  href="/admin/content"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-border hover:border-green-300 hover:bg-green-50 dark:bg-green-950/30 transition-colors"
                >
                  <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <span className="text-sm font-medium text-foreground">Contenu</span>
                </a>
                <a
                  href="/admin/analytics"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-border hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-foreground">Analytics IA</span>
                </a>
                <a
                  href="/admin/settings"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-border hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <Settings className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-foreground">Paramètres</span>
                </a>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}