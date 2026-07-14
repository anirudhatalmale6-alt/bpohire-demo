import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/error.js';

const router = Router();

// Local disk in development. In production point this at S3 / Spaces by swapping
// the storage engine — nothing else in the app changes.
const dir = process.env.UPLOAD_DIR || path.resolve('uploads');
fs.mkdirSync(dir, { recursive: true });

const ALLOWED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Only PDF or Word resumes are accepted.')),
});

// POST /api/uploads/resume — multipart/form-data, field name "resume"
router.post(
  '/resume',
  authenticate,
  requireRole('CANDIDATE'),
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file received.');

    const resumeUrl = `/uploads/${req.file.filename}`;
    await prisma.candidateProfile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, resumeUrl, resumeName: req.file.originalname },
      update: { resumeUrl, resumeName: req.file.originalname },
    });

    res.status(201).json({ resumeUrl, resumeName: req.file.originalname });
  }),
);

export default router;
