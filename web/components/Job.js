'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { applyToJob, hasApplied, isSaved, openThread, toggleSaveJob } from '../lib/store';
import { Modal, initials } from './Chrome';

export function money(job) {
  const fmt = (n) => new Intl.NumberFormat('en-US').format(n);
  return `${job.currency} ${fmt(job.salaryMin)} – ${fmt(job.salaryMax)} / ${job.period}`;
}

export function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Logo({ company, size }) {
  const s = size || 46;
  return (
    <div className="logo" style={{ background: company?.color || '#334155', width: s, height: s, minWidth: s }}>
      {company?.logo || '?'}
    </div>
  );
}

export function JobCard({ job, selected, onClick }) {
  return (
    <div className={`jobcard ${selected ? 'selected' : ''}`} onClick={onClick}>
      <Logo company={job.company} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <h3>{job.title}</h3>
            <div className="co">
              {job.company?.name} {job.company?.verified && <span title="Verified employer">✓</span>} · {job.location}
            </div>
          </div>
          <div className="spacer" />
          <div className="tiny muted" style={{ whiteSpace: 'nowrap' }}>
            {ago(job.postedAt)}
          </div>
        </div>
        <div className="meta">
          <span className="tag tag-brand">{job.campaign}</span>
          <span className="tag">{job.setup}</span>
          <span className="tag">{job.shift}</span>
          <span className="tag">{job.level}</span>
          {job.seats > 1 && <span className="tag tag-warn">{job.seats} seats</span>}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="salary">{money(job)}</span>
          <div className="spacer" />
          <span className="tiny muted">{job.languages?.join(' / ')}</span>
        </div>
      </div>
    </div>
  );
}

export function JobDetail({ job, user, onChanged }) {
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);

  if (!job) {
    return (
      <div className="card empty">
        <b>Select a job</b>
        Pick a job from the list to see the full description.
      </div>
    );
  }

  const applied = user ? hasApplied(user.id, job.id) : false;
  const saved = user ? isSaved(user.id, job.id) : false;

  const requireLogin = () => {
    router.push('/login');
  };

  const submitApply = () => {
    const res = applyToJob(user.id, job.id, note);
    setApplyOpen(false);
    setNote('');
    setMsg(res.error || 'Application sent. The recruiter can now see your profile and resume.');
    onChanged?.();
  };

  const messageRecruiter = () => {
    if (!user) return requireLogin();
    // In the demo the account owner (James Reyes / u2) is the recruiter contact.
    const threadId = openThread(job.postedBy || 'u2', user.id, job.id);
    router.push(`/messages?t=${threadId}`);
  };

  return (
    <div className="card pad detail">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Logo company={job.company} size={52} />
        <div style={{ minWidth: 0 }}>
          <h2>{job.title}</h2>
          <div className="muted small">
            {job.company?.name} · {job.location} · Posted {ago(job.postedAt).toLowerCase()}
          </div>
        </div>
      </div>

      <div className="row wrap" style={{ marginTop: 14 }}>
        {applied ? (
          <button className="btn btn-soft" disabled>
            ✓ Applied
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => (user ? setApplyOpen(true) : requireLogin())}>
            Apply now
          </button>
        )}
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (!user) return requireLogin();
            toggleSaveJob(user.id, job.id);
            onChanged?.();
          }}
        >
          {saved ? '★ Saved' : '☆ Save job'}
        </button>
        <button className="btn btn-ghost" onClick={messageRecruiter}>
          Message recruiter
        </button>
      </div>

      {msg && (
        <div className={msg.includes('already') ? 'error' : 'ok'} style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      <div className="sec" style={{ marginTop: 18 }}>
        <div className="kv">
          <div>
            <span>Salary</span>
            <b>{money(job)}</b>
          </div>
          <div>
            <span>Work setup</span>
            <b>{job.setup}</b>
          </div>
          <div>
            <span>Shift</span>
            <b>{job.shift}</b>
          </div>
          <div>
            <span>Experience</span>
            <b>{job.experience}</b>
          </div>
          <div>
            <span>Campaign type</span>
            <b>{job.campaign}</b>
          </div>
          <div>
            <span>Open seats</span>
            <b>{job.seats}</b>
          </div>
        </div>
      </div>

      <div className="sec">
        <h4>About the role</h4>
        <p style={{ margin: 0 }}>{job.description}</p>
      </div>

      {job.responsibilities?.length > 0 && (
        <div className="sec">
          <h4>Responsibilities</h4>
          <ul>
            {job.responsibilities.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {job.requirements?.length > 0 && (
        <div className="sec">
          <h4>Requirements</h4>
          <ul>
            {job.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {job.benefits?.length > 0 && (
        <div className="sec">
          <h4>Benefits</h4>
          <div className="meta">
            {job.benefits.map((b, i) => (
              <span className="tag tag-accent" key={i}>
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="sec">
        <h4>About {job.company?.name}</h4>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Logo company={job.company} size={40} />
          <div>
            <p className="small" style={{ margin: 0 }}>
              {job.company?.about}
            </p>
            <div className="meta">
              <span className="tag">{job.company?.industry}</span>
              <span className="tag">{job.company?.size}</span>
              <span className="tag">HQ: {job.company?.hq}</span>
            </div>
          </div>
        </div>
      </div>

      {applyOpen && (
        <Modal title={`Apply — ${job.title}`} onClose={() => setApplyOpen(false)}>
          <div className="stack">
            <div className="row">
              <div className="avatar">{initials(user.name)}</div>
              <div>
                <b>{user.name}</b>
                <div className="tiny muted">{user.headline || 'Candidate'}</div>
              </div>
            </div>
            <div className="card pad small" style={{ background: 'var(--bg)', boxShadow: 'none' }}>
              Resume attached: <b>{user.resumeName || 'No resume uploaded yet'}</b>
              {!user.resumeName && (
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  You can still apply — upload a resume from your dashboard to improve your chances.
                </div>
              )}
            </div>
            <div className="field">
              <label>Message to the recruiter (optional)</label>
              <textarea
                className="textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell them why you are a good fit for this campaign…"
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={submitApply}>
              Submit application
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
