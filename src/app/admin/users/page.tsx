'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Users, Search, Filter, Download, UserCheck, UserX,
  Mail, Calendar, Activity, Shield, MoreVertical,
  ChevronLeft, ChevronRight, Eye, Lock, Trash2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  display_name: string;
  created_at: string;
  last_sign_in_at: string;
  onboarding_completed: boolean;
  total_points: number;
  modules_completed: number;
  last_activity: string;
  email_confirmed: boolean;
  email_confirmed_at: string | null;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    suspended?: boolean;
    suspended_at?: string;
  };
  username?: string; // Added for username
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'student'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    display_name: '',
    role: 'student' as 'admin' | 'student'
  });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const usersPerPage = 10;

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    // Réinitialiser les sélections quand on change de page
    setSelectedUserIds(new Set());
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Chargement des utilisateurs via l\'API sécurisée...');
      
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur API');
      }
      
      const data = await response.json();

      // Transformer les données
      const transformedUsers: User[] = data.map((profile: any) => {
        return {
          id: profile.user_id,
          email: profile.email || 'N/A',
          role: profile.role || 'student',
          display_name: profile.display_name || profile.email || 'Utilisateur',
          created_at: profile.created_at,
          last_sign_in_at: profile.last_sign_in_at || profile.updated_at,
          onboarding_completed: profile.onboarding_completed || false,
          total_points: profile.total_points || 0,
          modules_completed: profile.modules_completed || 0,
          last_activity: profile.updated_at,
          email_confirmed: !!profile.email_confirmed_at,
          email_confirmed_at: profile.email_confirmed_at || null,
          preferences: profile.preferences || {},
          // expose username for rendering
          username: (profile as any).username,
        } as any;
      }) || [];

      console.log(`Utilisateurs chargés: ${transformedUsers.length}`);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filtre par statut (basé sur dernière activité)
    if (filterStatus !== 'all') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filtered = filtered.filter(user => {
        const lastActivity = new Date(user.last_activity);
        if (filterStatus === 'active') {
          return lastActivity > thirtyDaysAgo;
        } else {
          return lastActivity <= thirtyDaysAgo;
        }
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleResetPasswordEmail = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        alert('Utilisateur non trouvé');
        return;
      }

      if (!user.email) return alert('Email utilisateur manquant');       
      if (confirm(`Réinitialiser le mot de passe de ${user.email} ?\nUn email sera envoyé à l'utilisateur.`)) {                                          
        const { error } = await supabase.auth.resetPasswordForEmail(user.email);                                                                         
        if (error) throw error;
        alert(`Email de réinitialisation envoyé à ${user.email}!`);      
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);       
      alert('Erreur lors de l\'envoi de l\'email de réinitialisation');  
    }
  };

  const handleChangePassword = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        alert('Utilisateur non trouvé');
        return;
      }
      alert("Pour des raisons de sécurité, seul l'envoi d'email de réinitialisation est permis côté admin. Utilisez 'Réinitialiser mot de passe'.");
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      alert('Utilisateur non trouvé');
      return;
    }

    const isSuspended = user.preferences?.suspended;
    const action = isSuspended ? 'réactiver' : 'suspendre';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?\n\nEmail: ${user.email}\nNom: ${user.display_name}`)) {
      try {
        // Utiliser l'API admin pour la suspension
        const response = await fetch('/api/admin/users/suspend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            suspended: !isSuspended
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur suspension');
        }
        
        // Mise à jour locale
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  preferences: { 
                    ...u.preferences, 
                    suspended: !isSuspended 
                  } 
                }
              : u
          )
        );
        
        alert(`✅ Utilisateur ${user.email} ${isSuspended ? 'réactivé' : 'suspendu'} !`);
      } catch (error) {
        console.error(`Erreur lors de la ${action}:`, error);
        alert(`Erreur lors de la ${action} de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      alert('Utilisateur non trouvé');
      return;
    }

    const newPassword = prompt(`Nouveau mot de passe pour ${user.email}:`);
    if (!newPassword) return;

    if (newPassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir changer le mot de passe de ${user.email} ?`)) {
      try {
        const response = await fetch('/api/admin/users/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            newPassword: newPassword
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur reset mot de passe');
        }

        alert(`✅ Mot de passe changé avec succès pour ${user.email} !`);
      } catch (error) {
        console.error('Erreur reset mot de passe:', error);
        alert(`Erreur lors du changement de mot de passe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const handleSendPasswordReset = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      alert('Utilisateur non trouvé');
      return;
    }

    if (confirm(`Envoyer un email de reset de mot de passe à ${user.email} ?`)) {
      try {
        const response = await fetch('/api/admin/users/reset-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur envoi email');
        }

        alert(`✅ Email de reset envoyé à ${user.email} !`);
      } catch (error) {
        console.error('Erreur envoi email reset:', error);
        alert(`Erreur lors de l'envoi de l'email: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const handleResendVerificationEmail = async (userEmail: string) => {
    if (confirm(`Renvoyer l'email de vérification à ${userEmail} ?`)) {
      try {
        const response = await fetch('/api/admin/users/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur API');
        }
        
        alert(`✅ Email de vérification renvoyé à ${userEmail} !`);
      } catch (error: any) {
        console.error('Erreur envoi email vérification:', error);
        alert(`Erreur lors de l'envoi de l'email: ${error.message}`);
      }
    }
  };

  const handleDeleteUser = async (userId: string, closeModal = false) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      alert('Utilisateur non trouvé');
      return;
    }

    if (confirm(`⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\nÊtes-vous sûr de vouloir supprimer définitivement l'utilisateur ?\n\nEmail: ${user.email}\nNom: ${user.display_name}\n\nCette action supprimera :\n- Le profil utilisateur\n- L'authentification\n- Toutes les données associées\n\nCette action est IRRÉVERSIBLE !`)) {
      try {
        // Suppression complète via API admin
        const response = await fetch(`/api/admin/users?userId=${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur suppression');
        }
        
        // Mise à jour locale
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        
        if (closeModal) {
          setShowUserModal(false);
        }
        
        alert(`✅ Utilisateur ${user.email} supprimé définitivement !`);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert(`Erreur lors de la suppression de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const handleCleanupDemoUsers = async () => {
    const testUsers = users.filter(user => 
      user.email.includes('@test.') || 
      user.email.includes('@demo.') || 
      user.email.includes('@example.')
    );
    
    if (testUsers.length === 0) {
      alert('Aucun utilisateur de test trouvé à supprimer.');
      return;
    }

    if (confirm(`🧹 NETTOYAGE DES UTILISATEURS DE TEST\n\nSupprimer ${testUsers.length} utilisateurs de test ?\n\n${testUsers.map(u => `• ${u.email}`).join('\n')}\n\nCette action est irréversible !`)) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .in('id', testUsers.map(u => u.id));

        if (error) throw error;
        
        await fetchUsers(); // Recharger la liste
        alert(`✅ ${testUsers.length} utilisateurs de test supprimés !`);
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
        alert('Erreur lors du nettoyage des utilisateurs de test');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) {
      alert('Veuillez sélectionner au moins un utilisateur à supprimer');
      return;
    }

    // Récupérer les utilisateurs sélectionnés
    const selectedUsers = users.filter(user => selectedUserIds.has(user.id));
    
    // Exclure l'admin de la suppression
    const usersToDelete = selectedUsers.filter(u => u.email !== 'admin@geniawebtraining.com');
    
    if (usersToDelete.length === 0) {
      alert('Aucun utilisateur supprimable sélectionné (admin exclu)');
      return;
    }

    const adminSelected = selectedUsers.length > usersToDelete.length;

    if (confirm(`⚠️ SUPPRESSION EN LOT ⚠️\n\nSupprimer ${usersToDelete.length} utilisateur${usersToDelete.length > 1 ? 's' : ''} sélectionné${usersToDelete.length > 1 ? 's' : ''} ?\n\n${usersToDelete.map(u => `• ${u.display_name} (${u.email})`).join('\n')}${adminSelected ? '\n\n⚠️ L\'administrateur sélectionné sera préservé' : ''}\n\nCette action est IRRÉVERSIBLE !`)) {
      try {
        const userIdsToDelete = usersToDelete.map(u => u.id);
        setUsers(prevUsers => prevUsers.filter(user => !userIdsToDelete.includes(user.id)));
        
        // Clear les sélections
        setSelectedUserIds(new Set());
        
        alert(`✅ ${usersToDelete.length} utilisateur${usersToDelete.length > 1 ? 's' : ''} supprimé${usersToDelete.length > 1 ? 's' : ''} !`);
      } catch (error) {
        console.error('Erreur lors de la suppression en lot:', error);
        alert('Erreur lors de la suppression en lot');
      }
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentPageUserIds = currentUsers.map(user => user.id);
    const allSelected = currentPageUserIds.every(id => selectedUserIds.has(id));
    
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Désélectionner tous les utilisateurs de la page
        currentPageUserIds.forEach(id => newSet.delete(id));
      } else {
        // Sélectionner tous les utilisateurs de la page
        currentPageUserIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Nom', 'Rôle', 'Date inscription', 'Points', 'Statut'];
    const csvData = filteredUsers.map(user => [
      user.email,
      user.display_name,
      user.role,
      new Date(user.created_at).toLocaleDateString('fr-FR'),
      user.total_points,
      new Date(user.last_activity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'Actif' : 'Inactif'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserForm.email.trim() || !newUserForm.display_name.trim()) {
        alert('Veuillez remplir l\'email et le nom d\'affichage');
        return;
      }

      // Vérifier si l'email existe déjà
      const existingUser = users.find(u => u.email.toLowerCase() === newUserForm.email.toLowerCase());
      if (existingUser) {
        alert('Un utilisateur avec cet email existe déjà');
        return;
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email.trim(),
        password: 'TempPassword123!', // Mot de passe temporaire
        email_confirm: true,
        user_metadata: {
          full_name: newUserForm.display_name.trim()
        },
        app_metadata: {
          role: newUserForm.role
        }
      });

      if (authError) throw authError;

      // Créer le profil utilisateur dans user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: newUserForm.email.trim(),
          display_name: newUserForm.display_name.trim(),
          role: newUserForm.role,
          preferences: {
            theme: 'light',
            language: 'fr',
            notifications: true
          },
          onboarding_completed: false
        });

      if (profileError) throw profileError;

      // Recharger la liste des utilisateurs
      await fetchUsers();
      
      // Reset le formulaire
      setNewUserForm({
        email: '',
        display_name: '',
        role: 'student'
      });
      
      setShowCreateUserModal(false);
      alert(`✅ Utilisateur ${newUserForm.email} créé avec succès !\n\nUn email d'invitation sera envoyé à l'utilisateur.`);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <a href="/admin" className="text-primary hover:text-primary/80 font-medium">← Dashboard Admin</a>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-xl font-bold text-foreground">Gestion des Utilisateurs</h1>
          </div>
          <p className="text-muted-foreground">Gérez les comptes et permissions des utilisateurs</p>
        </div>
        
        
        {/* Quick Navigation */}
        <div className="px-6 pb-2">
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="/admin/users" className="text-primary font-medium">Utilisateurs</a>
            <a href="/admin/analytics" className="text-muted-foreground hover:text-foreground">Analytics</a>
            <a href="/admin/content" className="text-muted-foreground hover:text-foreground">Contenu</a>
            <a href="/admin/settings" className="text-muted-foreground hover:text-foreground">Paramètres</a>
          </nav>
        </div>
      </div>
      
      <div className="p-6">

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Administrateurs</p>
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Étudiants</p>
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role === 'student').length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Actifs (30j)</p>
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => {
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return new Date(u.last_activity) > thirtyDaysAgo;
                }).length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-card rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par email ou nom..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus-visible:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus-visible:ring-ring"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="student">Étudiants</option>
            </select>
            
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus-visible:ring-ring"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Users className="w-5 h-5" />
              Nouvel utilisateur
            </button>
            <button
              onClick={handleCleanupDemoUsers}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              title="Supprimer tous les utilisateurs de démo"
            >
              🧹
              Nettoyer démo
            </button>
            <button
              onClick={handleBulkDelete}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                selectedUserIds.size > 0
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              disabled={selectedUserIds.size === 0}
              title={`Supprimer les ${selectedUserIds.size} utilisateur(s) sélectionné(s)`}
            >
              <Trash2 className="w-5 h-5" />
              Supprimer sélectionnés ({selectedUserIds.size})
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Indicateur de sélection */}
        {selectedUserIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="font-medium">
                  {selectedUserIds.size} utilisateur{selectedUserIds.size > 1 ? 's' : ''} sélectionné{selectedUserIds.size > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setSelectedUserIds(new Set())}
                className="text-primary hover:text-primary/80 text-sm underline"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
        )}

        {/* Table des utilisateurs */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUsers.length > 0 && currentUsers.every(user => selectedUserIds.has(user.id))}
                      onChange={handleSelectAll}
                      className="rounded border-input text-blue-600 focus-visible:ring-ring"
                    />
                    <span className="ml-2">Sélection</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nom d'utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => {
                  const isActive = new Date(user.last_activity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  const isEmailConfirmed = user.email_confirmed;
                  
                  return (
                    <tr key={user.id} className="hover:bg-accent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          disabled={user.email === 'admin@geniawebtraining.com'}
                          className="rounded border-input text-blue-600 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground flex items-center gap-2">
                            {user.display_name}
                            {!isEmailConfirmed && (
                              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                Email non confirmé
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        @{(user as any).username || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{user.total_points} pts</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.preferences?.suspended 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800' 
                            : !isEmailConfirmed
                              ? 'bg-orange-100 text-orange-800'
                              : isActive 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800' 
                                : 'bg-muted text-foreground'
                        }`}>
                          {user.preferences?.suspended 
                            ? 'Suspendu' 
                            : !isEmailConfirmed 
                              ? 'En attente' 
                              : (isActive ? 'Actif' : 'Inactif')
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-primary hover:text-primary/80"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isEmailConfirmed && (
                            <button
                              onClick={() => handleResendVerificationEmail(user.email)}
                              className="text-primary hover:text-primary/80"
                              title="Renvoyer email de vérification"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSendPasswordReset(user.id)}
                            className="text-orange-600 hover:text-orange-800"
                            title="Envoyer email de reset de mot de passe"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Changer mot de passe directement"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className={user.preferences?.suspended 
                              ? "text-green-600 dark:text-green-400 hover:text-green-800" 
                              : "text-yellow-600 hover:text-yellow-800"
                            }
                            title={user.preferences?.suspended ? "Réactiver utilisateur" : "Suspendre utilisateur"}
                          >
                            {user.preferences?.suspended ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800"
                            title="Supprimer définitivement"
                            disabled={user.email === 'admin@geniawebtraining.com'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-foreground">
              Affichage de {indexOfFirstUser + 1} à {Math.min(indexOfLastUser, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-accent'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal détails utilisateur */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">Détails de l'utilisateur</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom d'utilisateur</p>
                  <p className="font-medium">@{(selectedUser as any).username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom d'affichage</p>
                  <p className="font-medium">{selectedUser.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rôle</p>
                  <p className="font-medium">{selectedUser.role === 'admin' ? 'Administrateur' : 'Étudiant'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date d'inscription</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernière activité</p>
                  <p className="font-medium">{new Date(selectedUser.last_activity).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points totaux</p>
                  <p className="font-medium">{selectedUser.total_points}</p>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id, true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Supprimer définitivement
                  </button>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-accent"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création d'utilisateur */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Nouvel Utilisateur</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="utilisateur@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nom d'affichage *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newUserForm.display_name}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Nom et Prénom"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Rôle
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'student' }))}
                  >
                    <option value="student">Étudiant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-between">
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 text-foreground border border-input rounded-md hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}