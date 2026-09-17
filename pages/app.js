import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function AppGate() {
  const router = useRouter();
  const [state, setState] = useState('checking'); // checking | locked | unlocked
  const [session, setSession] = useState(null);
  const [busyPlan, setBusyPlan] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/signin');
        return;
      }
      setSession(session);

      // RLS means this only ever returns THIS user's own row, if any
      const { data, error } = await supabase.from('my_entitlement').select('*').maybeSingle();
      const isUnlocked = data && data.status === 'active';
      setState(isUnlocked ? 'unlocked' : 'locked');
    })();
  }, [router]);

  async function buy(plan) {
    setBusyPlan(plan);
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, accessToken: session.access_token }),
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else setBusyPlan(null);
  }

  if (state === 'checking') {
    return <div className="device" style={{ padding: 40, textAlign: 'center' }}>Checking your account…</div>;
  }

  if (state === 'unlocked') {
    return (
      <iframe
        src="/calculator.html"
        title="21 Calculator"
        style={{ border: 'none', width: '100vw', height: '100vh', display: 'block' }}
      />
    );
  }

  // signed in, but no active plan yet, a real paywall, not a demo
  return (
    <div className="device auth-page">
      <div className="auth-hero">
        <span className="dot" />
        <h1>Unlock 21 Calculator</h1>
        <p>You're signed in, pick a plan to start using the live calculator.</p>
      </div>
      <div className="auth-panel">
        <div className="auth-form" style={{ padding: '16px 18px 20px' }}>
          <div className="plans">
            <div className="plan-card selected" onClick={() => buy('monthly')}>
              <div className="plan-name">Monthly</div>
              <div className="plan-price">£4.99<span>/mo</span></div>
              <div className="plan-sub">billed monthly, cancel anytime</div>
            </div>
            <div className="plan-card" onClick={() => buy('lifetime')}>
              <span className="plan-badge">Pay once</span>
              <div className="plan-name">Lifetime</div>
              <div className="plan-price">£19.99<span>/once</span></div>
              <div className="plan-sub">~3.3 months of monthly, then free forever</div>
            </div>
          </div>
          <button className="auth-submit" style={{ marginTop: 14 }} disabled={!!busyPlan} onClick={() => buy('monthly')}>
            {busyPlan ? 'Redirecting to checkout…' : 'Continue to checkout'}
          </button>
          <p className="auth-fineprint">Or tap a plan above directly, either takes you to Stripe's secure checkout.</p>
        </div>
      </div>
    </div>
  );
}
