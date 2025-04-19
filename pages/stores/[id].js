import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function StoreDetail() {
  const router = useRouter()
  const { id } = router.query

  const [store, setStore] = useState(null)
  const [posts, setPosts] = useState([])

  // 店舗情報取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('stores')
      .select('id, name, address, founding_year, deep_night')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setStore(data)
      })
  }, [id])

  // その店舗の投稿一覧取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('posts')
      .select('id, title, created_at, post_images(image_url)')
      .eq('store_id', id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setPosts(data)
      })
  }, [id])

  if (!store) return <p>読み込み中…</p>

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <Link href="/stores">← 店舗一覧へ戻る</Link>

      <h1 style={{ marginTop: 20 }}>{store.name}</h1>
      <p style={{ color: '#666', margin: '4px 0' }}>
        {store.founding_year
          ? `創業 ${store.founding_year}年`
          : '創業年情報なし'}
        {store.deep_night && ' · 深夜営業 🌙'}
      </p>
      {store.address && (
        <p style={{ color: '#666', margin: '4px 0' }}>
          住所: {store.address}
        </p>
      )}

      <h2 style={{ marginTop: 32 }}>この店舗の投稿</h2>
      {posts.length === 0 && <p>まだ投稿がありません</p>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <a style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${post.post_images[0]?.image_url}`}
                  alt=""
                  style={{ width: '100%', height: 160, objectFit: 'cover' }}
                />
                <h3 style={{ fontSize: 16, margin: '8px' }}>{post.title}</h3>
                <p
                  style={{
                    fontSize: 12,
                    color: '#666',
                    margin: '0 8px 8px',
                  }}
                >
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </main>
  )
}
