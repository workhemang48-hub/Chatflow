import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const MAX_FILE_SIZE_MB = 25;

// STORAGE_DRIVER=cloudinary switches the whole upload pipeline to Cloudinary.
// Local disk (the default) is fine for development, but doesn't survive
// most hosting platforms' deploys/restarts — Cloudinary does.
export const storageDriver = process.env.STORAGE_DRIVER === 'cloudinary' ? 'cloudinary' : 'local';

if (storageDriver === 'cloudinary') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cloudinary path: keep the file in memory just long enough to stream it
// up (see persistUploadedFile below) — nothing is ever written to this
// server's own disk. Local path: write straight to disk, same as before.
const storage =
  storageDriver === 'cloudinary'
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${path.extname(file.originalname)}`);
        },
      });

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Call this AFTER multer has parsed the upload (req.file is populated).
// Returns { url, storageKey } — storageKey is kept for a future "delete
// the file when a submission is deleted" feature (a Cloudinary public_id,
// or a local filename), not used anywhere yet.
export async function persistUploadedFile(req, file) {
  if (storageDriver === 'cloudinary') {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'chatflow' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, storageKey: result.public_id };
  }

  return {
    url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
    storageKey: file.filename,
  };
}