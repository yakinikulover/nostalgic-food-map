import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function UserProfile() {
  const router = useRouter()
  const { id } = router.query
  const [userMeta, setUserMeta] = useState(null)
  const [userPosts, setUserPosts] = useState([])

  // ユーザー情報を取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('users')
      .select('id, name, email, avatar_url, rep_score, role')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setUserMeta(data)
      })
  }, [id])

  // 投稿一覧を取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('posts')
      .select('id, title, created_at, post_images(image_url)')
      .eq('author_id', id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setUserPosts(data)
      })
  }, [id])

  if (!userMeta) return <p>読み込み中…</p>

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <Link href="/">
        ← トップへ戻る
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
        {userMeta.avatar_url && (
          <img
            src={userMeta.avatar_url}
            alt="avatar"
            style={{ width: 64, height: 64, borderRadius: '50%', marginRight: 16 }}
          />
        )}
        <div>
          <h1>{userMeta.name || userMeta.email}</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            {userMeta.role}  ·  評価: {userMeta.rep_score}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: 32 }}>投稿一覧</h2>
      {userPosts.length === 0 ? (
        <p>まだ投稿がありません</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}>
          {userPosts.map(post => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <a style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${post.post_images[0]?.image_url}`}
                    alt=""
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                  <h3 style={{ fontSize: 16, margin: '8px' }}>{post.title}</h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '0 8px 8px' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
