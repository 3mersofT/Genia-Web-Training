/**
 * Unit Tests for CodeBlock Component
 * Tests language normalization, display names, and syntax highlighting support
 */

// Mock react-syntax-highlighter to avoid ES module issues
jest.mock('react-syntax-highlighter', () => ({
  Prism: () => null,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
  prism: {},
}));

import { normalizeLanguage, SUPPORTED_LANGUAGES } from '../CodeBlock';

describe('CodeBlock - Language Normalization', () => {
  it('should normalize JavaScript aliases', () => {
    expect(normalizeLanguage('js')).toBe('javascript');
    expect(normalizeLanguage('JS')).toBe('javascript');
    expect(normalizeLanguage('javascript')).toBe('javascript');
  });

  it('should normalize TypeScript aliases', () => {
    expect(normalizeLanguage('ts')).toBe('typescript');
    expect(normalizeLanguage('TS')).toBe('typescript');
    expect(normalizeLanguage('typescript')).toBe('typescript');
  });

  it('should normalize Python aliases', () => {
    expect(normalizeLanguage('py')).toBe('python');
    expect(normalizeLanguage('PY')).toBe('python');
    expect(normalizeLanguage('python')).toBe('python');
  });

  it('should normalize Bash/Shell aliases', () => {
    expect(normalizeLanguage('sh')).toBe('bash');
    expect(normalizeLanguage('bash')).toBe('bash');
    expect(normalizeLanguage('shell')).toBe('shell');
  });

  it('should normalize YAML aliases', () => {
    expect(normalizeLanguage('yml')).toBe('yaml');
    expect(normalizeLanguage('yaml')).toBe('yaml');
  });

  it('should normalize Markdown aliases', () => {
    expect(normalizeLanguage('md')).toBe('markdown');
    expect(normalizeLanguage('markdown')).toBe('markdown');
  });

  it('should normalize C# aliases', () => {
    expect(normalizeLanguage('cs')).toBe('csharp');
    expect(normalizeLanguage('c#')).toBe('csharp');
    expect(normalizeLanguage('csharp')).toBe('csharp');
  });

  it('should normalize C++ aliases', () => {
    expect(normalizeLanguage('c++')).toBe('cpp');
    expect(normalizeLanguage('cpp')).toBe('cpp');
  });

  it('should handle unsupported languages by returning "text"', () => {
    expect(normalizeLanguage('unknown')).toBe('text');
    expect(normalizeLanguage('fortran')).toBe('text');
    expect(normalizeLanguage('cobol')).toBe('text');
  });

  it('should handle undefined language', () => {
    expect(normalizeLanguage(undefined)).toBe('text');
  });

  it('should handle empty string', () => {
    expect(normalizeLanguage('')).toBe('text');
  });

  it('should handle language with whitespace', () => {
    expect(normalizeLanguage('  python  ')).toBe('python');
    expect(normalizeLanguage('  js  ')).toBe('javascript');
  });

  it('should be case-insensitive', () => {
    expect(normalizeLanguage('PYTHON')).toBe('python');
    expect(normalizeLanguage('JavaScript')).toBe('javascript');
    expect(normalizeLanguage('TyPeScRiPt')).toBe('typescript');
  });
});

describe('CodeBlock - Supported Languages', () => {
  it('should include common programming languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('javascript');
    expect(SUPPORTED_LANGUAGES).toContain('typescript');
    expect(SUPPORTED_LANGUAGES).toContain('python');
    expect(SUPPORTED_LANGUAGES).toContain('java');
    expect(SUPPORTED_LANGUAGES).toContain('go');
    expect(SUPPORTED_LANGUAGES).toContain('rust');
  });

  it('should include markup languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('html');
    expect(SUPPORTED_LANGUAGES).toContain('css');
    expect(SUPPORTED_LANGUAGES).toContain('markdown');
    expect(SUPPORTED_LANGUAGES).toContain('xml');
  });

  it('should include config languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('json');
    expect(SUPPORTED_LANGUAGES).toContain('yaml');
  });

  it('should include shell/bash', () => {
    expect(SUPPORTED_LANGUAGES).toContain('bash');
    expect(SUPPORTED_LANGUAGES).toContain('shell');
  });

  it('should not be empty', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
  });
});
