import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

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

function TanshinKpiTable({ rows }) {
  const list = rows || [];
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
            const sales = m.sales || m.revenue || {};
            const op = m.operatingProfit || m.op || {};
            const orders = m.orders || {};
            const backlog = m.backlog || {};

            return (
              <tr key={r.path || r.name}>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtNum(sales.value)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtNum(op.value)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtPct(sales.yoyPct)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtPct(op.yoyPct)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtNum(orders.value)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtNum(backlog.value)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtPct(orders.yoyPct)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '10px 12px', textAlign: 'right' }}>
                  {fmtPct(backlog.yoyPct)}
                </td>
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
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setStatus('解析中...');
    try {
      const response = await fetch('/api/tanshin-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'failed to extract');
      }
      const payload = await response.json();
      setRows(payload.items || []);
      setMetadata({
        totalCount: payload.totalCount,
        maxFiles: payload.maxFiles,
        baseDir: payload.baseDir
      });
      setStatus('解析が完了しました。');
    } catch (error) {
      setStatus(`解析に失敗しました: ${error.message}`);
      setRows([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Tanshin Summary</h1>
      <p>このページは決算短信のサマリーを表示します。</p>
      <p style={{ marginTop: 8 }}>
        PDFをアップロードする場合は <Link href="/tanshin-upload">PDF取り込み</Link> を利用してください。
      </p>
      <div style={{ marginTop: 16 }}>
        <button type="button" onClick={loadSummary} disabled={isLoading}>
          {isLoading ? '解析中...' : '再解析'}
        </button>
        {status ? <p style={{ marginTop: 8 }}>{status}</p> : null}
        {metadata ? (
          <p style={{ marginTop: 8 }}>
            対象フォルダ: {metadata.baseDir} / 件数: {metadata.totalCount} (最大 {metadata.maxFiles} 件)
          </p>
        ) : null}
      </div>
      <TanshinKpiTable rows={rows} />
    </main>
  );
}
