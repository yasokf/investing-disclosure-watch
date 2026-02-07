import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DisclosureListPage() {
  const [items, setItems] = useState([]);

  const loadItems = async () => {
    const res = await fetch('/api/disclosures?watchlist=1');
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>開示一覧</h1>
      <p>
        <Link href="/watchlist">監視銘柄へ戻る</Link>
        {' | '}
        <Link href="/tanshin-summary">短信PDFまとめへ</Link>
      </p>
      {items.length === 0 ? (
        <p>開示データがありません。</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                日時
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                コード
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                タイトル
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                PDF
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 8 }}>
                  {item.date} {item.time}
                </td>
                <td style={{ padding: 8 }}>{item.code}</td>
                <td style={{ padding: 8 }}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      PDF
                    </a>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
