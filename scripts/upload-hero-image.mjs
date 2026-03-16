import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function uploadHeroImage() {
  try {
    const imagePath = join(__dirname, '..', 'hero-construction.jpg');
    const imageBuffer = readFileSync(imagePath);

    console.log('Uploading hero image to Vercel Blob...');
    
    const blob = await put('hero-construction.jpg', imageBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('✅ Upload successful!');
    console.log('Blob URL:', blob.url);
    console.log('\nUpdate your code with this URL:');
    console.log(`backgroundImage: "url('${blob.url}')"`);
    
    return blob.url;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadHeroImage();
