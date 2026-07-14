import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/error.js';

const router = Router();

const canSee = (thread, userId) => thread.recruiterId === userId || thread.candidateId === userId;

// GET /api/messages/threads — inbox for the logged-in user (either role)
router.get(
  '/threads',
  authenticate,
  asyncHandler(async (req, res) => {
    const threads = await prisma.thread.findMany({
      where: { OR: [{ recruiterId: req.user.id }, { candidateId: req.user.id }] },
      include: {
        recruiter: { select: { id: true, name: true, title: true, role: true } },
        candidate: { select: { id: true, name: true, role: true, candidateProfile: { select: { headline: true } } } },
        job: { select: { id: true, title: true } },
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ threads });
  }),
);

// POST /api/messages/threads — open (or reuse) a conversation
router.post(
  '/threads',
  authenticate,
  asyncHandler(async (req, res) => {
    const { otherUserId, jobId } = z
      .object({ otherUserId: z.string().uuid(), jobId: z.string().uuid().nullish() })
      .parse(req.body);

    const other = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!other) throw new HttpError(404, 'User not found.');

    const recruiterId = req.user.role === 'RECRUITER' ? req.user.id : other.id;
    const candidateId = req.user.role === 'RECRUITER' ? other.id : req.user.id;

    const thread = await prisma.thread.upsert({
      where: { recruiterId_candidateId_jobId: { recruiterId, candidateId, jobId: jobId ?? null } },
      create: { recruiterId, candidateId, jobId: jobId ?? null },
      update: {},
    });

    res.status(201).json({ thread });
  }),
);

// GET /api/messages/threads/:id — full conversation
router.get(
  '/threads/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const thread = await prisma.thread.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { sentAt: 'asc' } },
        recruiter: { select: { id: true, name: true, title: true } },
        candidate: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    });
    if (!thread) throw new HttpError(404, 'Conversation not found.');
    if (!canSee(thread, req.user.id)) throw new HttpError(403, 'Not your conversation.');

    await prisma.message.updateMany({
      where: { threadId: thread.id, senderId: { not: req.user.id }, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ thread });
  }),
);

// POST /api/messages/threads/:id — send a message
router.post(
  '/threads/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { body } = z.object({ body: z.string().min(1).max(4000) }).parse(req.body);

    const thread = await prisma.thread.findUnique({ where: { id: req.params.id } });
    if (!thread) throw new HttpError(404, 'Conversation not found.');
    if (!canSee(thread, req.user.id)) throw new HttpError(403, 'Not your conversation.');

    const message = await prisma.message.create({
      data: { threadId: thread.id, senderId: req.user.id, body },
    });
    res.status(201).json({ message });
  }),
);

export default router;
