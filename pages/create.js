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
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  // セッション取得 & 店舗リスト取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/')
      else setSession(session)
    })
    supabase
      .from('stores')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setStores(data)
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !file || !selectedStore) {
      alert('タイトル、店舗選択、画像は必須です')
      return
    }
    setLoading(true)
    try {
      // 画像アップロード
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { data: storageData, error: storageErr } =
        await supabase.storage
          .from('post-images')
          .upload(fileName, file)
      if (storageErr) throw storageErr

      // 投稿作成
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          author_id: session.user.id,
          store_id: selectedStore,
          title,
          body,
        })
        .select('id')
        .single()
      if (postErr) throw postErr

      // 画像テーブル登録
      const { error: imgErr } = await supabase
        .from('post_images')
        .insert({ post_id: post.id, image_url: storageData.path })
      if (imgErr) throw imgErr

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
        <div>
          <label>店舗を選択（必須）</label><br/>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          >
            <option value="">-- 店舗を選んでください --</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>タイトル（必須）</label><br/>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>本文</label><br/>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>画像（必須）</label><br/>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
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
