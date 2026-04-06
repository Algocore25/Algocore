import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Explicitly use force-dynamic
export const dynamic = 'force-dynamic';

/**
 * Configure FFmpeg Path by looking at multiple possible locations
 */
async function getFfmpegInstance() {
    const { default: ffmpeg } = await import('fluent-ffmpeg');
    
    // Strategy 1: Standard installer import
    try {
        const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
        if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
            ffmpeg.setFfmpegPath(ffmpegInstaller.path);
            return ffmpeg;
        }
    } catch (e) {
        console.error('[FFmpeg API] Error importing @ffmpeg-installer/ffmpeg:', e.message);
    }

    // Strategy 2: Dynamic path discovery based on platform
    const platform = os.platform(); // 'win32', 'linux', 'darwin'
    const arch = os.arch(); // 'x64', 'arm64'
    const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const platformFolder = `${platform}-${arch}`;

    // Common possible locations in Next.js standalone and production environments
    const basePaths = [
        process.cwd(),
        path.join(process.cwd(), '..'), // For standalone mode
        path.join(process.cwd(), 'Algocore-NQT'), // Possible specific structure
    ];

    const subpaths = [
        path.join('node_modules', '@ffmpeg-installer', platformFolder, binaryName),
        // Linux system defaults
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg'
    ];

    for (const base of basePaths) {
        for (const sub of subpaths) {
            const p = path.isAbsolute(sub) ? sub : path.join(base, sub);
            try {
                if (fs.existsSync(p)) {
                    console.log(`[FFmpeg API] Found FFmpeg binary at: ${p}`);
                    ffmpeg.setFfmpegPath(p);
                    return ffmpeg;
                }
            } catch (err) {}
        }
    }

    throw new Error(`FFmpeg binary not found for platform ${platformFolder}. Path explored: ${subpaths.join(', ')} in multiple base directories.`);
}

export async function POST(req) {
  let tempWebmPath = '';
  let tempMp4Path = '';

  const { searchParams } = new URL(req.url);
  const encoder = new TextEncoder();

  // We'll use a ReadableStream to send progress updates to the client
  const stream = new ReadableStream({
    async start(controller) {
      const sendStatus = (data) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        const ffmpeg = await getFfmpegInstance();
        const dataObj = await req.json();
        const blobName = dataObj.blobName;

        const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const CONTAINER_NAME = 'exam-recordings';

        if (!CONNECTION_STRING) throw new Error('Azure storage is not configured');
        if (!blobName) throw new Error('No blobName provided');

        const mp4BlobName = blobName.replace('.webm', '-processed.mp4');
        const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        const mp4BlobClient = containerClient.getBlockBlobClient(mp4BlobName);

        sendStatus({ status: 'checking_cache' });
        const mp4Exists = await mp4BlobClient.exists().catch(() => false);
        if (mp4Exists) {
            sendStatus({ 
                status: 'completed', 
                url: mp4BlobClient.url, 
                blobName: mp4BlobName,
                isCached: true,
                progress: 100
            });
            controller.close();
            return;
        }

        const webmBlobClient = containerClient.getBlockBlobClient(blobName);
        if (!(await webmBlobClient.exists())) throw new Error('Source file not found');

        // 1. Download
        sendStatus({ status: 'downloading', progress: 0 });
        const tmpDir = os.tmpdir();
        const uniqueId = Date.now();
        tempWebmPath = path.join(tmpDir, `input-${uniqueId}.webm`);
        tempMp4Path = path.join(tmpDir, `output-${uniqueId}.mp4`);

        const downloadResponse = await webmBlobClient.download(0);
        const writeStream = fs.createWriteStream(tempWebmPath);
        await new Promise((resolve, reject) => {
            downloadResponse.readableStreamBody.pipe(writeStream).on('finish', resolve).on('error', reject);
        });

        // 2. Convert
        sendStatus({ status: 'converting', progress: 0 });
        await new Promise((resolve, reject) => {
            ffmpeg(tempWebmPath)
                .outputOptions([
                    '-c:v libx264', '-preset ultrafast', '-crf 28', '-threads 0',
                    '-c:a aac', '-b:a 64k', '-movflags +faststart'
                ])
                .videoFilters('scale=-2:720')
                .toFormat('mp4')
                .on('progress', (progress) => {
                    if (progress.percent) {
                        sendStatus({ status: 'converting', progress: Math.min(99, Math.round(progress.percent)) });
                    }
                })
                .on('end', resolve)
                .on('error', (err) => {
                    console.error('[FFmpeg] Error:', err.message);
                    reject(err);
                })
                .save(tempMp4Path);
        });

        // 3. Upload
        sendStatus({ status: 'uploading', progress: 99 });
        await mp4BlobClient.uploadFile(tempMp4Path, {
            blobHTTPHeaders: { blobContentType: 'video/mp4' },
            concurrency: 5
        });

        sendStatus({ 
            status: 'completed', 
            url: mp4BlobClient.url, 
            blobName: mp4BlobName,
            isCached: false,
            progress: 100
        });
        controller.close();

      } catch (error) {
        console.error('[API] Error:', error.message);
        sendStatus({ status: 'error', error: error.message });
        controller.close();
      } finally {
        try {
            if (tempWebmPath && fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
            if (tempMp4Path && fs.existsSync(tempMp4Path)) fs.unlinkSync(tempMp4Path);
        } catch(e) {}
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' }
  });
}
