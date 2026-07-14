'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { register } from '../../lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('candidate');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      return setError('Please enter your name, a valid email and a password of at least 6 characters.');
    }
    const res = register({ ...form, role });
    if (res.error) return setError(res.error);
    router.push('/dashboard');
  };

  return (
    <div className="authwrap">
      <div className="authcard card pad stack">
        <div>
          <h2 style={{ fontSize: 22 }}>Create your account</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Free for candidates and employers.
          </p>
        </div>

        <div className="rolepick">
          <button type="button" className={role === 'candidate' ? 'on' : ''} onClick={() => setRole('candidate')}>
            <b>I'm looking for a job</b>
            <span>Apply, save jobs, chat with recruiters</span>
          </button>
          <button type="button" className={role === 'recruiter' ? 'on' : ''} onClick={() => setRole('recruiter')}>
            <b>I'm hiring</b>
            <span>Post jobs, screen and message applicants</span>
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit} className="stack">
          <div className="field">
            <label>Full name</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Juan Dela Cruz" />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" value={form.email} onChange={set('email')} placeholder="you@email.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            Create account
          </button>
        </form>

        <p className="small muted" style={{ margin: 0, textAlign: 'center' }}>
          Already registered? <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
