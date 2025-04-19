import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ReportsAdmin() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  // 通報一覧を取得
  useEffect(() => {
    supabase
      .from('reports')
      .select(`
        id,
        reason,
        resolved,
        created_at,
        post:posts(id, title),
        reporter:users!reporter_id(id, email)
      `)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setReports(data)
        setLoading(false)
      })
  }, [])

  // 解決フラグを更新
  const handleResolve = async (id) => {
    await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('id', id)
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, resolved: true } : r
      )
    )
  }

  if (loading) return <p>Loading…</p>
  if (reports.length === 0) return <p>通報はありません</p>

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>通報一覧（管理画面）</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['日時','投稿タイトル','通報者','理由','状態','操作'].map((h) => (
              <th key={h} style={{
                border: '1px solid #ddd',
                padding: 8,
                textAlign: 'left'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} style={{ background: r.resolved ? '#f9f9f9' : 'white' }}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {new Date(r.created_at).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <a
                  href={`/posts/${r.post.id}`}
                  style={{ color: '#0070f3' }}
                >
                  {r.post.title}
                </a>
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {r.reporter.email}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {r.reason}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {r.resolved ? '解決済み' : '未処理'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {!r.resolved && (
                  <button
                    onClick={() => handleResolve(r.id)}
                    style={{
                      padding: '4px 8px',
                      background: '#0070f3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                    }}
                  >
                    解決
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
