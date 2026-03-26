import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'exam-recordings';

export async function POST(req) {
  try {
    if (!CONNECTION_STRING) {
      return NextResponse.json({ error: 'Azure not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const chunk = formData.get('chunk');
    const blobName = formData.get('blobName');
    const blockId = formData.get('blockId');
    const isLast = formData.get('isLast') === 'true';
    const blockIdsRaw = formData.get('blockIds');

    if (!blobName) {
      return NextResponse.json({ error: 'Missing blobName' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
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

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Stage the block if chunk exists
    if (chunk && chunk.size > 0 && blockId) {
      const arrayBuffer = await chunk.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const blockIdBase64 = Buffer.from(blockId).toString('base64');
      await blockBlobClient.stageBlock(blockIdBase64, buffer, buffer.length);
    }

    // If this is the last chunk, commit all blocks
    if (isLast && blockIdsRaw) {
      const blockIds = JSON.parse(blockIdsRaw).map(id => Buffer.from(id).toString('base64'));
      await blockBlobClient.commitBlockList(blockIds, {
        blobHTTPHeaders: { blobContentType: 'video/webm' }
      });

      const url = blockBlobClient.url;
      return NextResponse.json({ success: true, url, blobName });
    }

    return NextResponse.json({ success: true, staged: blockId || null });
  } catch (error) {
    console.error('Recording upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
