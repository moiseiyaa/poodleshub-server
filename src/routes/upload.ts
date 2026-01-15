import express from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Simple JWT header check (same logic as other admin routes)
function verifyAdminJWT(req: any, res: any, next: any) {
  const token = req.headers['admin_token'] || req.headers['authorization'];
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  next();
}

// Import environment config
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

// Use in-memory storage to stay compatible with read-only filesystems (e.g. Vercel)
const storage = multer.memoryStorage();

// Accept images only
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only jpeg, png, or webp images are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

const router = express.Router();

// Single image upload => returns public URL
router.post('/', verifyAdminJWT, upload.single('image'), async (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: 'puppyhub',
        resource_type: 'image'
      }, (err, res) => {
        if (err || !res) return reject(err || new Error('No response'));
        resolve(res);
      });
      // req.file.buffer contains the image
      stream.end(req.file!.buffer);
    });

    return res.status(201).json({ url: result.secure_url, public_id: result.public_id });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({ error: 'Image upload failed', message: err.message });
  }
});

export default router;
