import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // ページ読み込み時に既存セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    // ログイン／ログアウトがあったら session を更新
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // ログイン済みならウェルカム画面
  if (session) {
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
        <h1>ようこそ、{session.user.email} さん！</h1>
      </main>
    )
  }

  // 未ログインならログインボタン
  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'github' })
  }

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
  )
}
