'use client';

import { useToast } from '@/hooks/use-toast';

/**
 * Wrapper de compatibilité pour l'ancien système de toast.
 * Conserve l'API showSuccess/showError/showInfo tout en utilisant shadcn/ui toast.
 */
export function useAppToast() {
  const { toast } = useToast();

  return {
    showSuccess: (message: string, title?: string, durationMs?: number) => {
      toast({
        title: title || 'Succès',
        description: message,
        variant: 'default',
        duration: durationMs,
      });
    },
    showError: (message: string, title?: string, durationMs?: number) => {
      toast({
        title: title || 'Erreur',
        description: message,
        variant: 'destructive',
        duration: durationMs,
      });
    },
    showInfo: (message: string, title?: string, durationMs?: number) => {
      toast({
        title: title || 'Information',
        description: message,
        duration: durationMs,
      });
    },
  };
}
