import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const loadItems = async () => {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const addItem = async (event) => {
    event.preventDefault();
    setError('');
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || '登録に失敗しました');
      return;
    }
    setCode('');
    setName('');
    loadItems();
  };

  const deleteItem = async (id) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    loadItems();
  };

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>監視銘柄の登録</h1>
      <p>
        <Link href="/disclosures">開示一覧へ</Link>
      </p>
      <form onSubmit={addItem} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <label>
          銘柄コード
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            style={{ display: 'block', width: '100%', padding: 8 }}
            placeholder="例: 7203"
          />
        </label>
        <label>
          銘柄名
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ display: 'block', width: '100%', padding: 8 }}
            placeholder="例: トヨタ自動車"
          />
        </label>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        <button type="submit" style={{ padding: '8px 16px' }}>
          追加
        </button>
      </form>

      <h2>登録済み</h2>
      {items.length === 0 ? (
        <p>まだ登録がありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}
            >
              <span>
                {item.code} - {item.name}
              </span>
              <button type="button" onClick={() => deleteItem(item.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
