import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DisclosureDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [items, setItems] = useState([]);

  const loadItems = async () => {
    const res = await fetch('/api/disclosures?watchlist=1');
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    if (!id) {
      return;
    }
    loadItems();
  }, [id]);

  const item = useMemo(() => items.find((entry) => entry.id === id), [items, id]);

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>開示詳細</h1>
      <p>
        <Link href="/disclosures">開示一覧へ戻る</Link>
      </p>
      {!id ? (
        <p>読み込み中...</p>
      ) : !item ? (
        <p>該当する開示が見つかりません。</p>
      ) : (
        <section>
          <dl>
            <dt>日時</dt>
            <dd>
              {item.date} {item.time}
            </dd>
            <dt>コード</dt>
            <dd>{item.code}</dd>
            <dt>会社名</dt>
            <dd>{item.company}</dd>
            <dt>タイトル</dt>
            <dd>{item.title}</dd>
          </dl>
          {item.url ? (
            <p>
              <a
                href={`/api/pdf?url=${encodeURIComponent(item.url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                PDFを開く
              </a>
            </p>
          ) : (
            <p>PDFリンクがありません。</p>
          )}
          {item.url ? (
            <iframe
              title="PDF"
              src={`/api/pdf?url=${encodeURIComponent(item.url)}`}
              style={{ width: '100%', height: '80vh', border: '1px solid #ccc' }}
            />
          ) : null}
        </section>
      )}
    </main>
  );
}
