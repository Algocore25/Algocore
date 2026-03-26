import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

export async function GET(req) {
  try {
    if (!CONNECTION_STRING) {
      return NextResponse.json({ error: 'Azure not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const containerName = searchParams.get('container');

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

    if (containerName) {
      // List blobs in specific container
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blobs = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        blobs.push({
          name: blob.name,
          url: containerClient.getBlockBlobClient(blob.name).url,
          properties: blob.properties
        });
      }
      return NextResponse.json({ blobs });
    } else {
      // List all containers
      const containers = [];
      for await (const container of blobServiceClient.listContainers()) {
        containers.push(container.name);
      }
      return NextResponse.json({ containers });
    }
  } catch (error) {
    console.error('Azure list error details:', {
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
