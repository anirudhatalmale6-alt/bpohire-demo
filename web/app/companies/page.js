'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '../../components/Job';
import { getAllCompanies } from '../../lib/store';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  useEffect(() => setCompanies(getAllCompanies()), []);

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div className="section-head">
        <div>
          <h2>BPO employers</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Verified contact center and back-office companies hiring on the platform.
          </p>
        </div>
      </div>

      <div className="joblist" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}>
        {companies.map((c) => (
          <div key={c.id} className="card pad stack">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <Logo company={c} size={48} />
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 16 }}>
                  {c.name} {c.verified && <span title="Verified employer" style={{ color: 'var(--accent)' }}>✓</span>}
                </h3>
                <div className="tiny muted">{c.industry}</div>
              </div>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {c.about}
            </p>
            <div className="meta">
              <span className="tag">{c.size}</span>
              <span className="tag">{c.hq}</span>
              {c.verified ? <span className="tag tag-accent">Verified</span> : <span className="tag tag-warn">Pending review</span>}
            </div>
            <div className="row">
              <b className="small">
                {c.jobCount} open role{c.jobCount === 1 ? '' : 's'}
              </b>
              <div className="spacer" />
              <Link className="btn btn-ghost btn-sm" href={`/jobs?company=${c.id}`}>
                View jobs →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
