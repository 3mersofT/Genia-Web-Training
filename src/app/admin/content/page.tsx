'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contentSyncService, ContentSyncStatus } from '@/lib/services/contentSync';
import {
  BookOpen, FileText, Users, Trophy, Star, TrendingUp,
  Edit, Eye, EyeOff, Save, X, Plus, Trash2, GripVertical,
  ChevronDown, ChevronRight, BarChart, Clock, Target,
  RefreshCw, Database, HardDrive, AlertTriangle, CheckCircle,
  RefreshCcw, Settings, Download, Upload
} from 'lucide-react';

interface Module {
  id: string;
  order_index: number;
  title: string;
  short_title: string;
  description: string;
  icon: string;
  color: string;
  duration_minutes: number;
  difficulty: string;
  is_published: boolean;
  capsules: Capsule[];
  stats: {
    totalViews: number;
    completions: number;
    avgScore: number;
    avgTime: number;
  };
}

interface Capsule {
  id: string;
  module_id: string;
  order_index: number;
  title: string;
  duration_minutes: number;
  difficulty: string;
  is_published: boolean;
  tags: string[];
  stats: {
    views: number;
    completions: number;
    avgScore: number;
    avgTime: number;
  };
}

export default function ContentManagementPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingCapsule, setEditingCapsule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddCapsule, setShowAddCapsule] = useState<string | null>(null);
  const [newModuleForm, setNewModuleForm] = useState({
    title: '',
    short_title: '',
    description: '',
    difficulty: 'beginner',
    icon: '📚'
  });

  // États pour le système hybride
  const [syncStatus, setSyncStatus] = useState<ContentSyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchContent();
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    try {
      const status = await contentSyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erreur lors de la vérification du sync:', error);
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Charger les modules depuis les fichiers JSON locaux
      const { getAllModules } = await import('@/lib/data');
      const jsonModules = await getAllModules();

      // Chargement des données réelles; valeurs neutres si aucune donnée
      console.log('🔄 Chargement des données de contenu (réelles) ...');
      
      // Convertir au format attendu par l'interface admin
      const adminModules: Module[] = await Promise.all(jsonModules.map(async (jsonModule) => {
        const capsuleStats = await Promise.all(jsonModule.capsules.map(async (capsule) => {
          let stats;
          let isRealData = false;
          
          try {
            // 1️⃣ Essayer d'abord les vraies données Supabase
            const realStats = await contentSyncService.getProgressStats(capsule.id);
            
            // 2️⃣ Vérifier si on a des données significatives
            const hasSignificantData = (
              realStats.totalUsers > 0 || 
              realStats.completions > 0 || 
              realStats.avgScore > 0
            );
            
            if (hasSignificantData) {
              // ✅ Utiliser les vraies données
              stats = {
                views: realStats.totalUsers || 0,
                completions: realStats.completions || 0,
                avgScore: Math.round(realStats.avgScore) || 0,
                avgTime: Math.round(realStats.avgTime / 60) || capsule.duration || 15
              };
              isRealData = true;
              console.log(`✅ ${capsule.title}: Vraies données (${stats.completions} complétions)`);
            } else {
              throw new Error('Pas de données significatives');
            }
          } catch (error) {
            // 3️⃣ Fallback : Données neutres en absence de stats
            stats = {
              views: 0, // Pas de vues fictives
              completions: 0, // Pas de complétions fictives  
              avgScore: 0, // Score neutre
              avgTime: capsule.duration || 15 // Durée théorique du module
            };
            isRealData = false;
            console.log(`⭐ ${capsule.title}: Prêt pour les données utilisateurs`);
          }

          return {
            id: capsule.id,
            module_id: jsonModule.id,
            order_index: capsule.order || 1,
            title: capsule.title,
            duration_minutes: capsule.duration || 15,
            difficulty: capsule.difficulty || 'beginner',
            is_published: true,
            tags: [],
            stats: {
              ...stats,
              isRealData
            }
          };
        }));

        // 📊 Calculer les stats du module
        const moduleStats = {
          totalViews: capsuleStats.reduce((sum, c) => sum + c.stats.views, 0),
          completions: capsuleStats.reduce((sum, c) => sum + c.stats.completions, 0),
          avgScore: Math.round(capsuleStats.reduce((sum, c) => sum + c.stats.avgScore, 0) / capsuleStats.length),
          avgTime: capsuleStats.reduce((sum, c) => sum + c.stats.avgTime, 0)
        };

        return {
          id: jsonModule.id,
          order_index: parseInt(jsonModule.id.replace(/[^\d]/g, '')) || 1,
          title: jsonModule.title,
          short_title: jsonModule.shortTitle || jsonModule.title.substring(0, 20),
          description: jsonModule.description,
          icon: jsonModule.id.includes('1') ? '🚀' : jsonModule.id.includes('2') ? '⚡' : '🎯',
          color: jsonModule.color,
          duration_minutes: jsonModule.duration || 180,
          difficulty: jsonModule.difficulty || 'beginner',
          is_published: true,
          capsules: capsuleStats,
          stats: moduleStats
        };
      }));

      // 📈 Récapitulatif
      const totalCapsules = adminModules.reduce((sum, m) => sum + m.capsules.length, 0);
      const totalCompletions = adminModules.reduce((sum, m) => sum + (m.stats.completions || 0), 0);
      
      console.log(`🌟 DONNÉES CONTENU CHARGÉES:`);
      console.log(`   📊 ${adminModules.length} modules | ${totalCapsules} capsules`);
      console.log(`   🏆 ${totalCompletions} complétions totales`);
      
      setModules(adminModules);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu depuis JSON:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour la gestion hybride
  const handleSyncToSupabase = async () => {
    setSyncLoading(true);
    try {
      // Récupérer l'ID admin
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id || 'admin';

      const result = await contentSyncService.syncJsonToSupabase(adminId);
      
      if (result.success) {
        alert(result.message);
        await checkSyncStatus(); // Recharger le statut
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Erreur sync:', error);
      alert('❌ Erreur lors de la synchronisation');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleToggleModulePublication = async (moduleId: string, isPublished: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id || 'admin';

      const success = await contentSyncService.updateModuleConfig(
        moduleId,
        { is_published: !isPublished },
        adminId
      );

      if (success) {
        // Recharger les modules
        await fetchContent();
        alert(`Module ${!isPublished ? 'publié' : 'dépublié'} avec succès`);
      } else {
        alert('❌ Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur toggle publication:', error);
    }
  };

  const handleBulkOperation = async (operation: 'publish' | 'unpublish' | 'delete') => {
    if (selectedModules.size === 0) {
      alert('Veuillez sélectionner au moins un module');
      return;
    }

    const action = operation === 'publish' ? 'publier' : operation === 'unpublish' ? 'dépublier' : 'supprimer';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${selectedModules.size} module(s) ?`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id || 'admin';

      for (const moduleId of selectedModules) {
        if (operation === 'delete') {
          // Pour la suppression, on marque comme non publié
          await contentSyncService.updateModuleConfig(
            moduleId,
            { is_published: false, admin_notes: 'Supprimé par admin' },
            adminId
          );
        } else {
          await contentSyncService.updateModuleConfig(
            moduleId,
            { is_published: operation === 'publish' },
            adminId
          );
        }
      }

      setSelectedModules(new Set());
      await fetchContent();
      alert(`✅ ${selectedModules.size} module(s) ${action}(s) avec succès`);
    } catch (error) {
      console.error(`Erreur ${operation}:`, error);
      alert(`❌ Erreur lors de l'opération ${action}`);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleModuleUpdate = async (module: Module) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          title: module.title,
          short_title: module.short_title,
          description: module.description,
          is_published: module.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', module.id);

      if (error) throw error;
      
      setEditingModule(null);
      fetchContent();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du module:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleCapsuleUpdate = async (capsule: Capsule) => {
    try {
      const { error } = await supabase
        .from('capsules')
        .update({
          title: capsule.title,
          is_published: capsule.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', capsule.id);

      if (error) throw error;
      
      setEditingCapsule(null);
      fetchContent();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la capsule:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleTogglePublish = async (type: 'module' | 'capsule', id: string, currentStatus: boolean) => {
    try {
      // Simulation de mise à jour - dans un vrai système, cela sauvegarderait dans les fichiers JSON
      console.log(`Basculer publication ${type} ${id} : ${currentStatus} -> ${!currentStatus}`);
      
      // Mettre à jour localement
      setModules(prevModules => 
        prevModules.map(module => {
          if (type === 'module' && module.id === id) {
            return { ...module, is_published: !currentStatus };
          }
          if (type === 'capsule') {
            return {
              ...module,
              capsules: module.capsules.map(capsule => 
                capsule.id === id ? { ...capsule, is_published: !currentStatus } : capsule
              )
            };
          }
          return module;
        })
      );
      
      alert(`Statut de publication mis à jour pour ${type} ${id}`);
    } catch (error) {
      console.error(`Erreur lors de la modification du statut de publication:`, error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleCreateModule = async () => {
    try {
      if (!newModuleForm.title.trim() || !newModuleForm.short_title.trim()) {
        alert('Veuillez remplir au moins le titre et le titre court');
        return;
      }

      const newModule: Module = {
        id: `module-${Date.now()}`,
        order_index: modules.length + 1,
        title: newModuleForm.title,
        short_title: newModuleForm.short_title,
        description: newModuleForm.description,
        icon: newModuleForm.icon,
        color: '#3B82F6',
        duration_minutes: 0,
        difficulty: newModuleForm.difficulty as 'beginner' | 'intermediate' | 'advanced',
        is_published: false,
        capsules: [],
        stats: {
          totalViews: 0,
          completions: 0,
          avgScore: 0,
          avgTime: 0
        }
      };

      setModules(prevModules => [...prevModules, newModule]);
      
      // Reset le formulaire
      setNewModuleForm({
        title: '',
        short_title: '',
        description: '',
        difficulty: 'beginner',
        icon: '📚'
      });
      
      setShowAddModule(false);
      alert('Nouveau module créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du module:', error);
      alert('Erreur lors de la création du module');
    }
  };

  const handleCreateCapsule = async (moduleId: string) => {
    try {
      const capsuleTitle = prompt('Titre de la nouvelle capsule:');
      if (!capsuleTitle) return;

      const newCapsule: Capsule = {
        id: `capsule-${Date.now()}`,
        module_id: moduleId,
        order_index: 1,
        title: capsuleTitle,
        duration_minutes: 10,
        difficulty: 'beginner',
        is_published: false,
        tags: [],
        stats: {
          views: 0,
          completions: 0,
          avgScore: 0,
          avgTime: 0
        }
      };

      setModules(prevModules => 
        prevModules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              capsules: [...module.capsules, newCapsule]
            };
          }
          return module;
        })
      );

      setShowAddCapsule(null);
      alert('Nouvelle capsule créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la capsule:', error);
      alert('Erreur lors de la création de la capsule');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 dark:bg-green-900/30 text-green-800';
      case 'intermediate': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800';
      case 'advanced': return 'bg-red-100 dark:bg-red-900/30 text-red-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <a href="/admin" className="text-primary hover:text-primary/80 font-medium">← Dashboard Admin</a>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-xl font-bold text-foreground">Gestion du Contenu</h1>
          </div>
          <p className="text-muted-foreground">Gérez les modules, capsules et contenus pédagogiques</p>
        </div>
        
        {/* Quick Navigation */}
        <div className="px-6 pb-2">
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="/admin/users" className="text-muted-foreground hover:text-foreground">Utilisateurs</a>
            <a href="/admin/analytics" className="text-muted-foreground hover:text-foreground">Analytics</a>
            <a href="/admin/content" className="text-primary font-medium">Contenu</a>
            <a href="/admin/settings" className="text-muted-foreground hover:text-foreground">Paramètres</a>
          </nav>
        </div>
      </div>
      
      <div className="p-6">

      {/* Panneau de synchronisation */}
      {showSyncPanel && (
        <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <RefreshCcw className="w-5 h-5 mr-2" />
              Synchronisation JSON ↔ Supabase
            </h3>
            <button
              onClick={() => setShowSyncPanel(false)}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {syncStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Modules JSON</p>
                  <p className="font-semibold">{syncStatus.jsonModules}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Config Supabase</p>
                  <p className="font-semibold">{syncStatus.supabaseModules}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Dernière sync</p>
                  <p className="font-semibold text-xs">
                    {syncStatus.lastSync 
                      ? new Date(syncStatus.lastSync).toLocaleString('fr-FR')
                      : 'Jamais'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSyncToSupabase}
              disabled={syncLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {syncLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Synchroniser JSON → Supabase
            </button>
            <button
              onClick={checkSyncStatus}
              className="flex items-center gap-2 px-4 py-2 bg-muted-foreground text-white rounded-lg hover:bg-accent"
            >
              <RefreshCw className="w-4 h-4" />
              Vérifier statut
            </button>
          </div>

          {syncStatus?.conflicts && syncStatus.conflicts.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
                <p className="text-red-700 dark:text-red-300 font-semibold">Conflits détectés</p>
              </div>
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400">
                {syncStatus.conflicts.map((conflict, index) => (
                  <li key={index}>• {conflict}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setShowSyncPanel(!showSyncPanel)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showSyncPanel ? 'bg-blue-600 text-white' : 'bg-card border border-input text-foreground hover:bg-accent'
            }`}
          >
            <RefreshCcw className="w-4 h-4" />
            Synchronisation
            {syncStatus?.syncNeeded && (
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </button>
          
          {selectedModules.size > 0 && (
            <>
              <button
                onClick={() => handleBulkOperation('publish')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Eye className="w-4 h-4" />
                Publier ({selectedModules.size})
              </button>
              <button
                onClick={() => handleBulkOperation('unpublish')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <EyeOff className="w-4 h-4" />
                Dépublier ({selectedModules.size})
              </button>
              <button
                onClick={() => handleBulkOperation('delete')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer ({selectedModules.size})
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={() => setShowAddModule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau module
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Modules actifs</p>
              <p className="text-2xl font-bold text-foreground">
                {modules.filter(m => m.is_published).length} / {modules.length}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Capsules totales</p>
              <p className="text-2xl font-bold text-foreground">
                {modules.reduce((sum, m) => sum + m.capsules.length, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Complétions totales</p>
              <p className="text-2xl font-bold text-foreground">
                {modules.reduce((sum, m) => sum + m.stats.completions, 0)}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score moyen</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(modules.reduce((sum, m) => sum + m.stats.avgScore, 0) / (modules.length || 1))}%
              </p>
            </div>
            <Star className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 🌟 Panneau Données Réelles */}
      <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Statistiques basées sur les données réelles</h3>
              <p className="text-sm text-muted-foreground">Données réelles uniquement.</p>
            </div>
          </div>
          <div />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          💡 Les statistiques se mettront à jour automatiquement lorsque des apprenants progressent.
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Structure des modules</h2>
        <button
          onClick={() => setShowAddModule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau module
        </button>
      </div>

      {/* Liste des modules */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-card rounded-lg shadow p-8 text-center text-muted-foreground">
            Chargement...
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-8 text-center text-muted-foreground">
            Aucun module trouvé
          </div>
        ) : (
          modules.map(module => (
            <div key={module.id} className="bg-card rounded-lg shadow">
              {/* Header du module */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Checkbox de sélection */}
                    <input
                      type="checkbox"
                      checked={selectedModules.has(module.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedModules);
                        if (e.target.checked) {
                          newSelected.add(module.id);
                        } else {
                          newSelected.delete(module.id);
                        }
                        setSelectedModules(newSelected);
                      }}
                      className="w-4 h-4 text-blue-600 border-input rounded focus-visible:ring-ring"
                    />
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    
                    {editingModule === module.id ? (
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => {
                          const updated = modules.map(m =>
                            m.id === module.id ? { ...m, title: e.target.value } : m
                          );
                          setModules(updated);
                        }}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          Module {module.order_index}: {module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Statistiques */}
                    <div className="flex items-center gap-4 mr-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Vues</p>
                        <p className="text-sm font-bold">{module.stats.totalViews}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Complétions</p>
                        <p className="text-sm font-bold">{module.stats.completions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Score moy.</p>
                        <p className="text-sm font-bold">{Math.round(module.stats.avgScore)}%</p>
                      </div>
                      
                      {/* 📊 Indicateur qualité des données du module */}
                      <div className="text-center ml-3">
                        <p className="text-xs text-muted-foreground">Données</p>
                        <div 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (module.stats as any).dataQuality === 'mostly-real' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : (module.stats as any).dataQuality === 'hybrid'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                          }`}
                          title={`${(module.stats as any).realDataCount || 0} données réelles`}
                        >
                          {(module.stats as any).dataQuality === 'mostly-real' && '🟢 Réelles'}
                          {(module.stats as any).dataQuality === 'hybrid' && '🟡 Partielles'}
                          {(module.stats as any).dataQuality === 'simulated' && '⭐ Prêt'}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {editingModule === module.id ? (
                      <>
                        <button
                          onClick={() => handleModuleUpdate(module)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-950/30 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingModule(null);
                            fetchContent();
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/30 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingModule(module.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish('module', module.id, module.is_published)}
                          className={`p-2 rounded ${
                            module.is_published
                              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-950/30'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {module.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Capsules du module */}
              {expandedModules.has(module.id) && (
                <div className="p-4 bg-muted">
                  <div className="mb-3 flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-foreground">
                      Capsules ({module.capsules.length})
                    </h4>
                    <button
                      onClick={() => setShowAddCapsule(module.id)}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      + Ajouter une capsule
                    </button>
                  </div>

                  <div className="space-y-2">
                    {module.capsules.map(capsule => (
                      <div key={capsule.id} className="bg-card rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">#{capsule.order_index}</span>
                          
                          {editingCapsule === capsule.id ? (
                            <input
                              type="text"
                              value={capsule.title}
                              onChange={(e) => {
                                const updated = modules.map(m => ({
                                  ...m,
                                  capsules: m.capsules.map(c =>
                                    c.id === capsule.id ? { ...c, title: e.target.value } : c
                                  )
                                }));
                                setModules(updated);
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{capsule.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(capsule.difficulty)}`}>
                                  {getDifficultyLabel(capsule.difficulty)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {capsule.duration_minutes} min
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Stats de la capsule */}
                        <div className="flex items-center gap-3 mr-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Vues</p>
                            <p className="text-xs font-bold">{capsule.stats.views}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Complété</p>
                            <p className="text-xs font-bold">{capsule.stats.completions}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="text-xs font-bold">{capsule.stats.avgScore}%</p>
                          </div>
                          
                          {/* 🏷️ Indicateur de source des données */}
                          <div className="text-center ml-2">
                            <div 
                              className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                (capsule.stats as any).isRealData 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                              }`}
                              title={
                                (capsule.stats as any).isRealData 
                                  ? 'Données réelles depuis progressions utilisateur' 
                                  : 'Prêt pour les beta testeurs - données apparaîtront automatiquement'
                              }
                            >
                              {(capsule.stats as any).isRealData ? '✅ Réel' : '⭐ Prêt'}
                            </div>
                          </div>
                        </div>

                        {/* Actions de la capsule */}
                        {editingCapsule === capsule.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCapsuleUpdate(capsule)}
                              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-950/30 rounded"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCapsule(null);
                                fetchContent();
                              }}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/30 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingCapsule(capsule.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish('capsule', capsule.id, capsule.is_published)}
                              className={`p-1 rounded ${
                                capsule.is_published
                                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-950/30'
                                  : 'text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              {capsule.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Note d'information */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note :</strong> Les modifications de contenu des capsules (texte, exercices) doivent être effectuées
              directement dans les fichiers JSON correspondants dans le dossier <code>src/data/modules/</code>.
              Cette interface permet uniquement de gérer la visibilité et l'ordre des contenus.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de création de module */}
      {showAddModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Nouveau Module</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newModuleForm.title}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Titre court *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newModuleForm.short_title}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, short_title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    rows={3}
                    value={newModuleForm.description}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Difficulté
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newModuleForm.difficulty}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Icône
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newModuleForm.icon}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📚"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-between">
              <button
                onClick={() => setShowAddModule(false)}
                className="px-4 py-2 text-foreground border border-input rounded-md hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateModule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Créer le module
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}