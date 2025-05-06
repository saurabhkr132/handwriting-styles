import { google } from 'googleapis';

export async function GET() {
  try {
    const credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}');
    const PARENT_FOLDER_ID = process.env.PARENT_FOLDER_ID;

    const jwtClient = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive']
    );
    await jwtClient.authorize();

    const drive = google.drive({ version: 'v3', auth: jwtClient });

    const rootFolders = await drive.files.list({
      q: `'${PARENT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = 'user-dataset' and trashed = false`,
      fields: 'files(id, name)',
    });

    if (!rootFolders.data.files || rootFolders.data.files.length === 0) {
      return new Response(JSON.stringify({ error: 'user-dataset folder not found' }), {
        status: 404,
      });
    }

    const userDatasetFolderId = rootFolders.data.files[0].id;

    const userFoldersData = await drive.files.list({
      q: `'${userDatasetFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });

    const leaderboard = [];

    for (const userFolder of userFoldersData.data.files || []) {
      let imageCount = 0;

      const charFoldersData = await drive.files.list({
        q: `'${userFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, mimeType)',
      });

      for (const charFolder of charFoldersData.data.files || []) {
        const imageFiles = await drive.files.list({
          q: `'${charFolder.id}' in parents and mimeType contains 'image/' and trashed = false`,
          fields: 'files(id)',
          pageSize: 1000,
        });

        imageCount += imageFiles.data.files?.length || 0;
      }

      leaderboard.push({ user: userFolder.name, score: imageCount });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ leaderboard }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
      status: 500,
    });
  }
}
