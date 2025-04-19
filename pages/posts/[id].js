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

  // 投稿データ
  const [post, setPost] = useState(null)
  // ユーザーセッション
  const [session, setSession] = useState(null)
  // 通報フォーム用
  const [reason, setReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reported, setReported] = useState(false)
  // コメント機能用
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  // いいね機能用
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // 投稿取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('posts')
      .select('id, title, body, created_at, post_images(image_url)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          alert(`Error fetching post:\n${error.message}`)
        } else {
          setPost(data)
        }
      })
  }, [id])

  // セッション取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  // コメント取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('comments')
      .select('id, content, created_at, author:users!author_id(id, name)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setComments(data)
      })
  }, [id])

  // 自分のいいね状態取得
  useEffect(() => {
    if (!id || !session) return
    supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        setLiked(!!data)
      })
  }, [id, session])

  // いいね数取得
  useEffect(() => {
    if (!id) return
    supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)
      .then(({ count }) => {
        setLikeCount(count || 0)
      })
  }, [id, liked])

  if (!post) return <p>読み込み中…</p>

  // 通報処理
  const handleReport = async () => {
    if (!reason) return
    setReportLoading(true)
    try {
      const { error } = await supabase
        .from('reports')
        .insert({ post_id: id, reporter_id: session.user.id, reason })
      if (error) throw error
      setReported(true)
    } catch (e) {
      console.error(e)
      alert('通報中にエラーが発生しました')
    } finally {
      setReportLoading(false)
    }
  }

  // コメント投稿処理
  const handleComment = async () => {
    if (!newComment) return
    try {
      await supabase
        .from('comments')
        .insert({ post_id: id, author_id: session.user.id, content: newComment })
      // 再取得
      const { data } = await supabase
        .from('comments')
        .select('id, content, created_at, author:users!author_id(id, name)')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
      setComments(data)
      setNewComment('')
    } catch (e) {
      console.error(e)
      alert('コメント投稿中にエラーが発生しました')
    }
  }

  // いいね切り替え
  const toggleLike = async () => {
    if (!session) return
    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', session.user.id)
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: id, user_id: session.user.id })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <Link href="/">← 一覧へ戻る</Link>

      <h1 style={{ marginTop: 20 }}>{post.title}</h1>
      <p style={{ fontSize: 12, color: '#666' }}>
        {new Date(post.created_at).toLocaleDateString()}
      </p>

      {/* いいねボタン */}
      {session && (
        <button
          onClick={toggleLike}
          style={{
            marginTop: 8,
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid #0070f3',
            borderRadius: 4,
            color: liked ? '#e00' : '#0070f3',
            cursor: 'pointer',
          }}
        >
          {liked ? '❤️ いいね済み' : '🤍 いいね'} ({likeCount})
        </button>
      )}

      {/* 投稿画像 */}
      {post.post_images.map((img) => (
        <img
          key={img.image_url}
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${img.image_url}`}
          alt=""
          style={{ width: '100%', marginTop: 12 }}
        />
      ))}

      <p style={{ marginTop: 20, lineHeight: 1.6 }}>{post.body}</p>

      {/* 通報フォーム */}
      {session && !reported && (
        <div style={{ marginTop: 40 }}>
          <h3>この投稿を通報する</h3>
          <textarea
            placeholder="通報理由を入力してください"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button
            onClick={handleReport}
            disabled={!reason || reportLoading}
            style={{ marginTop: 12, padding: '8px 16px', background: '#e00', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            {reportLoading ? '送信中…' : '通報する'}
          </button>
        </div>
      )}
      {reported && (
        <p style={{ marginTop: 40, color: '#e00' }}>
          通報を受け付けました。ご協力ありがとうございます。
        </p>
      )}

      {/* コメント機能 */}
      {session && (
        <div style={{ marginTop: 40 }}>
          <h3>コメント</h3>
          <ul>
            {comments.map((c) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <strong>{c.author.name || c.author.email}:</strong> {c.content}
              </li>
            ))}
          </ul>
          <textarea
            placeholder="コメントを入力"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button
            onClick={handleComment}
            disabled={!newComment}
            style={{ marginTop: 8, padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            投稿
          </button>
        </div>
      )}
    </main>
  )
}
