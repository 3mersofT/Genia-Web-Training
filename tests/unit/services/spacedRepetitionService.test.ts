import {
  calculateSM2,
  getQualityLabel,
  getQualityColor,
  type SM2Quality,
  type SM2Result,
} from '@/lib/services/spacedRepetitionService';

// Mock the supabase client so the module can be imported without env vars
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({})),
}));

describe('spacedRepetitionService', () => {
  describe('calculateSM2', () => {
    const defaultEF = 2.5;
    const defaultInterval = 1;
    const defaultRepetitions = 0;

    it('should reset repetitions and interval to 1 when quality is 0 (blackout)', () => {
      const result = calculateSM2(0, defaultEF, 10, 5);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should reset repetitions for any quality < 3', () => {
      const results: SM2Result[] = [
        calculateSM2(0, defaultEF, 10, 5),
        calculateSM2(1, defaultEF, 10, 5),
        calculateSM2(2, defaultEF, 10, 5),
      ];

      for (const result of results) {
        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(1);
      }
    });

    it('should adjust EF and calculate interval for quality 3 (correct with difficulty)', () => {
      const result = calculateSM2(3, defaultEF, 1, 0);

      // EF formula: 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02))
      // = 2.5 + (0.1 - 2 * (0.08 + 2 * 0.02))
      // = 2.5 + (0.1 - 2 * 0.12)
      // = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
      expect(result.easinessFactor).toBe(2.36);
      expect(result.repetitions).toBe(1);
      // First repetition always gives interval 1
      expect(result.interval).toBe(1);
    });

    it('should increase EF and grow interval for quality 5 (perfect)', () => {
      const result = calculateSM2(5, defaultEF, 6, 2);

      // EF formula: 2.5 + (0.1 - (5-5) * (0.08 + (5-5) * 0.02))
      // = 2.5 + (0.1 - 0) = 2.6
      expect(result.easinessFactor).toBe(2.6);
      expect(result.repetitions).toBe(3);
      // Third repetition: Math.round(6 * 2.6) = Math.round(15.6) = 16
      expect(result.interval).toBe(16);
    });

    it('should enforce minimum EF of 1.3', () => {
      // Use a low starting EF and a low quality to drive EF below 1.3
      // quality=0 => EF change = 0.1 - 5*(0.08 + 5*0.02) = 0.1 - 5*0.18 = 0.1 - 0.9 = -0.8
      const result = calculateSM2(0, 1.5, 1, 0);

      // 1.5 - 0.8 = 0.7 => clamped to 1.3
      expect(result.easinessFactor).toBe(1.3);
    });

    it('should give interval 1 for first successful repetition', () => {
      const result = calculateSM2(4, defaultEF, 0, 0);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });

    it('should give interval 6 for second successful repetition', () => {
      const result = calculateSM2(4, defaultEF, 1, 1);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it('should use EF * previous interval for third and subsequent repetitions', () => {
      const ef = 2.5;
      const previousInterval = 6;
      const result = calculateSM2(4, ef, previousInterval, 2);

      // New EF: 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + (0.1 - 0.10) = 2.5
      expect(result.repetitions).toBe(3);
      // Math.round(6 * 2.5) = 15
      expect(result.interval).toBe(Math.round(previousInterval * 2.5));
    });

    it('should return a valid nextReviewDate in ISO date format', () => {
      const result = calculateSM2(4, defaultEF, 1, 0);

      // nextReviewDate should be YYYY-MM-DD format
      expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // The date should be in the future (today + interval days)
      const reviewDate = new Date(result.nextReviewDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(reviewDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
    });

    it('should calculate EF correctly for quality 4 (easy)', () => {
      const result = calculateSM2(4, 2.5, 1, 0);

      // EF: 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02))
      // = 2.5 + (0.1 - 1 * (0.08 + 0.02))
      // = 2.5 + (0.1 - 0.10) = 2.5
      expect(result.easinessFactor).toBe(2.5);
    });
  });

  describe('getQualityLabel', () => {
    it('should return correct labels for all quality values', () => {
      const expectedLabels: Record<SM2Quality, string> = {
        0: 'Aucun souvenir',
        1: 'Très difficile',
        2: 'Difficile',
        3: 'Correct',
        4: 'Facile',
        5: 'Parfait',
      };

      for (const [quality, label] of Object.entries(expectedLabels)) {
        expect(getQualityLabel(Number(quality) as SM2Quality)).toBe(label);
      }
    });
  });

  describe('getQualityColor', () => {
    it('should return correct Tailwind color classes for all quality values', () => {
      const expectedColors: Record<SM2Quality, string> = {
        0: 'bg-red-500',
        1: 'bg-red-400',
        2: 'bg-orange-400',
        3: 'bg-yellow-400',
        4: 'bg-green-400',
        5: 'bg-green-500',
      };

      for (const [quality, color] of Object.entries(expectedColors)) {
        expect(getQualityColor(Number(quality) as SM2Quality)).toBe(color);
      }
    });
  });
});
