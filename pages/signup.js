import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError("Passwords don't match.");

    setLoading(true);
    // 1. create the Supabase account
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      setLoading(false);
      return setError(signUpErr.message);
    }

    // 2. Supabase may require email confirmation depending on your project
    // settings, if so there's no session yet, so send them to check email.
    const session = data.session;
    if (!session) {
      setLoading(false);
      router.push('/check-email');
      return;
    }

    // 3. start Stripe Checkout for the plan they picked
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, accessToken: session.access_token }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.url) {
      window.location.href = json.url; // off to Stripe's hosted checkout page
    } else {
      setError(json.error || 'Could not start checkout.');
    }
  }

  return (
    <div className="device auth-page">
      <div className="auth-hero">
        <img src="/logo-mark.png" alt="21 Calculator" className="auth-logo" />
        <div className="auth-divider" />
        <h1>Create your account</h1>
        <p>One reading tool, pay monthly, or once and keep it forever.</p>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs">
          <button type="button" className="active">Sign up</button>
          <button type="button" onClick={() => router.push('/signin')}>Sign in</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Create password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>

          <div>
            <div className="plan-label">Choose a plan</div>
            <div className="plans">
              <div className={`plan-card${plan === 'monthly' ? ' selected' : ''}`} onClick={() => setPlan('monthly')}>
                <div className="plan-name">Monthly</div>
                <div className="plan-price">£5.99<span>/mo</span></div>
                <div className="plan-sub">billed monthly, cancel anytime</div>
              </div>
              <div className={`plan-card${plan === 'lifetime' ? ' selected' : ''}`} onClick={() => setPlan('lifetime')}>
                <span className="plan-badge">Pay once</span>
                <div className="plan-name">Lifetime</div>
                <div className="plan-price">£19.99<span>/once</span></div>
                <div className="plan-sub">~3.3 months of monthly, then free forever</div>
              </div>
            </div>
          </div>

          {error && <p style={{ color: 'var(--lose)', fontFamily: "'JetBrains Mono',monospace", fontSize: '11.5px' }}>{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : plan === 'monthly' ? 'Create account & subscribe' : 'Create account & unlock'}
          </button>
          <p className="auth-fineprint">
            {plan === 'monthly'
              ? "You'll be billed £5.99/mo starting today. Cancel anytime."
              : "You'll be charged £19.99 once, no recurring billing, ever."}
          </p>
        </form>
      </div>
    </div>
  );
}
