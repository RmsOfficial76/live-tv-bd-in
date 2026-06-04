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

      // Handle errors
      hls.on(HLS.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
              console.error('Network error:', data);
              hls.startLoad();
              break;
            case HLS.ErrorTypes.MEDIA_ERROR:
              console.error('Media error:', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error:', data);
              break;
          }
        }
      });

      // Auto play when ready
      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          video.play().catch(err => console.error('Autoplay failed:', err));
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      if (autoplay) {
        video.play().catch(err => console.error('Autoplay failed:', err));
      }
    }
  }, [src, autoplay]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls={controls}
      autoPlay={autoplay}
      className={`w-full h-full ${className}`}
      style={{
        backgroundColor: '#000',
        display: 'block',
      }}
    />
  );
};

export default HLSPlayer;
