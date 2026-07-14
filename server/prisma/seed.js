// Seeds the same demo dataset the static demo ships with, so a fresh
// PostgreSQL install matches what you clicked through in the browser.
//   npm run seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (p) => bcrypt.hashSync(p, 10);

async function main() {
  const northgate = await prisma.company.create({
    data: {
      name: 'Northgate Global Solutions',
      slug: 'northgate-global-solutions',
      logoText: 'NG',
      color: '#2563eb',
      industry: 'Customer Experience BPO',
      size: '5,000 - 10,000 employees',
      hq: 'Taguig, Metro Manila, PH',
      website: 'northgate-bpo.example.com',
      verified: true,
      about:
        'Northgate runs voice and omnichannel customer experience programs for US telco, fintech and healthcare brands.',
    },
  });

  const corebridge = await prisma.company.create({
    data: {
      name: 'Corebridge Contact Centers',
      slug: 'corebridge-contact-centers',
      logoText: 'CB',
      color: '#0d9488',
      industry: 'Sales & Collections',
      size: '1,000 - 5,000 employees',
      hq: 'Cebu City, PH',
      verified: true,
      about: 'Outbound sales, lead qualification and first-party collections for North American clients.',
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      name: 'James Reyes',
      email: 'james@demo.com',
      passwordHash: hash('demo1234'),
      role: 'RECRUITER',
      title: 'Senior Talent Acquisition Specialist',
      location: 'Taguig, Metro Manila, PH',
      companyId: northgate.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'admin@demo.com',
      passwordHash: hash('demo1234'),
      role: 'ADMIN',
    },
  });

  const candidate = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@demo.com',
      passwordHash: hash('demo1234'),
      role: 'CANDIDATE',
      location: 'Quezon City, Metro Manila, PH',
      phone: '+63 917 555 0142',
      candidateProfile: {
        create: {
          headline: 'Customer Service Representative - 3 years US telco experience',
          about: 'BPO professional with 3 years on US telco and fintech accounts. Consistently top 10% for CSAT.',
          experienceYears: 3,
          skills: ['Inbound Voice', 'Billing Support', 'Retention', 'Zendesk'],
          languages: ['English', 'Filipino'],
          shiftPreference: 'Night Shift (US Hours)',
          setupPreference: 'Hybrid',
          expectedSalary: '35,000 PHP / month',
          resumeName: 'Maria_Santos_CV.pdf',
        },
      },
    },
  });

  const csr = await prisma.job.create({
    data: {
      title: 'Customer Service Representative - US Telco Account',
      slug: 'csr-us-telco-account',
      companyId: northgate.id,
      postedById: recruiter.id,
      category: 'Customer Service',
      campaign: 'Inbound Voice',
      level: 'Entry Level',
      setup: 'ONSITE',
      shift: 'Night Shift (US Hours)',
      location: 'Taguig, Metro Manila, PH',
      languages: ['English'],
      salaryMin: 25000,
      salaryMax: 32000,
      currency: 'PHP',
      seats: 120,
      experience: 'No BPO experience required',
      featured: true,
      description: 'Handle inbound calls for one of the largest US wireless carriers — billing, plans, troubleshooting, retention.',
      responsibilities: ['Resolve customer issues on first contact', 'Process billing adjustments', 'Offer retention packages'],
      requirements: ['High school graduate', 'Good English communication', 'Willing to work night shift'],
      benefits: ['HMO on day 1', 'Night differential', 'Performance incentives'],
    },
  });

  await prisma.job.create({
    data: {
      title: 'Outbound Sales Agent - Solar Campaign (High Commission)',
      slug: 'outbound-sales-solar',
      companyId: corebridge.id,
      postedById: recruiter.id,
      category: 'Sales',
      campaign: 'Outbound Sales',
      level: 'Mid Level',
      setup: 'HYBRID',
      shift: 'Night Shift (US Hours)',
      location: 'Cebu City, PH',
      languages: ['English'],
      salaryMin: 28000,
      salaryMax: 45000,
      currency: 'PHP',
      seats: 45,
      experience: '1+ year outbound sales',
      featured: true,
      description: 'Own an outbound solar lead-generation and closing campaign for a US residential energy client.',
      responsibilities: ['Qualify homeowners from a predictive dialer', 'Set appointments and close over the phone'],
      requirements: ['1+ year outbound sales', 'Proven quota attainment'],
      benefits: ['Uncapped commission', 'HMO after 30 days'],
    },
  });

  const application = await prisma.application.create({
    data: { jobId: csr.id, userId: candidate.id, status: 'INTERVIEW' },
  });

  const thread = await prisma.thread.create({
    data: { recruiterId: recruiter.id, candidateId: candidate.id, jobId: csr.id },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread.id,
        senderId: recruiter.id,
        body: 'Hi Maria, thanks for applying. Are you available for a virtual interview this week?',
      },
      { threadId: thread.id, senderId: candidate.id, body: 'Hi James, yes — Wednesday or Thursday after 2 PM works.' },
    ],
  });

  console.log('Seeded:', { companies: 2, users: 3, jobs: 2, applications: 1, threadId: thread.id, applicationId: application.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
