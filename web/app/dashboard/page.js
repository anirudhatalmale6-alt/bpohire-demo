'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { initials, useSession } from '../../components/Chrome';
import { JobCard, Logo, ago, money } from '../../components/Job';
import {
  createJob,
  deleteJob,
  getApplicantsForRecruiter,
  getApplicationsForCandidate,
  getCompany,
  getJobsByRecruiter,
  getSavedJobs,
  openThread,
  setApplicationStatus,
  subscribe,
  toggleSaveJob,
  updateProfile,
  upsertCompany,
} from '../../lib/store';

const STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

function StatusTag({ status }) {
  const cls =
    status === 'Rejected'
      ? 'tag tag-danger'
      : status === 'Hired' || status === 'Offer'
        ? 'tag tag-accent'
        : status === 'Interview' || status === 'Shortlisted'
          ? 'tag tag-brand'
          : 'tag';
  return <span className={cls}>{status}</span>;
}

export default function DashboardPage() {
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.push('/login');
    if (ready && user?.role === 'admin') router.push('/admin');
  }, [ready, user, router]);

  if (!user) return <div className="container section muted">Loading…</div>;
  return user.role === 'recruiter' ? <Recruiter user={user} /> : <Candidate user={user} />;
}

/* ------------------------------------------------------------------ candidate */

