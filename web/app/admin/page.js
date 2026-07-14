'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { initials, useSession } from '../../components/Chrome';
import { Logo, ago, money } from '../../components/Job';
import {
  deleteJob,
  getAdminStats,
  getAllCompanies,
  getAllUsers,
  getJobs,
  subscribe,
  verifyCompany,
} from '../../lib/store';

export default function AdminPage() {
  const { user, ready } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [, force] = useState(0);

  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  useEffect(() => {
    if (ready && (!user || user.role !== 'admin')) router.push('/login');
  }, [ready, user, router]);

  if (!user || user.role !== 'admin') return <div className="container section muted">Loading…</div>;

  const stats = getAdminStats();
  const users = getAllUsers();
  const companies = getAllCompanies();
  const jobs = getJobs();

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <div className="row" style={{ marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 22 }}>Admin panel</h2>
          <div className="muted small">Platform-wide moderation and reporting.</div>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 12 }}>
        <div className="stat">
          <span>Total users</span>
          <b>{stats.users}</b>
        </div>
        <div className="stat">
          <span>Candidates</span>
          <b>{stats.candidates}</b>
        </div>
        <div className="stat">
          <span>Recruiters</span>
          <b>{stats.recruiters}</b>
        </div>
        <div className="stat">
          <span>Companies</span>
          <b>{stats.companies}</b>
        </div>
      </div>
      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat">
          <span>Live jobs</span>
          <b>{stats.jobs}</b>
        </div>
        <div className="stat">
          <span>Applications</span>
          <b>{stats.applications}</b>
        </div>
        <div className="stat">
          <span>Messages sent</span>
          <b>{stats.messages}</b>
        </div>
        <div className="stat">
          <span>Apps / job</span>
          <b>{stats.jobs ? (stats.applications / stats.jobs).toFixed(1) : '0'}</b>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
          Job moderation
        </button>
        <button className={tab === 'companies' ? 'active' : ''} onClick={() => setTab('companies')}>
          Companies
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Users
        </button>
      </div>

      {tab === 'overview' && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Salary</th>
                <th>Seats</th>
                <th>Posted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <b>{j.title}</b>
                    <div className="tiny muted">
                      {j.category} · {j.location}
                    </div>
                  </td>
                  <td className="small">{j.company?.name}</td>
                  <td className="small">{money(j)}</td>
                  <td>{j.seats}</td>
                  <td className="small muted">{ago(j.postedAt)}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (confirm('Remove this job from the platform?')) deleteJob(j.id);
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'companies' && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>HQ</th>
                <th>Jobs</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="row">
                      <Logo company={c} size={32} />
                      <b>{c.name}</b>
                    </div>
                  </td>
                  <td className="small">{c.industry}</td>
                  <td className="small muted">{c.hq}</td>
                  <td>{c.jobCount}</td>
                  <td>
                    {c.verified ? (
                      <span className="tag tag-accent">Verified</span>
                    ) : (
                      <span className="tag tag-warn">Pending</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => verifyCompany(c.id, !c.verified)}>
                      {c.verified ? 'Revoke' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email</th>
                <th>Location</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="row">
                      <div className="avatar">{initials(u.name)}</div>
                      <div>
                        <b>{u.name}</b>
                        <div className="tiny muted">{u.headline || u.title || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${u.role === 'admin' ? 'tag-danger' : u.role === 'recruiter' ? 'tag-brand' : ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="small muted">{u.email}</td>
                  <td className="small muted">{u.location || '—'}</td>
                  <td className="small muted">{ago(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
