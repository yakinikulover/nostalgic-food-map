import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PostDetail() {
  const router = useRouter()
  const { id } = router.query
  const [post, setPost] = useState(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        created_at,
        post_images(image_url),
        author:users!author_id(username:email)
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setPost(data)
      })
  }, [id])

  if (!post) return <p>読み込み中…</p>

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <Link href="/">
        ← 一覧へ戻る
      </Link>
      <h1 style={{ marginTop: 20 }}>{post.title}</h1>
      <p style={{ color: '#666', fontSize: 12 }}>
        {new Date(post.created_at).toLocaleDateString()} by {post.author.username}
      </p>
      {post.post_images.map((img) => (
        <img
          key={img.image_url}
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${img.image_url}`}
          alt=""
          style={{ width: '100%', marginTop: 12 }}
        />
      ))}
      <p style={{ marginTop: 20, lineHeight: 1.6 }}>{post.body}</p>
    </main>
  )
}