function Candidate({ user }) {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);

  const applications = getApplicationsForCandidate(user.id);
  const saved = getSavedJobs(user.id);
  const inProcess = applications.filter((a) => ['Shortlisted', 'Interview', 'Offer'].includes(a.status)).length;

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <div className="row" style={{ marginBottom: 18 }}>
        <div className="avatar" style={{ width: 46, height: 46, fontSize: 16 }}>
          {initials(user.name)}
        </div>
        <div>
          <h2 style={{ fontSize: 22 }}>{user.name}</h2>
          <div className="muted small">{user.headline || 'Add a headline to your profile'}</div>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => router.push('/jobs')}>
          Find jobs
        </button>
      </div>

      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat">
          <span>Applications</span>
          <b>{applications.length}</b>
        </div>
        <div className="stat">
          <span>In process</span>
          <b>{inProcess}</b>
        </div>
        <div className="stat">
          <span>Saved jobs</span>
          <b>{saved.length}</b>
        </div>
        <div className="stat">
          <span>Profile strength</span>
          <b>{profileStrength(user)}%</b>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
          My applications
        </button>
        <button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}>
          Saved jobs ({saved.length})
        </button>
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
          My profile &amp; resume
        </button>
      </div>

      {tab === 'overview' &&
        (applications.length === 0 ? (
          <div className="card empty">
            <b>No applications yet</b>
            Browse jobs and hit “Apply now” — they will all show up here with live status.
          </div>
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.job.title}</b>
                      <div className="tiny muted">{money(a.job)}</div>
                    </td>
                    <td>
                      <div className="row">
                        <Logo company={a.job.company} size={28} />
                        <span className="small">{a.job.company?.name}</span>
                      </div>
                    </td>
                    <td className="small muted">{ago(a.appliedAt)}</td>
                    <td>
                      <StatusTag status={a.status} />
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/jobs?job=${a.jobId}`)}>
                        View job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'saved' &&
        (saved.length === 0 ? (
          <div className="card empty">
            <b>No saved jobs</b>
            Tap “Save job” on any listing to keep it here.
          </div>
        ) : (
          <div className="joblist">
            {saved.map((j) => (
              <div key={j.id}>
                <JobCard job={j} onClick={() => router.push(`/jobs?job=${j.id}`)} />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 6 }}
                  onClick={() => toggleSaveJob(user.id, j.id)}
                >
                  Remove from saved
                </button>
              </div>
            ))}
          </div>
        ))}

      {tab === 'profile' && <CandidateProfile user={user} />}
    </div>
  );
}

function profileStrength(user) {
  const checks = [user.headline, user.location, user.phone, user.about, user.resumeName, user.skills?.length, user.languages?.length];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function CandidateProfile({ user }) {
  const [f, setF] = useState({
    name: user.name || '',
    headline: user.headline || '',
    location: user.location || '',
    phone: user.phone || '',
    experienceYears: user.experienceYears || 0,
    skills: (user.skills || []).join(', '),
    languages: (user.languages || []).join(', '),
    shiftPreference: user.shiftPreference || '',
    setupPreference: user.setupPreference || '',
    expectedSalary: user.expectedSalary || '',
    about: user.about || '',
    resumeName: user.resumeName || '',
  });
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setSaved(false);
  };

  const save = () => {
    updateProfile(user.id, {
      ...f,
      experienceYears: Number(f.experienceYears) || 0,
      skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean),
      languages: f.languages.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSaved(true);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setF((prev) => ({ ...prev, resumeName: file.name }));
    updateProfile(user.id, { resumeName: file.name });
    setSaved(true);
  };

  return (
    <div className="split">
      <div className="card pad stack sticky">
        <h4 style={{ fontSize: 14 }}>Resume</h4>
        <div className="card pad" style={{ background: 'var(--bg)', boxShadow: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: 26 }}>📄</div>
          <b className="small" style={{ display: 'block', marginTop: 4, wordBreak: 'break-all' }}>
            {f.resumeName || 'No resume uploaded'}
          </b>
          <span className="tiny muted">PDF or DOCX, max 5 MB</span>
        </div>
        <label className="btn btn-ghost btn-block" style={{ cursor: 'pointer' }}>
          {f.resumeName ? 'Replace resume' : 'Upload resume'}
          <input type="file" accept=".pdf,.doc,.docx" onChange={onFile} style={{ display: 'none' }} />
        </label>
        <div className="tiny muted">
          Profile strength: <b>{profileStrength(user)}%</b> — recruiters see this profile when you apply.
        </div>
      </div>

      <div className="card pad stack">
        {saved && <div className="ok">Profile saved.</div>}
        <div className="grid-2">
          <div className="field">
            <label>Full name</label>
            <input className="input" value={f.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" value={f.phone} onChange={set('phone')} placeholder="+63 9xx xxx xxxx" />
          </div>
        </div>
        <div className="field">
          <label>Headline</label>
          <input className="input" value={f.headline} onChange={set('headline')} placeholder="CSR — 3 years US telco experience" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Location</label>
            <input className="input" value={f.location} onChange={set('location')} placeholder="City, Country" />
          </div>
          <div className="field">
            <label>Years of BPO experience</label>
            <input className="input" type="number" min="0" value={f.experienceYears} onChange={set('experienceYears')} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Preferred shift</label>
            <select className="select" value={f.shiftPreference} onChange={set('shiftPreference')}>
              <option value="">No preference</option>
              <option>Night Shift (US Hours)</option>
              <option>Day Shift</option>
              <option>Mid Shift</option>
              <option>Shifting</option>
            </select>
          </div>
          <div className="field">
            <label>Preferred setup</label>
            <select className="select" value={f.setupPreference} onChange={set('setupPreference')}>
              <option value="">No preference</option>
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Work From Home</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Skills (comma separated)</label>
            <input className="input" value={f.skills} onChange={set('skills')} placeholder="Inbound Voice, Zendesk, Retention" />
          </div>
          <div className="field">
            <label>Languages (comma separated)</label>
            <input className="input" value={f.languages} onChange={set('languages')} placeholder="English, Filipino" />
          </div>
        </div>
        <div className="field">
          <label>Expected salary</label>
          <input className="input" value={f.expectedSalary} onChange={set('expectedSalary')} placeholder="35,000 PHP / month" />
        </div>
        <div className="field">
          <label>About me</label>
          <textarea className="textarea" value={f.about} onChange={set('about')} />
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save profile
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ recruiter */

const EMPTY_JOB = {
  title: '',
  category: 'Customer Service',
  campaign: 'Inbound Voice',
  level: 'Entry Level',
  setup: 'On-site',
  shift: 'Night Shift (US Hours)',
  location: '',
  languages: 'English',
  salaryMin: '',
  salaryMax: '',
  currency: 'PHP',
  period: 'month',
  seats: 1,
  experience: 'No BPO experience required',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
};

function Recruiter({ user }) {
  const router = useRouter();
  const [tab, setTab] = useState('jobs');
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);

  const jobs = getJobsByRecruiter(user);
  const applicants = getApplicantsForRecruiter(user);
  const company = getCompany(user.companyId);
  const newApps = applicants.filter((a) => a.status === 'Applied').length;

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <div className="row" style={{ marginBottom: 18 }}>
        <Logo company={company} size={46} />
        <div>
          <h2 style={{ fontSize: 22 }}>{company?.name || 'Recruiter dashboard'}</h2>
          <div className="muted small">
            {user.name} · {user.title || 'Recruiter'}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setTab('post')}>
          + Post a job
        </button>
      </div>

      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat">
          <span>Active jobs</span>
          <b>{jobs.length}</b>
        </div>
        <div className="stat">
          <span>Total applicants</span>
          <b>{applicants.length}</b>
        </div>
        <div className="stat">
          <span>New (unreviewed)</span>
          <b>{newApps}</b>
        </div>
        <div className="stat">
          <span>Open seats</span>
          <b>{jobs.reduce((n, j) => n + Number(j.seats || 0), 0)}</b>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>
          My job posts ({jobs.length})
        </button>
        <button className={tab === 'applicants' ? 'active' : ''} onClick={() => setTab('applicants')}>
          Applicants ({applicants.length})
        </button>
        <button className={tab === 'post' ? 'active' : ''} onClick={() => setTab('post')}>
          Post a job
        </button>
        <button className={tab === 'company' ? 'active' : ''} onClick={() => setTab('company')}>
          Company profile
        </button>
      </div>

      {tab === 'jobs' &&
        (jobs.length === 0 ? (
          <div className="card empty">
            <b>No job posts yet</b>
            Use “Post a job” to publish your first campaign.
          </div>
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Setup / Shift</th>
                  <th>Seats</th>
                  <th>Applicants</th>
                  <th>Posted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <b>{j.title}</b>
                      <div className="tiny muted">{j.location}</div>
                    </td>
                    <td className="small">
                      {j.setup}
                      <div className="tiny muted">{j.shift}</div>
                    </td>
                    <td>{j.seats}</td>
                    <td>
                      <span className="tag tag-brand">{j.applicantCount}</span>
                    </td>
                    <td className="small muted">{ago(j.postedAt)}</td>
                    <td>
                      <div className="row">
                        <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/jobs?job=${j.id}`)}>
                          View
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            if (confirm('Delete this job post and its applications?')) deleteJob(j.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'applicants' && <Applicants user={user} applicants={applicants} />}
      {tab === 'post' && <PostJob user={user} onPosted={() => setTab('jobs')} />}
      {tab === 'company' && <CompanyProfile company={company} />}
    </div>
  );
}

