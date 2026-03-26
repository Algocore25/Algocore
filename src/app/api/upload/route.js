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
      console.warn('createIfNotExists failed:', err.message);
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type }
    });

    const imageUrl = blockBlobClient.url;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading to Azure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
