import { useState } from 'react';
import Link from 'next/link';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(1)} ${units[index]}`;
};

const fmtNum = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return '-';
  return n.toLocaleString('ja-JP');
};

const fmtPct = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return '-';
  return `${n.toFixed(1)}%`;
};

function TanshinKpiTable({ items }) {
  const list = items || [];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
        <thead>
          <tr>
            {[
              '売上',
              '営業利益',
              '売上増加率',
              '営業利益増加率',
              '受注高',
              '受注残',
              '受注高増加率',
              '受注残増加率'
            ].map((h) => (
              <th
                key={h}
                style={{
                  border: '1px solid #ddd',
                  padding: '10px 12px',
                  background: '#f5f5f5',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const m = r.metrics || {};
            const sales = m.sales || {};
            const op = m.op || {};
            const orders = m.orders || {};
            const backlog = m.backlog || {};
            return (
              <tr key={r.path || r.name || r.filePath}>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtNum(sales.value)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtNum(op.value)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtPct(sales.yoyPct)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtPct(op.yoyPct)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtNum(orders.value)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtNum(backlog.value)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtPct(orders.yoyPct)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>{fmtPct(backlog.yoyPct)}</td>
              </tr>
            );
          })}
          {list.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ border: '1px solid #ddd', padding: 14, textAlign: 'center' }}>
                データがありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function TanshinSummaryPage() {
  const [targetPath, setTargetPath] = useState('G:\\マイドライブ\\python\\tanshin_auto\\pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractResults, setExtractResults] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSummary(null);
    setExtractResults(null);

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

  const handleExtract = async () => {
    setExtractLoading(true);
    setExtractError('');
    setExtractResults(null);

    try {
      const res = await fetch('/api/tanshin-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath })
      });

      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error || '抽出に失敗しました');
        return;
      }

      setExtractResults(data);
    } catch (fetchError) {
      setExtractError(fetchError.message);
    } finally {
      setExtractLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 12px' }}>
      <h1>短信PDFまとめ</h1>
      <p><Link href="/watchlist">監視銘柄へ戻る</Link></p>

      <p style={{ color: '#555' }}>
        Gドライブ配下のフォルダを指定して、PDFの棚卸しと数値抽出を行います。
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
      {extractError ? <p style={{ color: 'crimson' }}>{extractError}</p> : null}

      {summary ? (
        <section>
          <h2>サマリー</h2>
          <ul>
            <li>対象パス:{summary.path}</li>
            <li>PDF件数:{summary.totalCount}</li>
            <li>合計サイズ:{formatBytes(summary.totalSize)}</li>
            {summary.totalCount >= summary.maxFiles ? (
              <li style={{ color: '#b45309' }}>最大{summary.maxFiles}件まで表示しています。</li>
            ) : null}
          </ul>

          {summary.items?.length === 0 ? (
            <p>PDFが見つかりませんでした。</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>ファイル名</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>パス</th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>サイズ</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>更新日</th>
                </tr>
              </thead>
              <tbody>
                {(summary.items || []).map((item) => (
                  <tr key={item.path}>
                    <td style={{ padding: 8 }}>{item.name}</td>
                    <td style={{ padding: 8, wordBreak: 'break-all' }}>{item.path}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatBytes(item.size)}</td>
                    <td style={{ padding: 8 }}>{item.mtime ? new Date(item.mtime).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {summary && (summary.items || []).length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>数値抽出</h2>
          <p style={{ color: '#555' }}>PDF本文から売上、営業利益、受注高、受注残と増加率を推定します。欠損はハイフン表示です。</p>

          <button
            type="button"
            onClick={handleExtract}
            style={{ padding: '8px 16px', width: 180 }}
            disabled={extractLoading}
          >
            {extractLoading ? '抽出中...' : '抽出を実行'}
          </button>

          {extractResults ? (
            <div style={{ marginTop: 20 }}>
              <p>対象件数:{extractResults.totalCount}。最大:{extractResults.maxFiles}。</p>
              <TanshinKpiTable items={extractResults.items || []} />
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
