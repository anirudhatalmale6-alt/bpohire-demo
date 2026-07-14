import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/error.js';

const router = Router();

// GET /api/companies — public directory
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { jobs: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ companies });
  }),
);

// GET /api/companies/:id — profile + live jobs
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { jobs: { where: { active: true }, orderBy: { postedAt: 'desc' } } },
    });
    if (!company) throw new HttpError(404, 'Company not found.');
    res.json({ company });
  }),
);

const companySchema = z.object({
  name: z.string().min(2),
  logoText: z.string().min(1).max(3),
  color: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  hq: z.string().optional(),
  website: z.string().optional(),
  about: z.string().optional(),
});

// POST /api/companies — a recruiter creates their company on first login
router.post(
  '/',
  authenticate,
  requireRole('RECRUITER'),
  asyncHandler(async (req, res) => {
    if (req.user.companyId) throw new HttpError(409, 'Your account already has a company.');
    const data = companySchema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const company = await prisma.company.create({ data: { ...data, slug } });
    await prisma.user.update({ where: { id: req.user.id }, data: { companyId: company.id } });
    res.status(201).json({ company });
  }),
);

// PATCH /api/companies/:id — recruiter edits their own company
router.patch(
  '/:id',
  authenticate,
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.companyId !== req.params.id) {
      throw new HttpError(403, 'You can only edit your own company.');
    }
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: companySchema.partial().parse(req.body),
    });
    res.json({ company });
  }),
);

export default router;
