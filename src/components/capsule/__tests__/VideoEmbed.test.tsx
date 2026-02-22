/**
 * Unit Tests for VideoEmbed Component
 * Tests URL parsing, embed parameter generation, and video type detection
 */

import { parseVideoUrl, buildEmbedParams } from '../VideoEmbed';

describe('VideoEmbed - URL Parsing', () => {
  it('should parse YouTube watch URL correctly', () => {
    const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.type).toBe('youtube');
    expect(result.videoId).toBe('dQw4w9WgXcQ');
    expect(result.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(result.error).toBeUndefined();
  });

  it('should parse YouTube short URL correctly', () => {
    const result = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result.type).toBe('youtube');
    expect(result.videoId).toBe('dQw4w9WgXcQ');
    expect(result.embedUrl).toContain('youtube-nocookie.com');
  });

  it('should parse Vimeo URL correctly', () => {
    const result = parseVideoUrl('https://vimeo.com/123456789');
    expect(result.type).toBe('vimeo');
    expect(result.videoId).toBe('123456789');
    expect(result.embedUrl).toBe('https://player.vimeo.com/video/123456789');
  });

  it('should recognize self-hosted MP4 URL', () => {
    const result = parseVideoUrl('https://example.com/videos/sample.mp4');
    expect(result.type).toBe('self-hosted');
    expect(result.embedUrl).toBe('https://example.com/videos/sample.mp4');
  });

  it('should recognize self-hosted WebM URL', () => {
    const result = parseVideoUrl('https://example.com/videos/sample.webm');
    expect(result.type).toBe('self-hosted');
    expect(result.embedUrl).toBe('https://example.com/videos/sample.webm');
  });

  it('should recognize self-hosted OGG URL', () => {
    const result = parseVideoUrl('https://example.com/videos/sample.ogg');
    expect(result.type).toBe('self-hosted');
    expect(result.embedUrl).toBe('https://example.com/videos/sample.ogg');
  });

  it('should handle invalid URLs', () => {
    const result = parseVideoUrl('not-a-valid-url');
    expect(result.type).toBe('unknown');
    expect(result.error).toBeTruthy();
  });

  it('should handle unsupported video formats', () => {
    const result = parseVideoUrl('https://example.com/video.avi');
    expect(result.type).toBe('unknown');
    expect(result.error).toBeTruthy();
  });

  it('should handle empty URL', () => {
    const result = parseVideoUrl('');
    expect(result.type).toBe('unknown');
    expect(result.error).toBeTruthy();
  });
});

describe('VideoEmbed - Embed Parameters', () => {
  it('should generate YouTube embed params with autoplay', () => {
    const params = buildEmbedParams('youtube', true, true, false, false);
    expect(params).toContain('autoplay=1');
    expect(params).toContain('rel=0');
    expect(params).toContain('modestbranding=1');
  });

  it('should generate YouTube embed params with muted', () => {
    const params = buildEmbedParams('youtube', false, true, true, false);
    expect(params).toContain('mute=1');
  });

  it('should generate YouTube embed params with loop', () => {
    const params = buildEmbedParams('youtube', false, true, false, true);
    expect(params).toContain('loop=1');
  });

  it('should generate YouTube embed params without controls', () => {
    const params = buildEmbedParams('youtube', false, false, false, false);
    expect(params).toContain('controls=0');
  });

  it('should generate Vimeo embed params with autoplay', () => {
    const params = buildEmbedParams('vimeo', true, true, false, false);
    expect(params).toContain('autoplay=1');
    expect(params).toContain('dnt=1');
  });

  it('should generate Vimeo embed params with muted', () => {
    const params = buildEmbedParams('vimeo', false, true, true, false);
    expect(params).toContain('muted=1');
  });

  it('should not generate params for self-hosted videos', () => {
    const params = buildEmbedParams('self-hosted', true, true, true, true);
    expect(params).toBe('');
  });

  it('should not generate params for unknown video types', () => {
    const params = buildEmbedParams('unknown', true, true, true, true);
    expect(params).toBe('');
  });
});
