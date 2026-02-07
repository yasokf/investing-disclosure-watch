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

  const formatNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return Number(value).toLocaleString();
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return `${Number(value).toFixed(1)}%`;
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
      {extractError ? <p style={{ color: 'crimson' }}>{extractError}</p> : null}

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

      {summary && summary.items.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>数値抽出</h2>
          <p style={{ color: '#555' }}>
            売上高・営業利益・進捗率などをPDF本文から推定します。根拠行と信頼度も表示します。
          </p>
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
              <p>
                対象件数: {extractResults.totalCount} / 最大 {extractResults.maxFiles}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                      ファイル名
                    </th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                      売上高 (当期/前期/差%/進捗%)
                    </th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                      営業利益 (当期/前期/差%/進捗%)
                    </th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                      受注残
                    </th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>
                      信頼度
                    </th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>
                      Evidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {extractResults.items.map((item) => (
                    <tr key={item.filePath}>
                      <td style={{ padding: 8 }}>{item.fileName}</td>
                      <td style={{ padding: 8 }}>
                        {item.metrics ? (
                          <>
                            {formatNumber(item.metrics.sales.current)} /{' '}
                            {formatNumber(item.metrics.sales.previous)} /{' '}
                            {formatPercent(item.metrics.sales.yoyPct)} /{' '}
                            {formatPercent(item.metrics.sales.progressPct)}
                          </>
                        ) : (
                          item.status
                        )}
                      </td>
                      <td style={{ padding: 8 }}>
                        {item.metrics ? (
                          <>
                            {formatNumber(item.metrics.operatingProfit.current)} /{' '}
                            {formatNumber(item.metrics.operatingProfit.previous)} /{' '}
                            {formatPercent(item.metrics.operatingProfit.yoyPct)} /{' '}
                            {formatPercent(item.metrics.operatingProfit.progressPct)}
                          </>
                        ) : (
                          item.status
                        )}
                      </td>
                      <td style={{ padding: 8 }}>
                        {item.metrics ? formatNumber(item.metrics.backlog) : '-'}
                      </td>
                      <td style={{ padding: 8, textAlign: 'right' }}>
                        {item.confidence?.toFixed ? item.confidence.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: 8 }}>
                        <details>
                          <summary>根拠</summary>
                          <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
                            {(item.evidence?.sales || []).map((line) => (
                              <li key={`sales-${line}`}>売上: {line}</li>
                            ))}
                            {(item.evidence?.operatingProfit || []).map((line) => (
                              <li key={`op-${line}`}>営業利益: {line}</li>
                            ))}
                            {(item.evidence?.forecastSales || []).map((line) => (
                              <li key={`fs-${line}`}>通期売上予想: {line}</li>
                            ))}
                            {(item.evidence?.forecastOperatingProfit || []).map((line) => (
                              <li key={`fo-${line}`}>通期営業利益予想: {line}</li>
                            ))}
                            {(item.evidence?.backlog || []).map((line) => (
                              <li key={`backlog-${line}`}>受注残: {line}</li>
                            ))}
                          </ul>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
