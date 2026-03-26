import admin from 'firebase-admin';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const FIREBASE_DB_URL = "https://algocore-db3d9-default-rtdb.firebaseio.com";
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'firebase-backups';

async function performBackup() {
  console.log("Starting Firebase Backup...");
  
  try {
    // 1. Initialize Firebase Admin
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: FIREBASE_DB_URL
        });
      } else {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing");
      }
    }

    if (!AZURE_CONNECTION_STRING) {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING is missing");
    }

    // 2. Fetch all data from Realtime Database
    console.log("Fetching database data...");
    const db = admin.database();
    const snapshot = await db.ref('/').get();
    const data = snapshot.exists() ? snapshot.val() : {};
    const textData = JSON.stringify(data, null, 2);

    // 3. Connect to Azure Blob Storage
    console.log("Connecting to Azure Blob Storage...");
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists();

    // 4. Upload to Azure
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    console.log(`Uploading ${fileName} to container ${CONTAINER_NAME}...`);
    await blockBlobClient.upload(textData, textData.length, {
      blobHTTPHeaders: { blobContentType: 'application/json' }
    });

    console.log("Backup completed successfully!");
  } catch (error) {
    console.error("Backup failed:", error.message);
    process.exit(1);
  }
}

performBackup();
