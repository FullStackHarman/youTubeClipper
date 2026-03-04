import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, ranges, startTime, endTime, saveLocally, title } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`Downloading ${url}. Ranges: ${JSON.stringify(ranges)}`);

        const binaryPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');

        // Check if ffmpeg is available
        let hasFfmpeg = false;
        try {
            execSync('which ffmpeg');
            hasFfmpeg = true;
        } catch (e) {
            console.warn('ffmpeg not found, falling back to full video download');
        }

        // Determine output path
        let outputPath;
        let finalFileName = `video_${uuidv4()}.mp4`;

        // Try to sanitize title for filename if provided
        if (title) {
            const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            finalFileName = `${safeTitle}_${uuidv4().substr(0, 8)}.mp4`;
        }

        if (saveLocally) {
            // Save to User's Movies/YouTubeDownloader folder
            const homeDir = os.homedir();
            const downloadDir = path.join(homeDir, 'Movies', 'YouTubeDownloader');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }
            outputPath = path.join(downloadDir, finalFileName);
        } else {
            // Save to temp public folder for streaming
            outputPath = path.join(process.cwd(), 'public', finalFileName);
        }

        // Construct args
        const args = [
            url,
            '-f', 'best[ext=mp4]', // Ensure MP4
            '-o', outputPath,
            '--force-overwrites',
        ];

        if (hasFfmpeg) {
            if (Array.isArray(ranges) && ranges.length > 0) {
                // Handle multiple ranges
                ranges.forEach((r: any) => {
                    args.push('--download-sections', `*${r.start}-${r.end}`);
                });
                args.push('--force-keyframes-at-cuts');
            } else if (startTime !== undefined && endTime !== undefined) {
                // Handle single range (legacy or fallback)
                args.push('--download-sections', `*${startTime}-${endTime}`);
                args.push('--force-keyframes-at-cuts');
            }
        }

        console.log('Spawning yt-dlp with args:', args.join(' '));
        console.log('Output path:', outputPath);

        return new Promise((resolve, reject) => {
            const subprocess = spawn(binaryPath, args, {
                stdio: ['ignore', 'pipe', 'pipe']
            });

            subprocess.stderr.on('data', (data) => {
                const msg = data.toString();
                console.error(`yt-dlp stderr: ${msg}`);
            });

            subprocess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`yt-dlp exited with code ${code}`);
                }

                if (fs.existsSync(outputPath)) {

                    if (saveLocally) {
                        // Return the absolute path for Premiere to import
                        resolve(NextResponse.json({
                            success: true,
                            filePath: outputPath
                        }));
                    } else {
                        // Stream the file back to client
                        const stats = fs.statSync(outputPath);
                        const fileStream = fs.createReadStream(outputPath);

                        const stream = new ReadableStream({
                            start(controller) {
                                fileStream.on('data', (chunk) => controller.enqueue(chunk));
                                fileStream.on('end', () => {
                                    controller.close();
                                    fs.unlinkSync(outputPath); // Delete after send
                                });
                                fileStream.on('error', (err) => {
                                    controller.error(err);
                                    try { fs.unlinkSync(outputPath); } catch (e) { }
                                });
                            },
                            cancel() {
                                fileStream.destroy();
                                try { fs.unlinkSync(outputPath); } catch (e) { }
                            }
                        });

                        resolve(new NextResponse(stream, {
                            headers: {
                                'Content-Type': 'video/mp4',
                                'Content-Disposition': `attachment; filename="${finalFileName}"`,
                                'Content-Length': stats.size.toString(),
                            },
                        }));
                    }
                } else {
                    resolve(NextResponse.json(
                        { error: 'Download failed: file not created. Check if ffmpeg is installed if using trimming.' },
                        { status: 500 }
                    ));
                }
            });
        });

    } catch (error: any) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: error.message || 'Download failed' },
            { status: 500 }
        );
    }
}
