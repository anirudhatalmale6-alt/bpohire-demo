'use client';

// -----------------------------------------------------------------------------
// Demo data layer.
//
// This module exposes exactly the same surface the production REST client uses
// (getJobs, createJob, applyToJob, ...). In the demo build the calls resolve
// against seeded data held in localStorage so the whole platform can be hosted
// as a static site and clicked through without a server.
//
// In the production build, lib/api.js swaps this out for fetch() calls to the
// Node/Express API in /server, backed by PostgreSQL. Pages and components do not
// change.
// -----------------------------------------------------------------------------

import { APPLICATIONS, COMPANIES, JOBS, SAVED, THREADS, USERS } from './seed';

const KEY = 'bpohire.db.v1';
const SESSION_KEY = 'bpohire.session.v1';

const listeners = new Set();

function freshDb() {
  return {
    companies: COMPANIES,
    jobs: JOBS,
    users: USERS,
    applications: APPLICATIONS,
    saved: SAVED,
    threads: THREADS,
  };
}

export function loadDb() {
  if (typeof window === 'undefined') return freshDb();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const db = freshDb();
      window.localStorage.setItem(KEY, JSON.stringify(db));
      return db;
    }
    return JSON.parse(raw);
  } catch {
    return freshDb();
  }
}

function saveDb(db) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetDemo() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.location.href = './';
}

const id = (p) => `${p}${Math.random().toString(36).slice(2, 9)}`;

// --- auth -------------------------------------------------------------------

export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw);
    return loadDb().users.find((u) => u.id === userId) || null;
  } catch {
    return null;
  }
}

export function login(email, password) {
  const db = loadDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === String(email).trim().toLowerCase() && u.password === password,
  );
  if (!user) return { error: 'Invalid email or password.' };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
  listeners.forEach((fn) => fn());
  return { user };
}

export function register({ name, email, password, role }) {
  const db = loadDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return { error: 'An account with that email already exists.' };
  }
  const user = {
    id: id('u'),
    role,
    name,
    email: email.trim(),
    password,
    headline: role === 'candidate' ? 'New candidate on BPOHire' : '',
    location: '',
    phone: '',
    experienceYears: 0,
    skills: [],
    languages: [],
    shiftPreference: '',
    setupPreference: '',
    expectedSalary: '',
    resumeName: '',
    about: '',
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDb(db);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
  return { user };
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
  listeners.forEach((fn) => fn());
}

export function updateProfile(userId, patch) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  Object.assign(user, patch);
  saveDb(db);
}

// --- companies --------------------------------------------------------------

export function getCompany(companyId) {
  return loadDb().companies.find((c) => c.id === companyId) || null;
}

export function upsertCompany(company) {
  const db = loadDb();
  const existing = db.companies.find((c) => c.id === company.id);
  if (existing) Object.assign(existing, company);
  else db.companies.push({ ...company, id: company.id || id('c') });
  saveDb(db);
}

// --- jobs -------------------------------------------------------------------

