import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/error.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['CANDIDATE', 'RECRUITER']).default('CANDIDATE'),
});

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  location: u.location,
  companyId: u.companyId,
  title: u.title,
  profile: u.candidateProfile ?? null,
});

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new HttpError(409, 'An account with that email already exists.');

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await bcrypt.hash(data.password, 10),
        candidateProfile: data.role === 'CANDIDATE' ? { create: {} } : undefined,
      },
      include: { candidateProfile: true },
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }),
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email }, include: { candidateProfile: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password.');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { candidateProfile: true },
    });
    if (!user) throw new HttpError(404, 'User not found.');
    res.json({ user: publicUser(user) });
  }),
);

// PATCH /api/auth/me — update account + candidate profile in one call
router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        headline: z.string().optional(),
        about: z.string().optional(),
        experienceYears: z.number().int().min(0).optional(),
        skills: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        shiftPreference: z.string().optional(),
        setupPreference: z.string().optional(),
        expectedSalary: z.string().optional(),
      })
      .parse(req.body);

    const { name, phone, location, ...profile } = body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(req.user.role === 'CANDIDATE' && Object.keys(profile).length
          ? { candidateProfile: { upsert: { create: profile, update: profile } } }
          : {}),
      },
      include: { candidateProfile: true },
    });

    res.json({ user: publicUser(user) });
  }),
);

export default router;
