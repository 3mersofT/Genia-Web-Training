// Service de gestion des thèmes et préférences UI
import { createClient } from '@/lib/supabase/client';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  isDark: boolean;
}

export interface UserPreferences {
  theme: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  keyboardShortcuts: boolean;
  autoSave: boolean;
  notificationSounds: boolean;
  language: string;
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Clair',
    description: 'Thème lumineux et moderne',
    isDark: false,
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#8B5CF6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    }
  },
  {
    id: 'dark',
    name: 'Sombre',
    description: 'Thème sombre pour les yeux',
    isDark: true,
    colors: {
      primary: '#60A5FA',
      secondary: '#9CA3AF',
      accent: '#A78BFA',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#374151',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171'
    }
  },
  {
    id: 'blue',
    name: 'Océan',
    description: 'Thème bleu professionnel',
    isDark: false,
    colors: {
      primary: '#0891B2',
      secondary: '#0F766E',
      accent: '#06B6D4',
      background: '#F0F9FF',
      surface: '#E0F2FE',
      text: '#0C4A6E',
      textSecondary: '#0369A1',
      border: '#BAE6FD',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626'
    }
  },
  {
    id: 'purple',
    name: 'Violet',
    description: 'Thème créatif et moderne',
    isDark: false,
    colors: {
      primary: '#7C3AED',
      secondary: '#A855F7',
      accent: '#C084FC',
      background: '#FAFAF9',
      surface: '#F5F3FF',
      text: '#581C87',
      textSecondary: '#7C2D92',
      border: '#DDD6FE',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626'
    }
  },
  {
    id: 'green',
    name: 'Nature',
    description: 'Thème vert apaisant',
    isDark: false,
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10B981',
      background: '#F0FDF4',
      surface: '#DCFCE7',
      text: '#064E3B',
      textSecondary: '#065F46',
      border: '#BBF7D0',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444'
    }
  }
];

export interface KeyboardShortcut {
  id: string;
  keys: string;
  description: string;
  action: string;
  category: string;
}

export const keyboardShortcuts: KeyboardShortcut[] = [
  // Navigation
  { id: 'nav-dashboard', keys: 'Ctrl+1', description: 'Aller au dashboard', action: 'navigate_dashboard', category: 'Navigation' },
  { id: 'nav-users', keys: 'Ctrl+2', description: 'Aller aux utilisateurs', action: 'navigate_users', category: 'Navigation' },
  { id: 'nav-analytics', keys: 'Ctrl+3', description: 'Aller aux analytics', action: 'navigate_analytics', category: 'Navigation' },
  { id: 'nav-content', keys: 'Ctrl+4', description: 'Aller au contenu', action: 'navigate_content', category: 'Navigation' },
  { id: 'nav-settings', keys: 'Ctrl+5', description: 'Aller aux paramètres', action: 'navigate_settings', category: 'Navigation' },
  
  // Actions
  { id: 'search', keys: 'Ctrl+K', description: 'Ouvrir la recherche', action: 'open_search', category: 'Actions' },
  { id: 'new-user', keys: 'Ctrl+N', description: 'Nouvel utilisateur', action: 'create_user', category: 'Actions' },
  { id: 'refresh', keys: 'F5', description: 'Actualiser', action: 'refresh', category: 'Actions' },
  { id: 'save', keys: 'Ctrl+S', description: 'Sauvegarder', action: 'save', category: 'Actions' },
  
  // Notifications
  { id: 'notifications', keys: 'Ctrl+B', description: 'Ouvrir notifications', action: 'open_notifications', category: 'Interface' },
  { id: 'help', keys: 'F1', description: 'Aide', action: 'open_help', category: 'Interface' },
  { id: 'theme-toggle', keys: 'Ctrl+Shift+T', description: 'Changer thème', action: 'toggle_theme', category: 'Interface' },
  
  // Développement
  { id: 'dev-console', keys: 'F12', description: 'Console développeur', action: 'open_devtools', category: 'Développement' }
];

class ThemeService {
  private supabase = createClient();
  private currentTheme: Theme = themes[0];
  private preferences: UserPreferences = {
    theme: 'light',
    compactMode: false,
    animationsEnabled: true,
    keyboardShortcuts: true,
    autoSave: true,
    notificationSounds: true,
    language: 'fr'
  };

