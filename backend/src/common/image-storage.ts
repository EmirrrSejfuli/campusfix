import { v2 as cloudinary } from 'cloudinary';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Image storage abstraction with two modes:
 *
 *  - Cloudinary (used when CLOUDINARY_URL is set, e.g. in production/Render):
 *    persistent, CDN-backed storage — required because Render's free-tier
 *    filesystem is ephemeral and wipes local files on every restart/redeploy.
 *
 *  - Local disk (fallback, used for local Docker development): writes into
 *    ./uploads, served statically by main.ts, exactly as before.
 *
 * Callers don't need to know which mode is active — uploadImage() always
 * returns a URL that can be used directly (absolute for Cloudinary, relative
 * "/uploads/xxx" for local disk).
 */

export function isCloudinaryConfigured(): boolean {
  return !!process.env.CLOUDINARY_URL;
}

if (isCloudinaryConfigured()) {
  cloudinary.config({ secure: true });
}

export async function uploadImage(buffer: Buffer, mimetype: string): Promise<string> {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'campusfix', resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  // Local disk fallback (Docker Compose development).
  const uploadsDir = './uploads';
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const ext = MIME_TO_EXT[mimetype] ?? '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  writeFileSync(join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}
