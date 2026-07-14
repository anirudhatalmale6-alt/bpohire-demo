'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSession } from '../../components/Chrome';
import { JobCard, JobDetail } from '../../components/Job';
import { getJobs, subscribe } from '../../lib/store';

const CATEGORIES = [
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
];
const SETUPS = ['On-site', 'Hybrid', 'Work From Home'];
const SHIFTS = ['Night Shift (US Hours)', 'Day Shift', 'Mid Shift', 'Shifting'];
const LEVELS = ['Entry Level', 'Mid Level', 'Team Lead', 'Manager'];
const LANGS = ['English', 'Spanish', 'Filipino'];

function JobsInner() {
  const params = useSearchParams();
  const { user } = useSession();
  const [tick, setTick] = useState(0);

  const [q, setQ] = useState(params.get('q') || '');
  const [location, setLocation] = useState(params.get('location') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [setup, setSetup] = useState('');
  const [shift, setShift] = useState('');
  const [level, setLevel] = useState('');
  const [language, setLanguage] = useState('');
  const [companyFilter] = useState(params.get('company') || '');
  const [selectedId, setSelectedId] = useState(params.get('job') || null);

  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const jobs = useMemo(() => {
    let list = getJobs({ q, location, category, setup, shift, level, language });
    if (companyFilter) list = list.filter((j) => j.companyId === companyFilter);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, location, category, setup, shift, level, language, companyFilter, tick]);

  useEffect(() => {
    if (!selectedId && jobs.length) setSelectedId(jobs[0].id);
  }, [jobs, selectedId]);

  const selected = jobs.find((j) => j.id === selectedId) || null;
  const activeFilters = [category, setup, shift, level, language].filter(Boolean).length + (location ? 1 : 0);

  const clear = () => {
    setQ('');
    setLocation('');
    setCategory('');
    setSetup('');
    setShift('');
    setLevel('');
    setLanguage('');
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="card pad" style={{ marginBottom: 18 }}>
        <div className="row wrap">
          <input
            className="input"
            style={{ flex: 2, minWidth: 220 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search job title, campaign, company or skill"
          />
          <input
            className="input"
            style={{ flex: 1, minWidth: 180 }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
          />
          {activeFilters > 0 || q ? (
            <button className="btn btn-ghost" onClick={clear}>
              Clear ({activeFilters + (q ? 1 : 0)})
            </button>
          ) : null}
        </div>
      </div>

      <div className="split-3">
        <aside className="card pad filterbox sticky">
          <h4>Filters</h4>
          <div className="field">
            <label>Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Work setup</label>
            <select className="select" value={setup} onChange={(e) => setSetup(e.target.value)}>
              <option value="">Any setup</option>
              {SETUPS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Shift</label>
            <select className="select" value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="">Any shift</option>
              {SHIFTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Experience level</label>
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Any level</option>
              {LEVELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Language</label>
            <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Any language</option>
              {LANGS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </aside>

        <div>
          <div className="row" style={{ marginBottom: 10 }}>
            <b>{jobs.length}</b>
            <span className="muted small">job{jobs.length === 1 ? '' : 's'} found</span>
          </div>
          <div className="joblist">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} selected={j.id === selectedId} onClick={() => setSelectedId(j.id)} />
            ))}
            {jobs.length === 0 && (
              <div className="card empty">
                <b>No jobs match those filters</b>
                Try widening your search or clearing a filter.
              </div>
            )}
          </div>
        </div>

        <div className="sticky" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <JobDetail job={selected} user={user} onChanged={() => setTick((t) => t + 1)} />
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="container section muted">Loading jobs…</div>}>
      <JobsInner />
    </Suspense>
  );
}