function Applicants({ user, applicants }) {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const list = filter ? applicants.filter((a) => a.status === filter) : applicants;

  if (applicants.length === 0) {
    return (
      <div className="card empty">
        <b>No applicants yet</b>
        Applications to your job posts land here.
      </div>
    );
  }

  return (
    <>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <select className="select" style={{ maxWidth: 220 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="muted small">{list.length} applicant(s)</span>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Applied for</th>
              <th>Experience</th>
              <th>Preferences</th>
              <th>Resume</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="row">
                    <div className="avatar">{initials(a.candidate.name)}</div>
                    <div>
                      <b>{a.candidate.name}</b>
                      <div className="tiny muted">{a.candidate.location || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="small">
                  {a.job.title}
                  <div className="tiny muted">{ago(a.appliedAt)}</div>
                </td>
                <td className="small">{a.candidate.experienceYears || 0} yrs</td>
                <td className="tiny muted">
                  {a.candidate.shiftPreference || '—'}
                  <br />
                  {a.candidate.setupPreference || '—'}
                </td>
                <td className="small">
                  {a.candidate.resumeName ? (
                    <span className="tag tag-accent" title={a.candidate.resumeName}>
                      📄 CV
                    </span>
                  ) : (
                    <span className="tag">None</span>
                  )}
                </td>
                <td>
                  <select
                    className="select"
                    style={{ padding: '5px 8px', fontSize: 13, minWidth: 125 }}
                    value={a.status}
                    onChange={(e) => setApplicationStatus(a.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const t = openThread(user.id, a.candidate.id, a.jobId);
                      router.push(`/messages?t=${t}`);
                    }}
                  >
                    Message
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PostJob({ user, onPosted }) {
  const [f, setF] = useState(EMPTY_JOB);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.location.trim() || !f.description.trim() || !f.salaryMin || !f.salaryMax) {
      return setError('Title, location, salary range and description are required.');
    }
    createJob({
      ...f,
      companyId: user.companyId,
      postedBy: user.id,
      salaryMin: Number(f.salaryMin),
      salaryMax: Number(f.salaryMax),
      seats: Number(f.seats) || 1,
      languages: f.languages.split(',').map((s) => s.trim()).filter(Boolean),
      responsibilities: lines(f.responsibilities),
      requirements: lines(f.requirements),
      benefits: lines(f.benefits),
    });
    setF(EMPTY_JOB);
    onPosted();
  };

  return (
    <form className="card pad stack" onSubmit={submit}>
      {error && <div className="error">{error}</div>}
      <div className="field">
        <label>Job title *</label>
        <input className="input" value={f.title} onChange={set('title')} placeholder="Customer Service Representative — US Telco" />
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Category</label>
          <select className="select" value={f.category} onChange={set('category')}>
            {[
              'Customer Service',
              'Technical Support',
              'Sales',
              'Collections',
              'Back Office',
              'Healthcare Support',
              'Quality Assurance',
              'Team Lead / Supervisor',
              'Training',
              'Workforce Management',
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Campaign type</label>
          <select className="select" value={f.campaign} onChange={set('campaign')}>
            {[
              'Inbound Voice',
              'Outbound Sales',
              'Outbound Collections',
              'Non-Voice / Chat',
              'Back Office',
              'Quality / Training',
              'Support Function',
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Work setup</label>
          <select className="select" value={f.setup} onChange={set('setup')}>
            <option>On-site</option>
            <option>Hybrid</option>
            <option>Work From Home</option>
          </select>
        </div>
        <div className="field">
          <label>Shift</label>
          <select className="select" value={f.shift} onChange={set('shift')}>
            <option>Night Shift (US Hours)</option>
            <option>Day Shift</option>
            <option>Mid Shift</option>
            <option>Shifting</option>
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Experience level</label>
          <select className="select" value={f.level} onChange={set('level')}>
            <option>Entry Level</option>
            <option>Mid Level</option>
            <option>Team Lead</option>
            <option>Manager</option>
          </select>
        </div>
        <div className="field">
          <label>Location *</label>
          <input className="input" value={f.location} onChange={set('location')} placeholder="Taguig, Metro Manila, PH" />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Salary range *</label>
          <div className="row">
            <input className="input" type="number" value={f.salaryMin} onChange={set('salaryMin')} placeholder="Min" />
            <input className="input" type="number" value={f.salaryMax} onChange={set('salaryMax')} placeholder="Max" />
            <select className="select" style={{ maxWidth: 100 }} value={f.currency} onChange={set('currency')}>
              <option>PHP</option>
              <option>USD</option>
              <option>INR</option>
              <option>COP</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Open seats</label>
          <input className="input" type="number" min="1" value={f.seats} onChange={set('seats')} />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Languages (comma separated)</label>
          <input className="input" value={f.languages} onChange={set('languages')} />
        </div>
        <div className="field">
          <label>Experience requirement</label>
          <input className="input" value={f.experience} onChange={set('experience')} />
        </div>
      </div>

      <div className="field">
        <label>Job description *</label>
        <textarea className="textarea" value={f.description} onChange={set('description')} />
      </div>
      <div className="field">
        <label>Responsibilities (one per line)</label>
        <textarea className="textarea" value={f.responsibilities} onChange={set('responsibilities')} />
      </div>
      <div className="field">
        <label>Requirements (one per line)</label>
        <textarea className="textarea" value={f.requirements} onChange={set('requirements')} />
      </div>
      <div className="field">
        <label>Benefits (one per line)</label>
        <textarea className="textarea" value={f.benefits} onChange={set('benefits')} />
      </div>

      <button className="btn btn-primary" type="submit">
        Publish job
      </button>
    </form>
  );
}

function CompanyProfile({ company }) {
  const [f, setF] = useState({ ...company });
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setSaved(false);
  };

  if (!company) return <div className="card empty">No company linked to this account.</div>;

  return (
    <div className="split">
      <div className="card pad stack sticky" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo company={f} size={64} />
        </div>
        <b>{f.name}</b>
        <span className="tiny muted">{f.industry}</span>
        {f.verified ? <span className="tag tag-accent">Verified employer</span> : <span className="tag tag-warn">Pending review</span>}
      </div>
      <div className="card pad stack">
        {saved && <div className="ok">Company profile saved.</div>}
        <div className="grid-2">
          <div className="field">
            <label>Company name</label>
            <input className="input" value={f.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label>Industry</label>
            <input className="input" value={f.industry} onChange={set('industry')} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Company size</label>
            <input className="input" value={f.size} onChange={set('size')} />
          </div>
          <div className="field">
            <label>Headquarters</label>
            <input className="input" value={f.hq} onChange={set('hq')} />
          </div>
        </div>
        <div className="field">
          <label>Website</label>
          <input className="input" value={f.website} onChange={set('website')} />
        </div>
        <div className="field">
          <label>About the company</label>
          <textarea className="textarea" value={f.about} onChange={set('about')} />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            upsertCompany(f);
            setSaved(true);
          }}
        >
          Save company profile
        </button>
      </div>
    </div>
  );
}
