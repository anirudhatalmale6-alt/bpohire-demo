'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login } from '../../lib/store';

const DEMO = [
  { role: 'Candidate', email: 'maria@demo.com' },
  { role: 'Recruiter', email: 'james@demo.com' },
  { role: 'Admin', email: 'admin@demo.com' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const res = login(email, password);
    if (res.error) return setError(res.error);
    router.push(res.user.role === 'admin' ? '/admin' : '/dashboard');
  };

  const quick = (mail) => {
    const res = login(mail, 'demo1234');
    if (res.user) router.push(res.user.role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="authwrap">
      <div className="authcard stack">
        <div className="card pad stack">
          <div>
            <h2 style={{ fontSize: 22 }}>Welcome back</h2>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Log in to your BPOHire account.
            </p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={submit} className="stack">
            <div className="field">
              <label>Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Log in
            </button>
          </form>

          <p className="small muted" style={{ margin: 0, textAlign: 'center' }}>
            No account? <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>

        <div className="card pad stack">
          <div className="demo-creds">
            Demo accounts — password <code>demo1234</code> for all three. Click one to log straight in.
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {DEMO.map((d) => (
              <button key={d.email} className="btn btn-ghost btn-block" onClick={() => quick(d.email)}>
                Log in as {d.role} — {d.email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
