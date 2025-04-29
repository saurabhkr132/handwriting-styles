import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const SCOPE = ['https://www.googleapis.com/auth/drive'];
const PARENT_FOLDER_ID = process.env.PARENT_FOLDER_ID;

const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

async function authorizeGoogleDrive() {
  const jwtClient = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    SCOPE,
  );
  await jwtClient.authorize();
  return jwtClient;
}

async function findOrCreateFolder(drive, folderName, parentFolderId) {
  // First: Try to find folder with exact appProperty
  let res = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and appProperties has { key='exactName' and value='${folderName}' } and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Second: Fallback to matching name (case-sensitive check manually)
  res = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  const exactMatch = res.data.files.find(file => file.name === folderName);
  if (exactMatch) {
    return exactMatch.id;
  }

  // Otherwise: create new folder with appProperties
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
    appProperties: {
      exactName: folderName,
    },
  };

  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

async function uploadFileToDrive(drive, bufferData, fileName, folderId) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'image/png',
    body: Readable.from(bufferData),
  };

  return new Promise((resolve, reject) => {
    drive.files.create(
      {
        resource: fileMetadata,
        media: media,
        fields: 'id',
      },
      (err, file) => {
        if (err) {
          reject(err);
        } else {
          resolve(file);
        }
      }
    );
  });
}

export async function POST(req) {
  try {
    const { character, image, username } = await req.json();

    if (!character || !image || !username) {
      return NextResponse.json({ error: 'Character, image or username missing' }, { status: 400 });
    }

    const authClient = await authorizeGoogleDrive();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const userDatasetFolderId = await findOrCreateFolder(drive, "user-dataset", PARENT_FOLDER_ID);

    const userFolderId = await findOrCreateFolder(drive, username, userDatasetFolderId);

    const characterFolderId = await findOrCreateFolder(drive, character, userFolderId);

    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const bufferData = Buffer.from(base64Data, 'base64');
    const timestamp = Date.now();
    const remoteFileName = `${timestamp}.png`;

    const file = await uploadFileToDrive(drive, bufferData, remoteFileName, characterFolderId);

    return NextResponse.json({ fileId: file.data.id });
  } catch (error) {
    console.error('Training save error:', error);
    return NextResponse.json({ error: 'Failed to save training sample' }, { status: 500 });
  }
}