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

  try {
    const ffmpeg = await getFfmpegInstance();
    const dataObj = await req.json();
    const blobName = dataObj.blobName;

    const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const CONTAINER_NAME = 'exam-recordings';

    if (!CONNECTION_STRING) {
        return NextResponse.json({ error: 'Azure storage is not configured' }, { status: 500 });
    }

    if (!blobName) {
        return NextResponse.json({ error: 'No blobName provided' }, { status: 400 });
    }

    const mp4BlobName = blobName.replace('.webm', '-processed.mp4');
    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const mp4BlobClient = containerClient.getBlockBlobClient(mp4BlobName);

    // Cache check
    const mp4Exists = await mp4BlobClient.exists().catch(() => false);
    if (mp4Exists) {
        return NextResponse.json({ 
            success: true, 
            url: mp4BlobClient.url, 
            blobName: mp4BlobName,
            isCached: true 
        });
    }

    const webmBlobClient = containerClient.getBlockBlobClient(blobName);
    const webmExists = await webmBlobClient.exists();
    if (!webmExists) {
        return NextResponse.json({ error: 'Source file not found' }, { status: 404 });
    }

    // 1. Download
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
    await new Promise((resolve, reject) => {
        ffmpeg(tempWebmPath)
            .outputOptions(['-c:v libx264', '-preset ultrafast', '-crf 26', '-c:a aac', '-b:a 96k', '-movflags +faststart'])
            .toFormat('mp4')
            .on('end', resolve)
            .on('error', reject)
            .save(tempMp4Path);
    });

    // 3. Upload
    const mp4Data = fs.readFileSync(tempMp4Path);
    await mp4BlobClient.uploadData(mp4Data, {
        blobHTTPHeaders: { blobContentType: 'video/mp4' }
    });

    return NextResponse.json({ 
        success: true, 
        url: mp4BlobClient.url, 
        blobName: mp4BlobName,
        isCached: false 
    });

  } catch (error) {
    console.error('[API] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    try {
        if (tempWebmPath && fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
        if (tempMp4Path && fs.existsSync(tempMp4Path)) fs.unlinkSync(tempMp4Path);
    } catch(e) {}
  }
}
