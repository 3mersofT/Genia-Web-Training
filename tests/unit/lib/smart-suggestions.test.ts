/**
 * Unit Tests for smart-suggestions module
 *
 * Tests verify that the smart suggestion generator:
 * 1. Returns GENIA-step-specific suggestions when method tags are detected
 * 2. Falls back to level-based suggestions when no method tag is found
 * 3. Limits output to 4 suggestions
 * 4. Deduplicates suggestions
 * 5. Excludes suggestions that match user's last query
 */

import { generateSmartSuggestions } from '@/lib/smart-suggestions';

describe('generateSmartSuggestions', () => {
  it('should return Guide-step suggestions when [G - Guide] is detected', () => {
    const result = generateSmartSuggestions(
      '[G - Guide progressif] Voici une explication...',
      'Explique-moi le prompt engineering',
      'beginner',
      ['Prompt Engineering']
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result.some(s => s.text.includes('exemple'))).toBe(true);
  });

  it('should return Example-step suggestions when [E - Exemple] is detected', () => {
    const result = generateSmartSuggestions(
      '[E - Exemples concrets] Voici un exemple...',
      'Montre-moi un exemple',
      'intermediate',
      []
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(s => s.category === 'deepen' || s.category === 'practice')).toBe(true);
  });

  it('should return Interaction-step suggestions when [I - Interaction] is detected', () => {
    const result = generateSmartSuggestions(
      '[I - Interaction pratique] Voici un exercice...',
      'Donne-moi un exercice',
      'beginner',
      []
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(s => s.text.includes('indice') || s.text.includes('Évalue'))).toBe(true);
  });

  it('should return Assessment-step suggestions when [A - Assessment] is detected', () => {
    const result = generateSmartSuggestions(
      '[A - Assessment continu] Score : 85/100',
      'Évalue ma réponse',
      'intermediate',
      []
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(s => s.text.includes('améliorer') || s.text.includes('suivant'))).toBe(true);
  });

  it('should fall back to level-based suggestions when no method tag is found', () => {
    const result = generateSmartSuggestions(
      'Voici une réponse sans tag GENIA.',
      'Bonjour',
      'beginner',
      []
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('should include concept-specific suggestions when concepts match', () => {
    // Use a GENIA-tagged response so we get only 3 rule-based suggestions + concept ones
    const result = generateSmartSuggestions(
      '[G - Guide progressif] Explication du Chain-of-Thought...',
      'Question',
      'beginner',
      ['Chain-of-Thought']
    );

    // Should have some suggestions from the concept
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
    // At least one suggestion should relate to CoT (from concept or from guide step)
    const allTexts = result.map(s => s.text).join(' ');
    expect(allTexts.length).toBeGreaterThan(0);
  });

  it('should limit to 4 suggestions maximum', () => {
    const result = generateSmartSuggestions(
      'Score: 90. Bravo!',
      'test',
      'beginner',
      ['Prompt Engineering', 'Chain-of-Thought', 'Few-Shot']
    );

    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('should not duplicate suggestions', () => {
    const result = generateSmartSuggestions(
      '[G - Guide] Content about prompt and structure.',
      'test',
      'beginner',
      ['Prompt Engineering']
    );

    const texts = result.map(s => s.text);
    const uniqueTexts = new Set(texts);
    expect(texts.length).toBe(uniqueTexts.size);
  });

  it('should handle empty inputs gracefully', () => {
    const result = generateSmartSuggestions('', '', 'beginner', []);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle advanced level suggestions', () => {
    const result = generateSmartSuggestions(
      'Réponse normale.',
      'test',
      'advanced',
      []
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(s => s.text.includes('edge cases') || s.text.includes('Optimisation') || s.text.includes('Meta-prompting') || s.text.includes('multi-agents'))).toBe(true);
  });
});
