import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function startMongoMemory({ dbName = 'lenders_hq_test' } = {}) {
  const downloadDir = path.join(process.cwd(), '.cache', 'mongodb-memory-server');
  fs.mkdirSync(downloadDir, { recursive: true });

  process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;

  const mongod = await MongoMemoryServer.create({
    instance: { dbName, launchTimeout: 120000 },
    binary: { downloadDir },
  });

  const uri = mongod.getUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  async function stop() {
    try {
      await client.close();
    } finally {
      await mongod.stop();
    }
  }

  return { mongod, uri, client, db, stop };
}
