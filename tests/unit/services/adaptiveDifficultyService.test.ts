import { AdaptiveDifficultyService, type UserPerformanceProfile, type DifficultyLevel } from '@/lib/services/adaptiveDifficultyService';

function makeProfile(overrides: Partial<UserPerformanceProfile> = {}): UserPerformanceProfile {
  return {
    userId: 'test-user',
    currentLevel: 'beginner',
    difficultyScore: 0.5,
    confidence: 0.5,
    recentScores: [],
    averageScore: 50,
    successRate: 50,
    exercisesCompleted: 0,
    streakDays: 0,
    retentionRate: 0,
    weaknessAreas: [],
    strengthAreas: [],
    recommendedFocus: [],
    shouldLevelUp: false,
    shouldLevelDown: false,
    ...overrides,
  };
}

describe('AdaptiveDifficultyService.calculateOptimalDifficulty', () => {
  it('should keep beginner with low scores', () => {
    const profile = makeProfile({
      currentLevel: 'beginner',
      exercisesCompleted: 2,
      averageScore: 40,
      successRate: 30,
      recentScores: [30, 45, 35],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    // With only 2 exercises, even regression requires last 3 < 50, but still beginner can't go lower
    expect(result.level).toBe('beginner');
    expect(result.direction).not.toBe('up');
  });

  it('should promote beginner → intermediate with 5+ exercises, score > 75, success > 70%', () => {
    const profile = makeProfile({
      currentLevel: 'beginner',
      exercisesCompleted: 6,
      averageScore: 80,
      successRate: 75,
      recentScores: [80, 85, 75, 90, 70, 80],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    expect(result.level).toBe('intermediate');
    expect(result.changed).toBe(true);
    expect(result.direction).toBe('up');
  });

  it('should demote intermediate → beginner when last 3 scores < 50', () => {
    const profile = makeProfile({
      currentLevel: 'intermediate',
      exercisesCompleted: 10,
      averageScore: 60,
      successRate: 55,
      recentScores: [70, 65, 40, 35, 45],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    expect(result.level).toBe('beginner');
    expect(result.changed).toBe(true);
    expect(result.direction).toBe('down');
  });

  it('should promote advanced → expert with 30+ exercises, score > 85, success > 80%, retention > 70%', () => {
    const profile = makeProfile({
      currentLevel: 'advanced',
      exercisesCompleted: 35,
      averageScore: 90,
      successRate: 85,
      retentionRate: 75,
      recentScores: [90, 88, 92, 85, 95],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    expect(result.level).toBe('expert');
    expect(result.changed).toBe(true);
    expect(result.direction).toBe('up');
  });

  it('should demote expert → advanced (never more than one level)', () => {
    const profile = makeProfile({
      currentLevel: 'expert',
      exercisesCompleted: 40,
      averageScore: 45,
      successRate: 35,
      recentScores: [30, 40, 45, 35, 25],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    expect(result.level).toBe('advanced');
    expect(result.changed).toBe(true);
    expect(result.direction).toBe('down');
  });

  it('should stay stable when criteria not met', () => {
    const profile = makeProfile({
      currentLevel: 'intermediate',
      exercisesCompleted: 10,
      averageScore: 70,
      successRate: 65,
      retentionRate: 50,
      recentScores: [70, 65, 75, 60, 80],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    expect(result.level).toBe('intermediate');
    expect(result.changed).toBe(false);
    expect(result.direction).toBe('stable');
  });

  it('should not demote beginner below beginner', () => {
    const profile = makeProfile({
      currentLevel: 'beginner',
      exercisesCompleted: 5,
      averageScore: 20,
      successRate: 10,
      recentScores: [10, 20, 15],
    });
    const result = AdaptiveDifficultyService.calculateOptimalDifficulty(profile);
    expect(result.level).toBe('beginner');
    // Direction may still indicate stable since can't go lower
  });
});

describe('AdaptiveDifficultyService.getDifficultyPromptModifiers', () => {
  const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  levels.forEach((level) => {
    it(`should return non-empty string for ${level}`, () => {
      const profile = makeProfile({ currentLevel: level });
      const result = AdaptiveDifficultyService.getDifficultyPromptModifiers(level, profile);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(10);
    });
  });

  it('should include weakness areas when present', () => {
    const profile = makeProfile({
      weaknessAreas: ['Chain of Thought', 'Structured Output'],
    });
    const result = AdaptiveDifficultyService.getDifficultyPromptModifiers('beginner', profile);
    expect(result).toContain('Chain of Thought');
  });
});

describe('AdaptiveDifficultyService.getExerciseParameters', () => {
  it('should return simple complexity for beginner', () => {
    const profile = makeProfile({ currentLevel: 'beginner' });
    const result = AdaptiveDifficultyService.getExerciseParameters('beginner', profile);
    expect(result.complexity).toBe('simple');
    expect(result.hintsAvailable).toBe(3);
    expect(result.maxSteps).toBe(3);
  });

  it('should return moderate complexity for intermediate', () => {
    const profile = makeProfile({ currentLevel: 'intermediate' });
    const result = AdaptiveDifficultyService.getExerciseParameters('intermediate', profile);
    expect(result.complexity).toBe('moderate');
    expect(result.hintsAvailable).toBe(2);
  });

  it('should return complex for advanced', () => {
    const profile = makeProfile({ currentLevel: 'advanced' });
    const result = AdaptiveDifficultyService.getExerciseParameters('advanced', profile);
    expect(result.complexity).toBe('complex');
    expect(result.hintsAvailable).toBe(1);
  });

  it('should return expert complexity with 0 hints for expert', () => {
    const profile = makeProfile({ currentLevel: 'expert' });
    const result = AdaptiveDifficultyService.getExerciseParameters('expert', profile);
    expect(result.complexity).toBe('expert');
    expect(result.hintsAvailable).toBe(0);
  });

  it('should include focus areas from recommended focus', () => {
    const profile = makeProfile({
      recommendedFocus: ['Zero-Shot', 'Few-Shot'],
    });
    const result = AdaptiveDifficultyService.getExerciseParameters('beginner', profile);
    expect(result.focusAreas).toEqual(['Zero-Shot', 'Few-Shot']);
  });
});