  constructor() {
    this.loadTheme();
    this.initKeyboardShortcuts();
  }

  /**
   * 🎨 Charger le thème utilisateur
   */
  async loadTheme() {
    try {
      // Charger depuis localStorage d'abord
      const savedTheme = localStorage.getItem('admin-theme');
      if (savedTheme) {
        this.applyTheme(savedTheme);
      }

      // Puis charger depuis Supabase
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const preferences = await this.getUserPreferences(user.id);
        if (preferences) {
          this.preferences = preferences;
          this.applyTheme(preferences.theme);
        }
      }
    } catch (error) {
      console.error('Erreur chargement thème:', error);
    }
  }

  /**
   * 🎯 Appliquer un thème
   */
  applyTheme(themeId: string) {
    const theme = themes.find(t => t.id === themeId) || themes[0];
    this.currentTheme = theme;

    // Appliquer les CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Ajouter/retirer classe dark
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sauvegarder en localStorage
    localStorage.setItem('admin-theme', themeId);
  }

  /**
   * 🔄 Changer de thème
   */
  async switchTheme(themeId: string) {
    this.applyTheme(themeId);
    this.preferences.theme = themeId;
    
    // Sauvegarder en base
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      await this.saveUserPreferences(user.id, this.preferences);
    }
  }

  /**
   * 🌓 Basculer entre clair/sombre
   */
  async toggleTheme() {
    const currentIsDark = this.currentTheme.isDark;
    const newTheme = currentIsDark ? 
      themes.find(t => !t.isDark) || themes[0] : 
      themes.find(t => t.isDark) || themes[1];
    
    await this.switchTheme(newTheme.id);
  }

  /**
   * 🛠️ Obtenir le thème actuel
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 📋 Obtenir tous les thèmes
   */
  getAllThemes(): Theme[] {
    return themes;
  }

  /**
   * ⚙️ Gérer les préférences utilisateur
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      return data?.preferences || null;
    } catch (error) {
      return null;
    }
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({ user_id: userId, preferences });

      return !error;
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      return false;
    }
  }

  /**
   * ⌨️ Gestion des raccourcis clavier
   */
  private initKeyboardShortcuts() {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      if (!this.preferences.keyboardShortcuts) return;

      const key = this.getKeyString(event);
      const shortcut = keyboardShortcuts.find(s => s.keys === key);
      
      if (shortcut) {
        event.preventDefault();
        this.executeShortcut(shortcut.action);
      }
    });
  }

  private getKeyString(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    
    if (event.key.length === 1) {
      parts.push(event.key.toUpperCase());
    } else {
      parts.push(event.key);
    }
    
    return parts.join('+');
  }

  private executeShortcut(action: string) {
    switch (action) {
      case 'navigate_dashboard':
        window.location.href = '/admin';
        break;
      case 'navigate_users':
        window.location.href = '/admin/users';
        break;
      case 'navigate_analytics':
        window.location.href = '/admin/analytics';
        break;
      case 'navigate_content':
        window.location.href = '/admin/content';
        break;
      case 'navigate_settings':
        window.location.href = '/admin/settings';
        break;
      case 'open_search':
        // Déclencher l'ouverture de la recherche
        const searchTrigger = document.querySelector('[data-search-trigger]') as HTMLElement;
        searchTrigger?.click();
        break;
      case 'toggle_theme':
        this.toggleTheme();
        break;
      case 'refresh':
        window.location.reload();
        break;
      default:
        console.log('Raccourci non implémenté:', action);
    }
  }

  /**
   * 📚 Obtenir la liste des raccourcis
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return keyboardShortcuts;
  }

  /**
   * 🔧 Mettre à jour les préférences
   */
  async updatePreferences(updates: Partial<UserPreferences>) {
    this.preferences = { ...this.preferences, ...updates };
    
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      await this.saveUserPreferences(user.id, this.preferences);
    }
  }

  /**
   * 📱 Obtenir les préférences actuelles
   */
  getPreferences(): UserPreferences {
    return this.preferences;
  }
}

// Instance singleton
export const themeService = new ThemeService();
