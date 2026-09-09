import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) return setError(signInErr.message);
    router.push('/app');
  }

  return (
    <div className="device auth-page">
      <div className="auth-hero">
        <img src="/logo-mark.png" alt="21 Calculator" className="auth-logo" />
        <div className="auth-divider" />
        <h1>Sign in</h1>
        <p>Keep reading the table.</p>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs">
          <button type="button" onClick={() => router.push('/signup')}>Sign up</button>
          <button type="button" className="active">Sign in</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <p style={{ color: 'var(--lose)', fontFamily: "'JetBrains Mono',monospace", fontSize: '11.5px' }}>{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : 'Sign in'}
          </button>
          <p className="auth-fineprint">Sign in with your email and password.</p>
        </form>
      </div>
    </div>
  );
}
