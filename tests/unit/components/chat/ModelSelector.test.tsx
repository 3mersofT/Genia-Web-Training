/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelSelector from '@/components/chat/ModelSelector';
import type { QuotaInfo, ModelType } from '@/components/chat/ModelSelector';

describe('ModelSelector', () => {
  const mockOnModelChange = jest.fn();

  const defaultQuota: QuotaInfo = {
    magistralMedium: { used: 5, daily: 10 },
    mistralMedium3: { used: 20, daily: 50 }
  };

  beforeEach(() => {
    mockOnModelChange.mockClear();
  });

  describe('Model Display', () => {
    it('should render both model options', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText(/🧠 Expert/)).toBeInTheDocument();
      expect(screen.getByText(/⚡ Pratique/)).toBeInTheDocument();
    });

    it('should show model descriptions', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText(/Raisonnement approfondi/)).toBeInTheDocument();
      expect(screen.getByText(/Réponses rapides/)).toBeInTheDocument();
    });

    it('should display selection header', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('Sélection du modèle')).toBeInTheDocument();
      expect(screen.getByText('Quotas journaliers')).toBeInTheDocument();
    });
  });

  describe('Model Switching', () => {
    it('should call onModelChange when clicking inactive model', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      const expertButton = screen.getByText(/🧠/).closest('button');
      fireEvent.click(expertButton!);

      expect(mockOnModelChange).toHaveBeenCalledWith('magistral-medium');
      expect(mockOnModelChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onModelChange when clicking active model', () => {
      render(
        <ModelSelector
          currentModel="magistral-medium"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      const expertButton = screen.getByText(/🧠/).closest('button');
      fireEvent.click(expertButton!);

      expect(mockOnModelChange).not.toHaveBeenCalled();
    });

    it('should switch from expert to practice model', () => {
      render(
        <ModelSelector
          currentModel="magistral-medium"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      const practiceButton = screen.getByText(/⚡/).closest('button');
      fireEvent.click(practiceButton!);

      expect(mockOnModelChange).toHaveBeenCalledWith('mistral-medium-3');
    });
  });

  describe('Quota Display', () => {
    it('should display quota for magistral-medium model', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      // Quota devrait être affiché: 5/10
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('should display quota for mistral-medium-3 model', () => {
      render(
        <ModelSelector
          currentModel="magistral-medium"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      // Quota devrait être affiché: 20/50
      expect(screen.getByText('20/50')).toBeInTheDocument();
    });

    it('should show both quotas simultaneously', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('5/10')).toBeInTheDocument();
      expect(screen.getByText('20/50')).toBeInTheDocument();
    });
  });

  describe('Quota Exhaustion', () => {
    it('should disable model when quota is exhausted', () => {
      const exhaustedQuota: QuotaInfo = {
        magistralMedium: { used: 10, daily: 10 },
        mistralMedium3: { used: 20, daily: 50 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={exhaustedQuota}
          onModelChange={mockOnModelChange}
        />
      );

      const expertButton = screen.getByText(/🧠/).closest('button');
      fireEvent.click(expertButton!);

      expect(mockOnModelChange).not.toHaveBeenCalled();
    });

    it('should show "Épuisé" badge when quota is exhausted', () => {
      const exhaustedQuota: QuotaInfo = {
        magistralMedium: { used: 10, daily: 10 },
        mistralMedium3: { used: 20, daily: 50 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={exhaustedQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('Épuisé')).toBeInTheDocument();
    });

    it('should disable both models when both quotas are exhausted', () => {
      const bothExhausted: QuotaInfo = {
        magistralMedium: { used: 10, daily: 10 },
        mistralMedium3: { used: 50, daily: 50 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={bothExhausted}
          onModelChange={mockOnModelChange}
        />
      );

      const expertButton = screen.getByText(/🧠/).closest('button');
      const practiceButton = screen.getByText(/⚡/).closest('button');

      fireEvent.click(expertButton!);
      fireEvent.click(practiceButton!);

      expect(mockOnModelChange).not.toHaveBeenCalled();
    });

    it('should handle quota exceeded (used > daily)', () => {
      const overQuota: QuotaInfo = {
        magistralMedium: { used: 15, daily: 10 },
        mistralMedium3: { used: 20, daily: 50 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={overQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('Épuisé')).toBeInTheDocument();
    });
  });

  describe('Active State Indicator', () => {
    it('should show checkmark on active model', () => {
      render(
        <ModelSelector
          currentModel="magistral-medium"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should move checkmark when switching models', () => {
      const { rerender } = render(
        <ModelSelector
          currentModel="magistral-medium"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();

      rerender(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should not show checkmark on exhausted active model', () => {
      const exhaustedQuota: QuotaInfo = {
        magistralMedium: { used: 10, daily: 10 },
        mistralMedium3: { used: 20, daily: 50 }
      };

      render(
        <ModelSelector
          currentModel="magistral-medium"
          quota={exhaustedQuota}
          onModelChange={mockOnModelChange}
        />
      );

      // Le badge "Épuisé" devrait être présent mais pas le checkmark
      expect(screen.getByText('Épuisé')).toBeInTheDocument();
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all models when disabled prop is true', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
          disabled={true}
        />
      );

      const expertButton = screen.getByText(/🧠/).closest('button');
      const practiceButton = screen.getByText(/⚡/).closest('button');

      fireEvent.click(expertButton!);
      fireEvent.click(practiceButton!);

      expect(mockOnModelChange).not.toHaveBeenCalled();
    });

    it('should apply disabled attribute to buttons when disabled', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
          disabled={true}
        />
      );

      const expertButton = screen.getByText(/🧠/).closest('button');
      const practiceButton = screen.getByText(/⚡/).closest('button');

      expect(expertButton).toBeDisabled();
      expect(practiceButton).toBeDisabled();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
          className="custom-selector"
        />
      );

      const rootElement = container.querySelector('.custom-selector');
      expect(rootElement).toBeInTheDocument();
    });
  });

  describe('Help Message', () => {
    it('should display helpful tip about model usage', () => {
      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={defaultQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText(/Conseil/)).toBeInTheDocument();
      expect(screen.getByText(/questions complexes/)).toBeInTheDocument();
      expect(screen.getByText(/réponses rapides/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quotas', () => {
      const zeroQuota: QuotaInfo = {
        magistralMedium: { used: 0, daily: 0 },
        mistralMedium3: { used: 0, daily: 0 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={zeroQuota}
          onModelChange={mockOnModelChange}
        />
      );

      const allZeroQuotas = screen.getAllByText('0/0');
      expect(allZeroQuotas).toHaveLength(2); // Both models show 0/0
    });

    it('should handle negative quota values gracefully', () => {
      const negativeQuota: QuotaInfo = {
        magistralMedium: { used: -5, daily: 10 },
        mistralMedium3: { used: 20, daily: 50 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={negativeQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('-5/10')).toBeInTheDocument();
    });

    it('should handle very large quota values', () => {
      const largeQuota: QuotaInfo = {
        magistralMedium: { used: 9999, daily: 10000 },
        mistralMedium3: { used: 50000, daily: 100000 }
      };

      render(
        <ModelSelector
          currentModel="mistral-medium-3"
          quota={largeQuota}
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByText('9999/10000')).toBeInTheDocument();
      expect(screen.getByText('50000/100000')).toBeInTheDocument();
    });
  });
});
