import React, { useEffect, useRef, useState } from 'react';
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
 * Improved with better buffering, error recovery, and stream quality management
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(3);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);
    retryCountRef.current = 0;

    // Check if HLS is supported
    if (HLS.isSupported()) {
      // Create HLS instance with optimized configuration
      const hls = new HLS({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        // Improved buffering configuration
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        // Improved streaming configuration
        startLevel: -1, // Auto select quality
        autoStartLoad: true,
        // Progressive loading
        progressive: true,
        // Retry configuration
        testBandwidth: true,
        // CORS and security
        fetchSetup: (context, initParams) => {
          // Add timeout to fetch requests
          initParams.timeout = 10000;
          return initParams;
        },
      });

      hlsRef.current = hls;

      // Load the stream
      hls.loadSource(src);
      hls.attachMedia(video);

      // Handle manifest parsed
      hls.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        if (autoplay) {
          video.play().catch(() => {
            // Silently handle autoplay errors
          });
        }
      });

      // Handle level switching for smooth playback
      hls.on(HLS.Events.hlsLevelSwitching, () => {
        // Smooth quality transition
      });

      // Handle buffering
      hls.on(HLS.Events.BUFFER_APPENDING, () => {
        setIsLoading(true);
      });

      hls.on(HLS.Events.BUFFER_APPENDED, () => {
        setIsLoading(false);
      });

      // Enhanced error handling
      hls.on(HLS.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
              // Retry on network error with exponential backoff
              if (retryCountRef.current < maxRetriesRef.current) {
                retryCountRef.current++;
                const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
                setTimeout(() => {
                  hls.startLoad();
                }, delay);
              } else {
                setHasError(true);
                setIsLoading(false);
              }
              break;
            case HLS.ErrorTypes.MEDIA_ERROR:
              // Recover from media error
              hls.recoverMediaError();
              break;
            default:
              // Log other fatal errors
              console.error('HLS Fatal Error:', data);
              setHasError(true);
              setIsLoading(false);
              break;
          }
        }
      });

      // Handle video events for better UX
      video.addEventListener('play', () => {
        setIsLoading(false);
      });

      video.addEventListener('waiting', () => {
        setIsLoading(true);
      });

      video.addEventListener('playing', () => {
        setIsLoading(false);
      });

      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });

      return () => {
        video.removeEventListener('play', () => {});
        video.removeEventListener('waiting', () => {});
        video.removeEventListener('playing', () => {});
        video.removeEventListener('error', () => {});
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      setIsLoading(false);
      if (autoplay) {
        video.play().catch(() => {
          // Silently handle autoplay errors
        });
      }
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [src, autoplay]);

  return (
    <div className="relative w-full h-full">
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
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="text-center">
            <p className="text-white text-lg font-semibold">স্ট্রিম লোড করতে ব্যর্থ</p>
            <p className="text-gray-300 text-sm mt-2">দয়া করে পরে চেষ্টা করুন</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
