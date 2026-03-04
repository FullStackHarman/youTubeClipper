'use client';

import { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { motion } from 'framer-motion';

interface VideoPlayerProps {
    url: string;
    onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
    seekTo?: number;
}

export default function VideoPlayer({ url, onProgress, onDuration, seekTo }: VideoPlayerProps) {
    const [hasMounted, setHasMounted] = useState(false);
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setHasMounted(true);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Extract video ID from URL
    const getVideoId = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
            if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
        } catch (e) {
            // Fallback regex
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }
        return null;
    };

    const videoId = getVideoId(url);

    useEffect(() => {
        if (playerRef.current && seekTo !== undefined) {
            if (typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(seekTo, true);
            }
        }
    }, [seekTo]);

    const onReady: YouTubeProps['onReady'] = (event) => {
        playerRef.current = event.target;
        if (onDuration) {
            onDuration(event.target.getDuration());
        }
    };

    const startProgressInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (playerRef.current && onProgress) {
                // Check if player is destroyed or not available
                if (typeof playerRef.current.getCurrentTime !== 'function') return;

                const currentTime = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();
                if (duration > 0) {
                    onProgress({
                        played: currentTime / duration,
                        playedSeconds: currentTime,
                        loaded: 0,
                        loadedSeconds: 0
                    });
                }
            }
        }, 500);
    };

    const stopProgressInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const onStateChange: YouTubeProps['onStateChange'] = (event) => {
        // PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        if (event.data === 1) { // Playing
            startProgressInterval();
        } else {
            stopProgressInterval();
        }
    };

    if (!hasMounted) {
        return (
            <div className="w-full aspect-video bg-gray-900/50 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
                Loading Player...
            </div>
        );
    }

    if (!videoId) {
        return (
            <div className="w-full aspect-video bg-gray-900/50 rounded-xl flex items-center justify-center text-red-400">
                Invalid Video URL
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full rounded-xl overflow-hidden glass-card shadow-2xl"
        >
            <div className="aspect-video relative">
                <YouTube
                    videoId={videoId}
                    className="absolute top-0 left-0 w-full h-full"
                    iframeClassName="w-full h-full"
                    onReady={onReady}
                    onStateChange={onStateChange}
                    opts={{
                        width: '100%',
                        height: '100%',
                        playerVars: {
                            autoplay: 0,
                            controls: 1,
                            modestbranding: 1,
                            rel: 0,
                        },
                    }}
                />
            </div>
        </motion.div>
    );
}
