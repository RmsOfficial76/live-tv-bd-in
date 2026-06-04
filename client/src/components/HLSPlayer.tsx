import React, { useEffect, useRef } from 'react';
import HLS from 'hls.js';

interface HLSPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

/**
 * HLS Video Player Component
 * Plays M3U8/HLS streams directly in the browser using HLS.js
 * Falls back to native HTML5 video for Safari
 */
export const HLSPlayer: React.FC<HLSPlayerProps> = ({
  src,
  poster,
  autoplay = true,
  controls = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HLS | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Check if HLS is supported
    if (HLS.isSupported()) {
      // Create HLS instance
      const hls = new HLS({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;

      // Load the stream
      hls.loadSource(src);
      hls.attachMedia(video);

      // Handle errors silently
      hls.on(HLS.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
              // Silently retry on network error
              hls.startLoad();
              break;
            case HLS.ErrorTypes.MEDIA_ERROR:
              // Silently recover media error
              hls.recoverMediaError();
              break;
            default:
              // Silently handle other fatal errors
              break;
          }
        }
      });

      // Auto play when ready
      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          video.play().catch(() => {
            // Silently handle autoplay errors
          });
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      if (autoplay) {
        video.play().catch(() => {
          // Silently handle autoplay errors
        });
      }
    }
  }, [src, autoplay]);

  return (
    <video
      ref={videoRef}
      poster={poster || undefined}
      controls={controls}
      autoPlay={autoplay}
      className={`w-full h-full ${className}`}
      style={{
        backgroundColor: '#000',
        display: 'block',
      }}
      onError={() => {
        // Silently handle video errors
      }}
    />
  );
};

export default HLSPlayer;
