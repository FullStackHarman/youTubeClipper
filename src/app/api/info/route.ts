import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // validate URL to be a youtube url
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        const binaryPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');
        const yt = youtubedl.create(binaryPath);

        const output = await yt(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        }) as any;

        return NextResponse.json({
            title: output.title,
            thumbnail: output.thumbnail,
            duration: output.duration,
            formats: output.formats,
            originalUrl: output.original_url || url,
        });

    } catch (error: any) {
        console.error('Error fetching video info:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch video info' },
            { status: 500 }
        );
    }
}
