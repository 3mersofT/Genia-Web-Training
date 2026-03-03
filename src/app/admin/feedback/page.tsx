'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Filter, Search, CheckCircle, XCircle, 
  Archive, Eye, EyeOff, Calendar, User, Tag, AlertCircle 
} from 'lucide-react';

interface Feedback {
  id: string;
  feedback_type: string;
  target_id: string;
  rating: number;
  comment: string | null;
  categories: string[];
  is_anonymous: boolean;
  user_name: string | null;
  user_email: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface FeedbackStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  average_rating: number;
}

export default function FeedbackManagementPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    average_rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch('/api/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
        calculateStats(data.feedbacks || []);
      }
    } catch (error) {
      console.error('Erreur récupération feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (feedbacks: Feedback[]) => {
    const total = feedbacks.length;
    const pending = feedbacks.filter(f => f.status === 'pending').length;
    const approved = feedbacks.filter(f => f.status === 'approved').length;
    const rejected = feedbacks.filter(f => f.status === 'rejected').length;
    const average_rating = total > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / total 
      : 0;

    setStats({ total, pending, approved, rejected, average_rating });
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setFeedbacks(prev => 
          prev.map(f => f.id === id ? { ...f, status } : f)
        );
        calculateStats(feedbacks.map(f => f.id === id ? { ...f, status } : f));
      }
    } catch (error) {
      console.error('Erreur mise à jour status:', error);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = searchTerm === '' || 
      feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.target_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
    const matchesType = typeFilter === 'all' || feedback.feedback_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800';
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800';
      case 'archived': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'module': return '📚';
      case 'capsule': return '🎯';
      case 'platform': return '🌐';
      default: return '💬';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestion des Feedbacks
          </h1>
          <p className="text-muted-foreground">
            Gérez et modérez les retours des apprenants
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approuvés</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Note moyenne</p>
                <p className="text-2xl font-bold text-foreground">{stats.average_rating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher dans les feedbacks..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="module">Modules</option>
                <option value="capsule">Capsules</option>
                <option value="platform">Plateforme</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Feedbacks ({filteredFeedbacks.length})
            </h2>
          </div>

          <div className="divide-y divide-border">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="p-6 hover:bg-accent">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(feedback.feedback_type)}</span>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {feedback.feedback_type === 'platform' 
                            ? 'Plateforme GENIA' 
                            : `Target: ${feedback.target_id}`
                          }
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(feedback.created_at).toLocaleDateString('fr-FR')}</span>
                          {!feedback.is_anonymous && feedback.user_name && (
                            <>
                              <span>•</span>
                              <User className="w-4 h-4" />
                              <span>{feedback.user_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      {renderStars(feedback.rating)}
                      <span className="text-sm font-medium text-foreground">
                        {feedback.rating}/5
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                        {feedback.status}
                      </span>
                    </div>

                    {feedback.comment && (
                      <p className="text-foreground mb-3">{feedback.comment}</p>
                    )}

                    {feedback.categories.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <div className="flex gap-1">
                          {feedback.categories.map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {feedback.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'approved')}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:bg-green-900/30 rounded-lg transition-colors"
                          title="Approuver"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'rejected')}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors"
                          title="Rejeter"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setSelectedFeedback(feedback)}
                      className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFeedbacks.length === 0 && (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun feedback trouvé
              </h3>
              <p className="text-muted-foreground">
                Aucun feedback ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
