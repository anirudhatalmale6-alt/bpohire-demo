import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/error.js';

const router = Router();

const slugify = (s) =>
  `${s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 7)}`;

const jobSchema = z.object({
  title: z.string().min(4),
  category: z.string(),
  campaign: z.string(),
  level: z.string(),
  setup: z.enum(['ONSITE', 'HYBRID', 'REMOTE']),
  shift: z.string(),
  location: z.string().min(2),
  languages: z.array(z.string()).default(['English']),
  salaryMin: z.number().int().nonnegative(),
  salaryMax: z.number().int().nonnegative(),
  currency: z.string().default('PHP'),
  period: z.string().default('month'),
  seats: z.number().int().min(1).default(1),
  experience: z.string().optional(),
  description: z.string().min(20),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
});

// GET /api/jobs — public search. Every filter is optional.
// ?q=&location=&category=&setup=&shift=&level=&language=&companyId=&page=&perPage=
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { q, location, category, setup, shift, level, language, companyId } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(50, Number(req.query.perPage) || 20);

    const where = {
      active: true,
      ...(category && { category }),
      ...(setup && { setup }),
      ...(shift && { shift }),
      ...(level && { level }),
      ...(companyId && { companyId }),
      ...(language && { languages: { has: language } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { campaign: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: { company: true, _count: { select: { applications: true } } },
        orderBy: [{ featured: 'desc' }, { postedAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    res.json({ total, page, perPage, jobs });
  }),
);

// GET /api/jobs/:id
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { company: true },
    });
    if (!job) throw new HttpError(404, 'Job not found.');

    let applied = false;
    let saved = false;
    if (req.user) {
      [applied, saved] = await Promise.all([
        prisma.application
          .findUnique({ where: { jobId_userId: { jobId: job.id, userId: req.user.id } } })
          .then(Boolean),
        prisma.savedJob.findUnique({ where: { jobId_userId: { jobId: job.id, userId: req.user.id } } }).then(Boolean),
      ]);
    }

    res.json({ job, applied, saved });
  }),
);

// POST /api/jobs — recruiters only
router.post(
  '/',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const data = jobSchema.parse(req.body);
    if (data.salaryMax < data.salaryMin) throw new HttpError(400, 'Maximum salary must be at least the minimum.');
    if (!req.user.companyId) throw new HttpError(400, 'Your account is not linked to a company yet.');

    const job = await prisma.job.create({
      data: { ...data, slug: slugify(data.title), companyId: req.user.companyId, postedById: req.user.id },
      include: { company: true },
    });
    res.status(201).json({ job });
  }),
);

// PATCH /api/jobs/:id — owner recruiter or admin
router.patch(
  '/:id',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Job not found.');
    if (req.user.role !== 'ADMIN' && existing.companyId !== req.user.companyId) {
      throw new HttpError(403, 'You can only edit your own company jobs.');
    }
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: jobSchema.partial().parse(req.body),
      include: { company: true },
    });
    res.json({ job });
  }),
);

// DELETE /api/jobs/:id
router.delete(
  '/:id',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Job not found.');
    if (req.user.role !== 'ADMIN' && existing.companyId !== req.user.companyId) {
      throw new HttpError(403, 'You can only delete your own company jobs.');
    }
    await prisma.job.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

// GET /api/jobs/mine/list — recruiter's own posts with applicant counts
router.get(
  '/mine/list',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const jobs = await prisma.job.findMany({
      where: { companyId: req.user.companyId },
      include: { _count: { select: { applications: true } } },
      orderBy: { postedAt: 'desc' },
    });
    res.json({ jobs });
  }),
);

export default router;
