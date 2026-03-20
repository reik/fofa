import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

// Ensure upload dirs exist
['thumbnails', 'media'].forEach((sub) => {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function storageFor(folder: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOADS_DIR, folder)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

function imageFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only image files are allowed'));
}

function mediaFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Unsupported media type'));
}

export const thumbnailUpload = multer({
  storage: storageFor('thumbnails'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const mediaUpload = multer({
  storage: storageFor('media'),
  fileFilter: mediaFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});
