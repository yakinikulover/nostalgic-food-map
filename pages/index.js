import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  // ログインセッションを保持
  const [session, setSession]     = useState(null)
  // 投稿一覧を保持
  const [posts, setPosts]         = useState([])
  // 検索キーワード
  const [searchTerm, setSearchTerm] = useState('')
  // false=降順, true=昇順
  const [sortAsc, setSortAsc]     = useState(false)

  // 認証状態の取得＆監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  // 投稿一覧を取得
  useEffect(() => {
    supabase
      .from('posts')
      .select('id, title, created_at, post_images(image_url)')
      .then(({ data, error }) => !error && setPosts(data))
  }, [])

  // 検索＋ソート後の配列を作成
  const filteredAndSorted = posts
    .filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const t1 = new Date(a.created_at).getTime()
      const t2 = new Date(b.created_at).getTime()
      return sortAsc ? t1 - t2 : t2 - t1
    })

  // ログイン済み画面
  if (session) {
    return (
      <main style={{ padding: 20, maxWidth: 1000, margin: 'auto' }}>
        <h1>ようこそ、{session.user.email} さん！</h1>

        {/* 検索＆ソートコントロール */}
        <div style={{
          marginTop: 16,
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
        }}>
          <input
            type="text"
            placeholder="タイトルで検索"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: 8,
              width: 240,
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <button
            onClick={() => setSortAsc(!sortAsc)}
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          >
            日付 {sortAsc ? '昇順' : '降順'}
          </button>
        </div>

        {/* 投稿カード一覧 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
          marginTop: 24,
        }}>
          {filteredAndSorted.map(post => (
            <div key={post.id} style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${post.post_images[0]?.image_url}`}
                alt=""
                style={{ width: '100%', height: 160, objectFit: 'cover' }}
              />
              <Link href={`/posts/${post.id}`}>
                <h2 style={{
                  fontSize: 18,
                  margin: '8px',
                  cursor: 'pointer',
                  color: '#0070f3',
                }}>
                  {post.title}
                </h2>
              </Link>
              <p style={{
                fontSize: 12,
                color: '#666',
                margin: '0 8px 8px',
              }}>
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </main>
    )
  }

  // 未ログイン画面
  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  return (
    <main style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}>
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
