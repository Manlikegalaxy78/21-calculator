import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.signOut().then(() => router.replace('/signin'));
  }, [router]);
  return <div className="device" style={{ padding: 40, textAlign: 'center' }}>Signing out…</div>;
}
