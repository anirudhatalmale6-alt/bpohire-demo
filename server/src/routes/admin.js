import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/stats
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [users, candidates, recruiters, companies, jobs, applications, messages] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CANDIDATE' } }),
      prisma.user.count({ where: { role: 'RECRUITER' } }),
      prisma.company.count(),
      prisma.job.count({ where: { active: true } }),
      prisma.application.count(),
      prisma.message.count(),
    ]);
    res.json({ users, candidates, recruiters, companies, jobs, applications, messages });
  }),
);

// GET /api/admin/users
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: req.query.role ? { role: req.query.role } : {},
      select: { id: true, name: true, email: true, role: true, location: true, createdAt: true, company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  }),
);

// PATCH /api/admin/companies/:id/verify
router.patch(
  '/companies/:id/verify',
  asyncHandler(async (req, res) => {
    const { verified } = z.object({ verified: z.boolean() }).parse(req.body);
    const company = await prisma.company.update({ where: { id: req.params.id }, data: { verified } });
    res.json({ company });
  }),
);

// PATCH /api/admin/jobs/:id/moderate — take a job down (or restore it)
router.patch(
  '/jobs/:id/moderate',
  asyncHandler(async (req, res) => {
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const job = await prisma.job.update({ where: { id: req.params.id }, data: { active } });
    res.json({ job });
  }),
);

export default router;