export function getJobs(filters = {}) {
  const db = loadDb();
  const { q = '', location = '', category = '', setup = '', shift = '', level = '', language = '' } = filters;
  const term = q.trim().toLowerCase();

  return db.jobs
    .map((j) => ({ ...j, company: db.companies.find((c) => c.id === j.companyId) }))
    .filter((j) => {
      if (term) {
        const hay = `${j.title} ${j.category} ${j.campaign} ${j.company?.name} ${j.description} ${(j.languages || []).join(' ')}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (location && !j.location.toLowerCase().includes(location.trim().toLowerCase())) return false;
      if (category && j.category !== category) return false;
      if (setup && j.setup !== setup) return false;
      if (shift && j.shift !== shift) return false;
      if (level && j.level !== level) return false;
      if (language && !(j.languages || []).includes(language)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
}

export function getJob(jobId) {
  const db = loadDb();
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  return { ...job, company: db.companies.find((c) => c.id === job.companyId) };
}

export function createJob(job) {
  const db = loadDb();
  const newJob = {
    ...job,
    id: id('j'),
    postedAt: new Date().toISOString(),
    featured: false,
    status: 'Active',
  };
  db.jobs.unshift(newJob);
  saveDb(db);
  return newJob;
}

export function updateJob(jobId, patch) {
  const db = loadDb();
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) return;
  Object.assign(job, patch);
  saveDb(db);
}

export function deleteJob(jobId) {
  const db = loadDb();
  db.jobs = db.jobs.filter((j) => j.id !== jobId);
  db.applications = db.applications.filter((a) => a.jobId !== jobId);
  saveDb(db);
}

export function getJobsByRecruiter(user) {
  const db = loadDb();
  return db.jobs
    .filter((j) => j.companyId === user.companyId || j.postedBy === user.id)
    .map((j) => ({
      ...j,
      applicantCount: db.applications.filter((a) => a.jobId === j.id).length,
    }))
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
}

// --- applications -----------------------------------------------------------

export function applyToJob(userId, jobId, note = '') {
  const db = loadDb();
  if (db.applications.some((a) => a.userId === userId && a.jobId === jobId)) {
    return { error: 'You have already applied to this job.' };
  }
  const app = { id: id('a'), jobId, userId, status: 'Applied', appliedAt: new Date().toISOString(), note };
  db.applications.push(app);
  saveDb(db);
  return { application: app };
}

export function hasApplied(userId, jobId) {
  return loadDb().applications.some((a) => a.userId === userId && a.jobId === jobId);
}

export function getApplicationsForCandidate(userId) {
  const db = loadDb();
  return db.applications
    .filter((a) => a.userId === userId)
    .map((a) => {
      const job = db.jobs.find((j) => j.id === a.jobId);
      return { ...a, job: job ? { ...job, company: db.companies.find((c) => c.id === job.companyId) } : null };
    })
    .filter((a) => a.job)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

export function getApplicantsForRecruiter(user) {
  const db = loadDb();
  const jobIds = db.jobs.filter((j) => j.companyId === user.companyId || j.postedBy === user.id).map((j) => j.id);
  return db.applications
    .filter((a) => jobIds.includes(a.jobId))
    .map((a) => ({
      ...a,
      job: db.jobs.find((j) => j.id === a.jobId),
      candidate: db.users.find((u) => u.id === a.userId),
    }))
    .filter((a) => a.job && a.candidate)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

export function setApplicationStatus(applicationId, status) {
  const db = loadDb();
  const app = db.applications.find((a) => a.id === applicationId);
  if (!app) return;
  app.status = status;
  saveDb(db);
}

// --- saved jobs -------------------------------------------------------------

export function toggleSaveJob(userId, jobId) {
  const db = loadDb();
  const existing = db.saved.find((s) => s.userId === userId && s.jobId === jobId);
  if (existing) db.saved = db.saved.filter((s) => s !== existing);
  else db.saved.push({ id: id('s'), userId, jobId, savedAt: new Date().toISOString() });
  saveDb(db);
  return !existing;
}

export function isSaved(userId, jobId) {
  return loadDb().saved.some((s) => s.userId === userId && s.jobId === jobId);
}

export function getSavedJobs(userId) {
  const db = loadDb();
  return db.saved
    .filter((s) => s.userId === userId)
    .map((s) => {
      const job = db.jobs.find((j) => j.id === s.jobId);
      return job ? { ...job, company: db.companies.find((c) => c.id === job.companyId), savedAt: s.savedAt } : null;
    })
    .filter(Boolean);
}

// --- messaging --------------------------------------------------------------

export function getThreadsForUser(user) {
  const db = loadDb();
  return db.threads
    .filter((t) => t.recruiterId === user.id || t.candidateId === user.id)
    .map((t) => ({
      ...t,
      other: db.users.find((u) => u.id === (t.recruiterId === user.id ? t.candidateId : t.recruiterId)),
      job: db.jobs.find((j) => j.id === t.jobId),
      last: t.messages[t.messages.length - 1],
    }))
    .sort((a, b) => new Date(b.last?.at || 0) - new Date(a.last?.at || 0));
}

export function openThread(recruiterId, candidateId, jobId) {
  const db = loadDb();
  let thread = db.threads.find((t) => t.recruiterId === recruiterId && t.candidateId === candidateId);
  if (!thread) {
    thread = { id: id('t'), recruiterId, candidateId, jobId, messages: [] };
    db.threads.push(thread);
    saveDb(db);
  }
  return thread.id;
}

export function sendMessage(threadId, fromUserId, text) {
  const db = loadDb();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread || !text.trim()) return;
  thread.messages.push({ id: id('m'), from: fromUserId, text: text.trim(), at: new Date().toISOString() });
  saveDb(db);
}

// --- admin ------------------------------------------------------------------

export function getAdminStats() {
  const db = loadDb();
  return {
    users: db.users.length,
    candidates: db.users.filter((u) => u.role === 'candidate').length,
    recruiters: db.users.filter((u) => u.role === 'recruiter').length,
    companies: db.companies.length,
    jobs: db.jobs.length,
    applications: db.applications.length,
    messages: db.threads.reduce((n, t) => n + t.messages.length, 0),
  };
}

export function getAllUsers() {
  return loadDb().users;
}

export function getAllCompanies() {
  const db = loadDb();
  return db.companies.map((c) => ({ ...c, jobCount: db.jobs.filter((j) => j.companyId === c.id).length }));
}

export function verifyCompany(companyId, verified) {
  const db = loadDb();
  const c = db.companies.find((x) => x.id === companyId);
  if (!c) return;
  c.verified = verified;
  saveDb(db);
}
