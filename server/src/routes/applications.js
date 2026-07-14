import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/error.js';

const router = Router();

// POST /api/applications — candidate applies to a job
router.post(
  '/',
  authenticate,
  requireRole('CANDIDATE'),
  asyncHandler(async (req, res) => {
    const { jobId, note } = z.object({ jobId: z.string().uuid(), note: z.string().max(2000).optional() }).parse(req.body);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || !job.active) throw new HttpError(404, 'Job not found or no longer active.');

    const existing = await prisma.application.findUnique({ where: { jobId_userId: { jobId, userId: req.user.id } } });
    if (existing) throw new HttpError(409, 'You have already applied to this job.');

    const application = await prisma.application.create({
      data: { jobId, userId: req.user.id, note },
      include: { job: { include: { company: true } } },
    });
    res.status(201).json({ application });
  }),
);

// GET /api/applications/mine — candidate's applications
router.get(
  '/mine',
  authenticate,
  requireRole('CANDIDATE'),
  asyncHandler(async (req, res) => {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.id },
      include: { job: { include: { company: true } } },
      orderBy: { appliedAt: 'desc' },
    });
    res.json({ applications });
  }),
);

// GET /api/applications/received — recruiter's applicant pipeline
router.get(
  '/received',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const { status, jobId } = req.query;
    const applications = await prisma.application.findMany({
      where: {
        job: { companyId: req.user.companyId },
        ...(status && { status }),
        ...(jobId && { jobId }),
      },
      include: {
        job: true,
        candidate: { include: { candidateProfile: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
    res.json({ applications });
  }),
);

// PATCH /api/applications/:id/status — move a candidate through the pipeline
router.patch(
  '/:id/status',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']) })
      .parse(req.body);

    const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: { job: true } });
    if (!app) throw new HttpError(404, 'Application not found.');
    if (req.user.role !== 'ADMIN' && app.job.companyId !== req.user.companyId) {
      throw new HttpError(403, 'Not your company’s application.');
    }

    const application = await prisma.application.update({ where: { id: req.params.id }, data: { status } });
    res.json({ application });
  }),
);

// --- saved jobs -------------------------------------------------------------

// POST /api/applications/saved/:jobId — toggle save
router.post(
  '/saved/:jobId',
  authenticate,
  requireRole('CANDIDATE'),
  asyncHandler(async (req, res) => {
    const key = { jobId_userId: { jobId: req.params.jobId, userId: req.user.id } };
    const existing = await prisma.savedJob.findUnique({ where: key });
    if (existing) {
      await prisma.savedJob.delete({ where: key });
      return res.json({ saved: false });
    }
    await prisma.savedJob.create({ data: { jobId: req.params.jobId, userId: req.user.id } });
    res.json({ saved: true });
  }),
);

// GET /api/applications/saved — candidate's saved jobs
router.get(
  '/saved',
  authenticate,
  requireRole('CANDIDATE'),
  asyncHandler(async (req, res) => {
    const saved = await prisma.savedJob.findMany({
      where: { userId: req.user.id },
      include: { job: { include: { company: true } } },
      orderBy: { savedAt: 'desc' },
    });
    res.json({ saved });
  }),
);

export default router;
