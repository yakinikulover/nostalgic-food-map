import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function StoreList() {
  const [stores, setStores] = useState([])

  useEffect(() => {
    supabase
      .from('stores')
      .select('id, name, founding_year, deep_night')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setStores(data)
      })
  }, [])

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>店舗一覧</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {stores.map((store) => (
          <li key={store.id} style={{
            marginBottom: 12,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 6
          }}>
            <Link href={`/stores/${store.id}`}>
              <a style={{ textDecoration: 'none', color: '#0070f3', fontSize: 18 }}>
                {store.name}
                {store.deep_night && ' 🌙'}
              </a>
            </Link>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              創業年: {store.founding_year || '不明'}
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}
