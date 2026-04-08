import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'profiles';

export async function POST(req) {
  try {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      return NextResponse.json({ error: 'Azure connection string not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const byteData = await file.arrayBuffer();
    const buffer = Buffer.from(byteData);

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    try {
      await containerClient.createIfNotExists({ access: 'blob' });
    } catch (err) {
      console.warn('createIfNotExists with blob access failed, trying without access level:', err.message);
      try {
        await containerClient.createIfNotExists();
      } catch (creationError) {
        console.error('Secondary creation attempt failed:', creationError.message);
      }
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type }
    });

    // Use a server-side proxy URL so images always load (bypasses CORS / private container)
    const proxyUrl = `/api/proxy-blob?container=${containerName}&blobName=${encodeURIComponent(fileName)}`;

    return NextResponse.json({ imageUrl: proxyUrl, blobName: fileName });
  } catch (error) {
    console.error('Azure upload error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
}
