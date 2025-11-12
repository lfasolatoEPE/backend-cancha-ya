// src/services/image.service.ts
import { cloudinary } from '../providers/cloudinary';
import streamifier from 'streamifier';

export async function uploadImageBuffer(buf: Buffer, folder: string) {
  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, res) => {
        if (err || !res) return reject(err ?? new Error('Upload error'));
        resolve({ url: res.secure_url, public_id: res.public_id });
      }
    );
    streamifier.createReadStream(buf).pipe(upload);
  });
}

export async function deleteByPublicId(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

export function thumb(url: string, w = 400, h = 300) {
  // Cloudinary transform: …/upload/w_400,h_300,c_fill/…
  return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill/`);
}
