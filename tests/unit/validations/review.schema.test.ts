/**
 * @jest-environment node
 */
import { submitReviewSchema, createCardSchema } from '@/lib/validations/review.schema';

describe('submitReviewSchema', () => {
  it('validates correct data', () => {
    const data = {
      cardId: '550e8400-e29b-41d4-a716-446655440000',
      capsuleId: 'cap-1-1',
      quality: 4,
      timeSpentSeconds: 30,
    };

    const result = submitReviewSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cardId).toBe(data.cardId);
      expect(result.data.capsuleId).toBe(data.capsuleId);
      expect(result.data.quality).toBe(4);
      expect(result.data.timeSpentSeconds).toBe(30);
    }
  });

  it('rejects invalid quality (>5)', () => {
    const data = {
      cardId: '550e8400-e29b-41d4-a716-446655440000',
      capsuleId: 'cap-1-1',
      quality: 6,
      timeSpentSeconds: 10,
    };

    const result = submitReviewSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const qualityError = result.error.issues.find(e => e.path.includes('quality'));
      expect(qualityError).toBeDefined();
    }
  });

  it('rejects missing cardId', () => {
    const data = {
      capsuleId: 'cap-1-1',
      quality: 3,
      timeSpentSeconds: 10,
    };

    const result = submitReviewSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const cardIdError = result.error.issues.find(e => e.path.includes('cardId'));
      expect(cardIdError).toBeDefined();
    }
  });
});

describe('createCardSchema', () => {
  it('validates correct data', () => {
    const data = {
      capsuleId: 'cap-1-1',
    };

    const result = createCardSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capsuleId).toBe('cap-1-1');
    }
  });

  it('rejects empty capsuleId', () => {
    const data = {
      capsuleId: '',
    };

    const result = createCardSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const capsuleIdError = result.error.issues.find(e => e.path.includes('capsuleId'));
      expect(capsuleIdError).toBeDefined();
    }
  });
});
