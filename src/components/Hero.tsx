'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
    onUrlSubmit: (url: string) => void;
    isLoading: boolean;
}

export default function Hero({ onUrlSubmit, isLoading }: HeroProps) {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6"
            >
                YouTube Clipper
            </motion.h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg text-gray-400 mb-8 max-w-xl"
            >
                Download specific sections of any YouTube video in high quality.
                Just paste the link, select the range, and download.
            </motion.p>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onSubmit={handleSubmit}
                className="w-full max-w-2xl relative"
            >
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative glass rounded-xl flex items-center p-2">
                        <Search className="w-6 h-6 text-gray-400 ml-3" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste YouTube URL here..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !url.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing
                                </>
                            ) : (
                                'Fetch'
                            )}
                        </button>
                    </div>
                </div>
            </motion.form>
        </div>
    );
}
