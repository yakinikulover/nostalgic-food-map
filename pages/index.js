import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  return (
    <main
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1>Nostalgic Food Map</h1>
      <button
        onClick={handleLogin}
        style={{
          padding: '8px 16px',
          borderRadius: 4,
          background: '#000',
          color: '#fff',
        }}
      >
        GitHub でログイン
      </button>
    </main>
  );
}
