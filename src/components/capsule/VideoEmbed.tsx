'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Play, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ============= TYPES =============
interface VideoEmbedProps {
  url: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
}

type VideoType = 'youtube' | 'vimeo' | 'self-hosted' | 'unknown';

interface VideoInfo {
  type: VideoType;
  embedUrl?: string;
  videoId?: string;
  error?: string;
}

// ============= HELPERS =============
/**
 * Détecte le type de vidéo et extrait l'ID/URL d'embed
 */
const parseVideoUrl = (url: string): VideoInfo => {
  try {
    // YouTube patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return {
        type: 'youtube',
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`
      };
    }

    // Vimeo patterns
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);

    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return {
        type: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`
      };
    }

    // Self-hosted video (common video extensions)
    const videoExtensions = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
    if (videoExtensions.test(url)) {
      return {
        type: 'self-hosted',
        embedUrl: url
      };
    }

    return {
      type: 'unknown',
      error: 'Format de vidéo non reconnu. Formats supportés: YouTube, Vimeo, MP4, WebM, OGG'
    };
  } catch (error) {
    return {
      type: 'unknown',
      error: 'URL de vidéo invalide'
    };
  }
};

/**
 * Construit les paramètres d'URL pour les vidéos embed
 */
const buildEmbedParams = (
  type: VideoType,
  autoplay: boolean,
  controls: boolean,
  muted: boolean,
  loop: boolean
): string => {
  const params = new URLSearchParams();

  if (type === 'youtube') {
    if (autoplay) params.append('autoplay', '1');
    if (!controls) params.append('controls', '0');
    if (muted) params.append('mute', '1');
    if (loop) params.append('loop', '1');
    params.append('rel', '0'); // Ne pas afficher les vidéos suggérées
    params.append('modestbranding', '1'); // Branding minimal
  } else if (type === 'vimeo') {
    if (autoplay) params.append('autoplay', '1');
    if (!controls) params.append('controls', '0');
    if (muted) params.append('muted', '1');
    if (loop) params.append('loop', '1');
    params.append('dnt', '1'); // Do Not Track
  }

  return params.toString();
};

// ============= COMPOSANT PRINCIPAL =============
export default function VideoEmbed({
  url,
  title = 'Vidéo',
  autoplay = false,
  controls = true,
  muted = false,
  loop = false,
  className = '',
  aspectRatio = '16/9'
}: VideoEmbedProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading avec Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Une fois visible, on arrête d'observer
            observer.disconnect();
          }
        });
      },
      {
        // Charger la vidéo 200px avant qu'elle entre dans le viewport
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const info = parseVideoUrl(url);
    setVideoInfo(info);

    if (info.error) {
      setHasError(true);
    }

    setIsLoading(false);
  }, [url]);

  // ============= STATES DE CHARGEMENT ET ERREUR =============
  if (isLoading) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (hasError || !videoInfo || videoInfo.error) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800 ${className}`}
        style={{ aspectRatio }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-3" />
          <p className="text-red-700 dark:text-red-300 font-medium mb-2">
            Erreur de chargement vidéo
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {videoInfo?.error || 'Une erreur est survenue'}
          </p>
        </div>
      </div>
    );
  }

  // ============= PLACEHOLDER AVANT CHARGEMENT LAZY =============
  if (!isInView) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Play className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Chargement de la vidéo...
          </p>
        </div>
      </div>
    );
  }

  // ============= RENDU VIDÉO SELF-HOSTED =============
  if (videoInfo.type === 'self-hosted' && videoInfo.embedUrl) {
    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full rounded-lg overflow-hidden shadow-lg ${className}`}
        style={{ aspectRatio }}
      >
        <video
          src={videoInfo.embedUrl}
          title={title}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain bg-black"
          onError={() => setHasError(true)}
        >
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </motion.div>
    );
  }

  // ============= RENDU VIDÉO EMBED (YouTube/Vimeo) =============
  if ((videoInfo.type === 'youtube' || videoInfo.type === 'vimeo') && videoInfo.embedUrl) {
    const embedParams = buildEmbedParams(
      videoInfo.type,
      autoplay,
      controls,
      muted,
      loop
    );

    const fullEmbedUrl = embedParams
      ? `${videoInfo.embedUrl}?${embedParams}`
      : videoInfo.embedUrl;

    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full rounded-lg overflow-hidden shadow-lg ${className}`}
        style={{ aspectRatio }}
      >
        <iframe
          src={fullEmbedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
        />
      </motion.div>
    );
  }

  // ============= FALLBACK =============
  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`}
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <Play className="w-12 h-12 text-slate-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Format de vidéo non supporté
        </p>
      </div>
    </div>
  );
}

// ============= EXPORTS UTILITAIRES =============
export { parseVideoUrl, buildEmbedParams };
export type { VideoEmbedProps, VideoType, VideoInfo };
