'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession, logout, resetDemo, subscribe } from '../lib/store';

export function useSession() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setUser(getSession());
    sync();
    setReady(true);
    return subscribe(sync);
  }, []);
  return { user, ready };
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function DemoBar() {
  return (
    <div className="demobar">
      <div className="container">
        <span>
          <b>Demo build</b> — seeded sample data, everything you do is saved in your browser.
        </span>
        <button onClick={resetDemo}>Reset demo data</button>
      </div>
    </div>
  );
}

export function Nav() {
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const is = (p) => (pathname === p || pathname === `${p}/` ? 'active' : '');

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          BPOHire
        </Link>

        <div className={`nav-links ${open ? 'mobile-open' : ''}`} onClick={() => setOpen(false)}>
          <Link className={is('/jobs')} href="/jobs">
            Find Jobs
          </Link>
          <Link className={is('/companies')} href="/companies">
            Companies
          </Link>
          {user && (
            <Link className={is('/dashboard')} href="/dashboard">
              Dashboard
            </Link>
          )}
          {user && (
            <Link className={is('/messages')} href="/messages">
              Messages
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link className={is('/admin')} href="/admin">
              Admin
            </Link>
          )}
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <Link href="/dashboard" className="nav-user">
                <span className="small">{user.name}</span>
                <div className="avatar">{initials(user.name)}</div>
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
          <button className="btn btn-ghost btn-sm navtoggle" onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ color: '#fff', marginBottom: 10 }}>
              <span className="brand-mark">B</span> BPOHire
            </div>
            <p style={{ margin: 0, maxWidth: 320 }}>
              The hiring platform built only for the BPO and contact center industry — voice, non-voice, back office and support
              functions.
            </p>
          </div>
          <div>
            <h5>Candidates</h5>
            <div className="stack" style={{ display: 'grid', gap: 6 }}>
              <Link href="/jobs">Browse jobs</Link>
              <Link href="/dashboard">My applications</Link>
              <Link href="/dashboard">Saved jobs</Link>
              <Link href="/register">Create profile</Link>
            </div>
          </div>
          <div>
            <h5>Employers</h5>
            <div style={{ display: 'grid', gap: 6 }}>
              <Link href="/dashboard">Post a job</Link>
              <Link href="/dashboard">Recruiter dashboard</Link>
              <Link href="/companies">Company profiles</Link>
            </div>
          </div>
          <div>
            <h5>Platform</h5>
            <div style={{ display: 'grid', gap: 6 }}>
              <Link href="/admin">Admin panel</Link>
              <Link href="/messages">Messaging</Link>
              <Link href="/jobs">Search &amp; filters</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BPOHire — demo build.</span>
          <span>Next.js · React · Node/Express REST API · PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="pad">{children}</div>
      </div>
    </div>
  );
}
