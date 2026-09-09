import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      router.replace(session ? '/app' : '/signin');
    })();
  }, [router]);
  return <div className="device" style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
}
