import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function CreatePost() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/')
      else setSession(session)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !file) return alert('タイトルと画像は必須です')
    setLoading(true)
    try {
      // 画像アップロード
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { data: stored, error: err1 } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, file)
      if (err1) throw err1

      // 投稿レコード登録
      const { data: post, error: err2 } = await supabase
        .from('posts')
        .insert({ author_id: session.user.id, title, body })
        .select('id')
        .single()
      if (err2) throw err2

      // 画像テーブル登録
      const { error: err3 } = await supabase
        .from('post_images')
        .insert({ post_id: post.id, image_url: stored.path })
      if (err3) throw err3

      alert('投稿できました！')
      router.push('/')
    } catch (error) {
      console.error(error)
      alert('投稿中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null
  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>新規投稿</h1>
      <form onSubmit={handleSubmit}>
        <label>タイトル（必須）</label><br/>
        <input
          type="text" value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
        <div style={{ marginTop: 12 }}>
          <label>本文</label><br/>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>画像（必須）</label><br/>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files[0])}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            padding: '8px 16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {loading ? '投稿中…' : '投稿する'}
        </button>
      </form>
    </main>
  )
}
