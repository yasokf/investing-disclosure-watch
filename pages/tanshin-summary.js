import { useState } from 'react';
import Link from 'next/link';

const formatBytes = (bytes) => {
  if (!bytes) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(1)} ${units[index]}`;
};

export default function TanshinSummaryPage() {
  const [targetPath, setTargetPath] = useState('G:\\マイドライブ\\python\\tanshin_auto\\pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSummary(null);

    try {
      const res = await fetch('/api/tanshin-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '読み込みに失敗しました');
        return;
      }

      setSummary(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 840, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>短信PDFまとめ</h1>
      <p>
        <Link href="/watchlist">監視銘柄へ戻る</Link>
      </p>
      <p style={{ color: '#555' }}>
        G:\\マイドライブ\\python\\tanshin_auto\\pdf からアクセスできるフォルダを指定して、
        配下にあるPDFの一覧とサマリーを取得します。
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <label>
          参照するフォルダ
          <input
            type="text"
            value={targetPath}
            onChange={(event) => setTargetPath(event.target.value)}
            style={{ display: 'block', width: '100%', padding: 8 }}
          />
        </label>
        <button type="submit" style={{ padding: '8px 16px', width: 160 }} disabled={loading}>
          {loading ? '読み込み中...' : '一覧を取得'}
        </button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {summary ? (
        <section>
          <h2>サマリー</h2>
          <ul>
            <li>対象パス: {summary.path}</li>
            <li>PDF件数: {summary.totalCount}</li>
            <li>合計サイズ: {formatBytes(summary.totalSize)}</li>
            {summary.totalCount >= summary.maxFiles ? (
              <li style={{ color: '#b45309' }}>
                最大 {summary.maxFiles} 件まで表示しています。
              </li>
            ) : null}
          </ul>

          {summary.items.length === 0 ? (
            <p>PDFが見つかりませんでした。</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                    ファイル名
                  </th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                    パス
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>
                    サイズ
                  </th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                    更新日
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map((item) => (
                  <tr key={item.path}>
                    <td style={{ padding: 8 }}>{item.name}</td>
                    <td style={{ padding: 8, wordBreak: 'break-all' }}>{item.path}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatBytes(item.size)}</td>
                    <td style={{ padding: 8 }}>
                      {item.mtime ? new Date(item.mtime).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}
    </main>
  );
}
