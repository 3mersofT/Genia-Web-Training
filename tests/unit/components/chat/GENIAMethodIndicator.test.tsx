/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GENIAMethodIndicator from '@/components/chat/GENIAMethodIndicator';
import { GENIA_METHOD } from '@/constants/geniaMethod';

describe('GENIAMethodIndicator', () => {
  describe('Rendering', () => {
    it('should render correctly with G pillar', () => {
      render(<GENIAMethodIndicator methodStep="G" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Guide progressif');
      expect(indicator).toHaveTextContent('📘');
    });

    it('should render correctly with E pillar', () => {
      render(<GENIAMethodIndicator methodStep="E" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Exemples concrets');
      expect(indicator).toHaveTextContent('🔍');
    });

    it('should render correctly with N pillar', () => {
      render(<GENIAMethodIndicator methodStep="N" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Niveau adaptatif');
      expect(indicator).toHaveTextContent('📊');
    });

    it('should render correctly with I pillar', () => {
      render(<GENIAMethodIndicator methodStep="I" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Interaction pratique');
      expect(indicator).toHaveTextContent('⚡');
    });

    it('should render correctly with A pillar', () => {
      render(<GENIAMethodIndicator methodStep="A" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Assessment continu');
      expect(indicator).toHaveTextContent('✅');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<GENIAMethodIndicator methodStep="G" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'GENIA Method: Guide progressif');
    });

    it('should have title attribute with description', () => {
      render(<GENIAMethodIndicator methodStep="G" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('title', GENIA_METHOD.G.description);
    });

    it('should mark icon as aria-hidden', () => {
      render(<GENIAMethodIndicator methodStep="G" />);

      const icon = screen.getByText('📘');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling', () => {
    it('should apply gradient color classes for G pillar', () => {
      render(<GENIAMethodIndicator methodStep="G" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('from-blue-500');
      expect(indicator).toHaveClass('to-blue-600');
    });

    it('should apply gradient color classes for E pillar', () => {
      render(<GENIAMethodIndicator methodStep="E" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('from-green-500');
      expect(indicator).toHaveClass('to-green-600');
    });

    it('should apply gradient color classes for N pillar', () => {
      render(<GENIAMethodIndicator methodStep="N" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('from-purple-500');
      expect(indicator).toHaveClass('to-purple-600');
    });

    it('should apply gradient color classes for I pillar', () => {
      render(<GENIAMethodIndicator methodStep="I" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('from-orange-500');
      expect(indicator).toHaveClass('to-orange-600');
    });

    it('should apply gradient color classes for A pillar', () => {
      render(<GENIAMethodIndicator methodStep="A" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('from-indigo-500');
      expect(indicator).toHaveClass('to-indigo-600');
    });

    it('should apply base styling classes', () => {
      render(<GENIAMethodIndicator methodStep="G" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('inline-flex');
      expect(indicator).toHaveClass('items-center');
      expect(indicator).toHaveClass('gap-1');
      expect(indicator).toHaveClass('px-2');
      expect(indicator).toHaveClass('py-1');
      expect(indicator).toHaveClass('rounded-full');
      expect(indicator).toHaveClass('bg-gradient-to-r');
      expect(indicator).toHaveClass('text-white');
      expect(indicator).toHaveClass('text-xs');
      expect(indicator).toHaveClass('mb-2');
    });

    it('should apply custom className when provided', () => {
      render(<GENIAMethodIndicator methodStep="G" className="custom-class" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('custom-class');
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when methodStep is undefined', () => {
      const { container } = render(<GENIAMethodIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when methodStep is explicitly undefined', () => {
      const { container } = render(<GENIAMethodIndicator methodStep={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('All Pillars Integration', () => {
    it('should render all 5 pillars correctly', () => {
      const pillars: Array<'G' | 'E' | 'N' | 'I' | 'A'> = ['G', 'E', 'N', 'I', 'A'];

      pillars.forEach((pillar) => {
        const { unmount } = render(<GENIAMethodIndicator methodStep={pillar} />);

        const indicator = screen.getByRole('status');
        expect(indicator).toBeInTheDocument();
        expect(indicator).toHaveTextContent(GENIA_METHOD[pillar].name);
        expect(indicator).toHaveTextContent(GENIA_METHOD[pillar].icon);

        unmount();
      });
    });
  });
});
