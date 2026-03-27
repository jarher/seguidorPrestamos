import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const apiDir = path.join(rootDir, 'api');
const targetApiDir = path.join(distDir, 'api');

async function prepareDist() {
  console.log('🚀 Preparing production distribution...');

  try {
    // 1. Copy API folder
    console.log('📦 Copying server code...');
    await fs.copy(apiDir, targetApiDir);

    // 2. Create production package.json
    console.log('📄 Creating production package.json...');
    const pkg = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8'));
    
    const prodPkg = {
      name: pkg.name,
      version: pkg.version,
      type: "module",
      scripts: {
        "start": "NODE_ENV=production node api/index.js"
      },
      dependencies: pkg.dependencies
    };

    await fs.writeJson(path.join(distDir, 'package.json'), prodPkg, { spaces: 2 });

    // 3. Copy .env example if it exists
    const envExample = path.join(rootDir, '.env.example');
    if (await fs.pathExists(envExample)) {
      await fs.copy(envExample, path.join(distDir, '.env.example'));
    }

    console.log('✅ Production distribution ready in /dist');
  } catch (err) {
    console.error('❌ Error preparing distribution:', err);
    process.exit(1);
  }
}

prepareDist();
