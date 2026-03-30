import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

export async function DELETE(req) {
  try {
    if (!CONNECTION_STRING) {
      return NextResponse.json({ error: 'Azure not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const containerName = searchParams.get('container');
    const blobName = searchParams.get('blob');

    if (!containerName) {
      return NextResponse.json({ error: 'Container name is required' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    if (blobName && blobName !== 'all') {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      return NextResponse.json({ message: `Blob ${blobName} deleted successfully` });
    } else {
      // Delete all blobs in the container
      const deletedBlobs = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        await blockBlobClient.delete();
        deletedBlobs.push(blob.name);
      }
      return NextResponse.json({ 
        message: `Successfully deleted ${deletedBlobs.length} blobs from ${containerName}`,
        count: deletedBlobs.length
      });
    }
  } catch (error) {
    console.error('Azure delete error details:', {
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
