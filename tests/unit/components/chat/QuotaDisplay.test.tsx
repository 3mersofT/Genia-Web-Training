/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuotaDisplay from '@/components/chat/QuotaDisplay';

describe('QuotaDisplay', () => {
  describe('Progress Bar Rendering', () => {
    it('should render with correct usage stats', () => {
      render(<QuotaDisplay used={25} daily={100} label="Test Quota" />);

      expect(screen.getByText('Test Quota')).toBeInTheDocument();
      expect(screen.getByText('25/100')).toBeInTheDocument();
      expect(screen.getByText('25% utilisé')).toBeInTheDocument();
    });

    it('should handle zero daily quota', () => {
      render(<QuotaDisplay used={0} daily={0} label="Empty Quota" />);

      expect(screen.getByText('0/0')).toBeInTheDocument();
      expect(screen.getByText('0% utilisé')).toBeInTheDocument();
    });

    it('should handle 100% usage', () => {
      render(<QuotaDisplay used={100} daily={100} label="Full Quota" />);

      expect(screen.getByText('100/100')).toBeInTheDocument();
      expect(screen.getByText('100% utilisé')).toBeInTheDocument();
    });

    it('should cap percentage at 100% when used exceeds daily', () => {
      render(<QuotaDisplay used={150} daily={100} label="Over Quota" />);

      expect(screen.getByText('150/100')).toBeInTheDocument();
      expect(screen.getByText('100% utilisé')).toBeInTheDocument();
    });
  });

  describe('Color Thresholds', () => {
    it('should show green color when usage is below 70%', () => {
      const { container } = render(<QuotaDisplay used={50} daily={100} label="Green Quota" />);

      // Vérifier la classe de couleur verte
      const progressBar = container.querySelector('.from-green-500');
      expect(progressBar).toBeInTheDocument();

      // Vérifier l'icône de succès (CheckCircle)
      expect(screen.queryByText('Quota presque épuisé')).not.toBeInTheDocument();
      expect(screen.queryByText('Attention au quota')).not.toBeInTheDocument();
    });

    it('should show yellow color when usage is between 70% and 90%', () => {
      const { container } = render(<QuotaDisplay used={80} daily={100} label="Yellow Quota" />);

      // Vérifier la classe de couleur jaune
      const progressBar = container.querySelector('.from-yellow-500');
      expect(progressBar).toBeInTheDocument();

      // Vérifier le message d'avertissement
      expect(screen.getByText('Attention au quota')).toBeInTheDocument();
    });

    it('should show red color when usage is 90% or above', () => {
      const { container } = render(<QuotaDisplay used={95} daily={100} label="Red Quota" />);

      // Vérifier la classe de couleur rouge
      const progressBar = container.querySelector('.from-red-500');
      expect(progressBar).toBeInTheDocument();

      // Vérifier le message critique
      expect(screen.getByText('Quota presque épuisé')).toBeInTheDocument();
    });

    it('should show yellow at exactly 70%', () => {
      const { container } = render(<QuotaDisplay used={70} daily={100} label="Threshold 70" />);

      const progressBar = container.querySelector('.from-yellow-500');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText('Attention au quota')).toBeInTheDocument();
    });

    it('should show red at exactly 90%', () => {
      const { container } = render(<QuotaDisplay used={90} daily={100} label="Threshold 90" />);

      const progressBar = container.querySelector('.from-red-500');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText('Quota presque épuisé')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should show CheckCircle icon when status is healthy', () => {
      const { container } = render(<QuotaDisplay used={30} daily={100} label="Healthy" />);

      // CheckCircle icon devrait être présent (lucide-react l'ajoute comme SVG)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show AlertCircle icon when status is warning', () => {
      const { container } = render(<QuotaDisplay used={75} daily={100} label="Warning" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show AlertCircle icon when status is critical', () => {
      const { container } = render(<QuotaDisplay used={95} daily={100} label="Critical" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      const { container } = render(
        <QuotaDisplay used={50} daily={100} label="No Icon" showIcon={false} />
      );

      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <QuotaDisplay used={50} daily={100} label="Custom" className="custom-class" />
      );

      const rootElement = container.querySelector('.custom-class');
      expect(rootElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative values gracefully', () => {
      render(<QuotaDisplay used={-10} daily={100} label="Negative" />);

      expect(screen.getByText('-10/100')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(<QuotaDisplay used={33.5} daily={100} label="Decimal" />);

      expect(screen.getByText('33.5/100')).toBeInTheDocument();
      expect(screen.getByText('34% utilisé')).toBeInTheDocument(); // 33.5% arrondi à 34%
    });

    it('should handle very large numbers', () => {
      render(<QuotaDisplay used={9999} daily={10000} label="Large Numbers" />);

      expect(screen.getByText('9999/10000')).toBeInTheDocument();
      expect(screen.getByText('100% utilisé')).toBeInTheDocument();
    });
  });
});
