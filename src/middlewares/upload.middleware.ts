import multer, { FileFilterCallback } from 'multer';

const MB = Number(process.env.MAX_UPLOAD_MB ?? 5);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MB * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype);
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido (jpg, png, webp, avif only)'));
    }
  },
});
