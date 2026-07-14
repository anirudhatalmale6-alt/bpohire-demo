'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { initials, useSession } from '../../components/Chrome';
import { getThreadsForUser, sendMessage, subscribe } from '../../lib/store';

function MessagesInner() {
  const { user, ready } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [active, setActive] = useState(params.get('t') || null);
  const [text, setText] = useState('');
  const [, force] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  useEffect(() => {
    if (ready && !user) router.push('/login');
  }, [ready, user, router]);

  const threads = user ? getThreadsForUser(user) : [];
  useEffect(() => {
    if (!active && threads.length) setActive(threads[0].id);
  }, [threads, active]);

  const thread = threads.find((t) => t.id === active) || null;

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread?.messages?.length, active]);

  if (!user) return <div className="container section muted">Loading…</div>;

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !thread) return;
    sendMessage(thread.id, user.id, text);
    setText('');
  };

  return (
    <div className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <h2 style={{ fontSize: 22, marginBottom: 14 }}>Messages</h2>

      {threads.length === 0 ? (
        <div className="card empty">
          <b>No conversations yet</b>
          {user.role === 'recruiter'
            ? 'Message an applicant from the Applicants tab to start a conversation.'
            : 'Open a job and hit “Message recruiter” to start a conversation.'}
        </div>
      ) : (
        <div className="split">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="threadlist">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className={`threaditem ${t.id === active ? 'active' : ''}`}
                  onClick={() => setActive(t.id)}
                >
                  <div className="avatar">{initials(t.other?.name || '?')}</div>
                  <div style={{ minWidth: 0 }}>
                    <b className="small" style={{ display: 'block' }}>
                      {t.other?.name}
                    </b>
                    <div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.last?.text || 'No messages yet'}
                    </div>
                    {t.job && <span className="tag tiny" style={{ marginTop: 4 }}>{t.job.title.slice(0, 28)}…</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {thread ? (
              <div className="chat">
                <div className="row pad" style={{ borderBottom: '1px solid var(--line)' }}>
                  <div className="avatar">{initials(thread.other?.name || '?')}</div>
                  <div>
                    <b className="small" style={{ display: 'block' }}>
                      {thread.other?.name}
                    </b>
                    <span className="tiny muted">
                      {thread.other?.role === 'recruiter' ? thread.other?.title || 'Recruiter' : thread.other?.headline}
                    </span>
                  </div>
                  {thread.job && (
                    <>
                      <div className="spacer" />
                      <span className="tag tag-brand">{thread.job.title}</span>
                    </>
                  )}
                </div>

                <div className="chat-body" ref={bodyRef}>
                  {thread.messages.map((m) => (
                    <div key={m.id} className={`bubble ${m.from === user.id ? 'me' : 'them'}`}>
                      {m.text}
                      <span className="at">
                        {new Date(m.at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                  {thread.messages.length === 0 && <div className="muted small">No messages yet — say hello.</div>}
                </div>

                <form className="chat-input" onSubmit={send}>
                  <input
                    className="input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a message…"
                  />
                  <button className="btn btn-primary" type="submit">
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="empty">Select a conversation</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="container section muted">Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
