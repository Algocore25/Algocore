import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

/**
 * GET /api/proxy-blob?container=name&blobName=path/to/blob&downloadName=filename
 * 
 * Proxies an Azure Blob to bypass CORS issues and set correct download headers.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const containerName = searchParams.get('container') || 'exam-recordings';
    const blobName = searchParams.get('blobName');
    const downloadName = searchParams.get('downloadName');

    if (!CONNECTION_STRING) {
      return NextResponse.json({ error: 'Azure not configured' }, { status: 500 });
    }

    if (!blobName) {
      return NextResponse.json({ error: 'Missing blobName' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const exists = await blockBlobClient.exists();
    if (!exists) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    const downloadResponse = await blockBlobClient.download(0);
    
    // Create a readable stream from the Azure body
    const stream = downloadResponse.readableStreamBody;

    const response = new NextResponse(stream);
    
    // Copy relevant headers from Azure
    const contentType = downloadResponse.contentType || 'application/octet-stream';
    response.headers.set('Content-Type', contentType);
    
    if (downloadName) {
        // Use the explicit download name if provided and force download
        response.headers.set('Content-Disposition', `attachment; filename="${downloadName}"`);
    } else {
        // Omitting attachment header to allow inline viewing
        response.headers.set('Content-Disposition', 'inline');
    }

    // Explicitly allow CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');

    return response;
  } catch (error) {
    console.error('[Proxy-Blob] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
