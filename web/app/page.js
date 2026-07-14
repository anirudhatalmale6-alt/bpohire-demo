'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { JobCard, Logo } from '../components/Job';
import { getAllCompanies, getJobs } from '../lib/store';

const CATEGORIES = [
  { name: 'Customer Service', icon: '🎧' },
  { name: 'Technical Support', icon: '🛠️' },
  { name: 'Sales', icon: '📈' },
  { name: 'Collections', icon: '💳' },
  { name: 'Back Office', icon: '🗂️' },
  { name: 'Healthcare Support', icon: '🏥' },
  { name: 'Quality Assurance', icon: '✅' },
  { name: 'Team Lead / Supervisor', icon: '👥' },
];

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    setJobs(getJobs());
    setCompanies(getAllCompanies());
  }, []);

  const search = (e) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (location) p.set('location', location);
    router.push(`/jobs?${p.toString()}`);
  };

  const featured = jobs.filter((j) => j.featured).slice(0, 3);
  const latest = jobs.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-badge">● {jobs.length} live BPO roles from {companies.length} verified employers</span>
          <h1>
            The hiring platform built <em>only for the BPO industry</em>
          </h1>
          <p className="sub">
            Voice, non-voice, back office and support functions. Filter by campaign type, shift, work setup and language — not by
            generic job-board categories that were never designed for contact centers.
          </p>

          <form className="searchbar" onSubmit={search}>
            <div className="sb-field">
              <span className="muted">🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job title, skill or campaign (e.g. inbound voice)"
                aria-label="Search jobs"
              />
            </div>
            <div className="sb-field sep">
              <span className="muted">📍</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or country"
                aria-label="Location"
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ padding: '10px 22px' }}>
              Search jobs
            </button>
          </form>

          <div className="chips">
            <span className="tiny" style={{ color: '#8ea0ba', alignSelf: 'center' }}>
              Popular:
            </span>
            {['Inbound Voice', 'Work From Home', 'Night Shift', 'Bilingual', 'No experience', 'Team Lead'].map((c) => (
              <button
                key={c}
                className="chip"
                onClick={() => router.push(`/jobs?q=${encodeURIComponent(c)}`)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>

          <div className="hero-stats">
            <div>
              <b>{jobs.reduce((n, j) => n + j.seats, 0).toLocaleString()}</b>
              <span>Open seats</span>
            </div>
            <div>
              <b>{companies.length}</b>
              <span>Employers hiring</span>
            </div>
            <div>
              <b>4</b>
              <span>Countries</span>
            </div>
            <div>
              <b>24h</b>
              <span>Avg. recruiter response</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Browse by BPO function</h2>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Categories that actually match how contact centers hire.
              </p>
            </div>
          </div>
          <div className="joblist" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
            {CATEGORIES.map((c) => {
              const count = jobs.filter((j) => j.category === c.name).length;
              return (
                <Link key={c.name} href={`/jobs?category=${encodeURIComponent(c.name)}`} className="card pad">
                  <div style={{ fontSize: 22 }}>{c.icon}</div>
                  <b style={{ display: 'block', marginTop: 6 }}>{c.name}</b>
                  <span className="tiny muted">{count} open role{count === 1 ? '' : 's'}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Featured roles</h2>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Priority campaigns with mass hiring right now.
              </p>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/jobs">
              View all jobs →
            </Link>
          </div>
          <div className="joblist">
            {featured.map((j) => (
              <JobCard key={j.id} job={j} onClick={() => router.push(`/jobs?job=${j.id}`)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Latest jobs</h2>
            <Link className="btn btn-ghost btn-sm" href="/jobs">
              Browse all →
            </Link>
          </div>
          <div className="joblist">
            {latest.map((j) => (
              <JobCard key={j.id} job={j} onClick={() => router.push(`/jobs?job=${j.id}`)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Employers hiring now</h2>
            <Link className="btn btn-ghost btn-sm" href="/companies">
              All companies →
            </Link>
          </div>
          <div className="joblist" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {companies.map((c) => (
              <Link key={c.id} href={`/jobs?company=${c.id}`} className="card pad row">
                <Logo company={c} size={42} />
                <div style={{ minWidth: 0 }}>
                  <b style={{ display: 'block' }}>{c.name}</b>
                  <span className="tiny muted">
                    {c.jobCount} open role{c.jobCount === 1 ? '' : 's'} · {c.hq.split(',').slice(-1)[0].trim()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="card pad"
            style={{
              background: 'linear-gradient(120deg, #0b1220, #1e3a8a)',
              color: '#fff',
              border: 'none',
              padding: 30,
            }}
          >
            <div className="row wrap">
              <div style={{ maxWidth: 560 }}>
                <h2 style={{ fontSize: 24 }}>Hiring for a campaign?</h2>
                <p style={{ color: '#a5b3c9', margin: '8px 0 0' }}>
                  Post a job, screen applicants by shift and setup preference, and message candidates directly from the recruiter
                  dashboard. Mass-hiring campaigns with 100+ seats are handled natively.
                </p>
              </div>
              <div className="spacer" />
              <Link className="btn btn-primary" href="/register">
                Post a job free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
