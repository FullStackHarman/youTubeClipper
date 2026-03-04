'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import VideoPlayer from '@/components/VideoPlayer';
import RangeSlider from '@/components/RangeSlider';
import { formatTime } from '@/utils/format';
import { Download, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);

  const fetchVideoInfo = async (inputUrl: string) => {
    setIsLoadingInfo(true);
    setError('');
    setVideoInfo(null);
    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video');
      }

      setVideoInfo(data);
      setUrl(inputUrl);
      setRange([0, data.duration]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingInfo(false);
    }
  };


  // New state for multiple ranges
  const [ranges, setRanges] = useState<Array<{ id: string; start: number; end: number }>>([]);
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  // Update manual inputs when slider changes
  const handleRangeChange = (newRange: [number, number]) => {
    setRange(newRange);
    setManualStart(formatTime(newRange[0]));
    setManualEnd(formatTime(newRange[1]));

    // Auto-seek logic
    if (Math.abs(newRange[0] - range[0]) > 0.5) {
      setSeekTo(newRange[0]);
    }
  };

  // Helper to parse "MM:SS" or "HH:MM:SS" to seconds
  const parseTimeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return null;
  };

  const handleManualInputChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setManualStart(value);
    else setManualEnd(value);

    const seconds = parseTimeToSeconds(value);
    if (seconds !== null) {
      setRange(prev => {
        const newRange = [...prev] as [number, number];
        if (type === 'start') newRange[0] = Math.min(seconds, newRange[1]);
        else newRange[1] = Math.max(seconds, newRange[0]);

        // Seek if start changed
        if (type === 'start') setSeekTo(newRange[0]);
        return newRange;
      });
    }
  };

  const handleAddRange = () => {
    setRanges(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      start: range[0],
      end: range[1]
    }]);
  };

  const handleRemoveRange = (id: string) => {
    setRanges(prev => prev.filter(r => r.id !== id));
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setIsDownloading(true);
    setError('');

    // If no batch ranges, use current selection
    const rangesToDownload = ranges.length > 0
      ? ranges
      : [{ start: range[0], end: range[1] }];

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          ranges: rangesToDownload
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      // Handle file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Filename
      const suffix = rangesToDownload.length > 1 ? 'merged' : 'clipped';
      a.download = `${videoInfo.title || 'video'}_${suffix}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Script src="/CSInterface.js" strategy="beforeInteractive" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="container mx-auto px-4 pb-20 relative z-10">
        <Hero onUrlSubmit={fetchVideoInfo} isLoading={isLoadingInfo} />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {videoInfo && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-3 space-y-6">
                {/* Title */}
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {videoInfo.title}
                </h2>

                {/* Player */}
                <VideoPlayer
                  url={url}
                  seekTo={seekTo}
                />

                {/* Controls */}
                <div className="glass-card p-6 rounded-xl space-y-6">

                  {/* Manual Input & Add Range */}
                  <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="space-y-1 flex-1">
                        <label className="text-xs text-gray-400 font-mono">Start (MM:SS)</label>
                        <input
                          type="text"
                          value={formatTime(range[0])}
                          onChange={(e) => {
                            // Parse time string to seconds could be complex, 
                            // simpler to just use generic inputs or regex. 
                            // For now, let's implement a parser in handleManualInput or similar.
                            // But standard text inputs for time are tricky.
                            // Let's use simple text for now and try to parse on blur or change.
                            // Actually better: separate functions for parsing 'MM:SS' back to seconds.
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-xs text-gray-400 font-mono">End (MM:SS)</label>
                        <input
                          type="text"
                          value={formatTime(range[1])}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddRange}
                      className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg border border-white/10 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-sm font-medium">Add to Batch</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-200">Select Range</h3>
                    <span className="text-sm text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">
                      Duration: {formatTime(range[1] - range[0])}
                    </span>
                  </div>

                  <RangeSlider
                    min={0}
                    max={videoInfo.duration}
                    value={range}
                    onChange={handleRangeChange}
                    isLoading={isDownloading}
                  />

                  {/* Batch List */}
                  {ranges.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Batch Downloads ({ranges.length})</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {ranges.map((r) => (
                          <div key={r.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-all">
                            <span className="font-mono text-sm text-gray-300">
                              {formatTime(r.start)} - {formatTime(r.end)}
                            </span>
                            <button
                              onClick={() => handleRemoveRange(r.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Batch...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        {ranges.length > 0 ? `Download ${ranges.length} Sections` : 'Download Current Selection'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
