/**
 * Validates that a file's actual binary content matches a known image
 * format, by checking its "magic bytes" (file signature) — not just the
 * mimetype/extension the client claims. This is what prevents someone
 * from renaming a malicious file (e.g. script.exe -> photo.jpg) to bypass
 * a naive extension/mimetype check: the browser-declared mimetype is
 * fully attacker-controlled, but the actual file bytes are not.
 *
 * Operates on the in-memory buffer directly (multer memoryStorage), before
 * anything is written to disk or uploaded to Cloudinary.
 */
export function isValidImageContent(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;
  const header = buffer.subarray(0, 12);

  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 &&
    header[4] === 0x0d && header[5] === 0x0a && header[6] === 0x1a && header[7] === 0x0a;
  const isWebp =
    header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
    header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

  return isJpeg || isPng || isWebp;
}
