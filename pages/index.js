import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session) {
    return (
      <main style={{
        display:'flex',
        height:'100vh',
        alignItems:'center',
        justifyContent:'center',
        flexDirection:'column'
      }}>
        <h1>ようこそ、{session.user.email} さん！</h1>
      </main>
    )
  }

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  return (
    <main style={{
      display:'flex',
      height:'100vh',
      alignItems:'center',
      justifyContent:'center',
      flexDirection:'column'
    }}>
      <h1>Nostalgic Food Map</h1>
      <button
        onClick={handleLogin}
        style={{
          padding:'8px 16px',
          borderRadius:4,
          background:'#000',
          color:'#fff'
        }}
      >
        GitHub でログイン
      </button>
    </main>
  )
}
