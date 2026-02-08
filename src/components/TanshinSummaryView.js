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

const extractionFields = [
  { key: 'company_name', label: '会社名' },
  { key: 'securities_code', label: '証券コード' },
  { key: 'fiscal_period', label: '対象期間' },
  { key: 'summary', label: 'サマリー' },
  { key: 'net_sales', label: '売上高' },
  { key: 'operating_profit', label: '営業利益' },
  { key: 'ordinary_profit', label: '経常利益' },
  { key: 'net_profit', label: '当期純利益' },
  { key: 'eps', label: 'EPS' },
  { key: 'dividend', label: '配当' },
  { key: 'risk', label: 'リスク' }
];

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

function ExtractionTable({ items }) {
  const list = items || [];
  return (
    <div style={{ overflowX: 'auto', marginTop: 24 }}>
      <h2>抽出結果</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1000 }}>
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #ddd',
                padding: '10px 12px',
                background: '#f5f5f5',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              ファイル
            </th>
            {extractionFields.map((field) => (
              <th
                key={field.key}
                style={{
                  border: '1px solid #ddd',
                  padding: '10px 12px',
                  background: '#f5f5f5',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((item) => (
            <tr key={item.file}>
              <td style={{ border: '1px solid #ddd', padding: '10px 12px', whiteSpace: 'nowrap' }}>
                {item.file}
              </td>
              {extractionFields.map((field) => {
                const value = item.data?.[field.key]?.value ?? '-';
                return (
                  <td key={field.key} style={{ border: '1px solid #ddd', padding: '10px 12px' }}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
          {list.length === 0 ? (
            <tr>
              <td
                colSpan={extractionFields.length + 1}
                style={{ border: '1px solid #ddd', padding: 14, textAlign: 'center' }}
              >
                抽出データがありません
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function TanshinSummaryView() {
  const [rows, setRows] = useState([]);
  const [extracted, setExtracted] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setStatus('解析中...');
    try {
      const [kpiResponse, analysisResponse] = await Promise.all([
        fetch('/api/tanshin-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }),
        fetch('/api/tanshin-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      ]);

      const errors = [];
      let kpiPayload = null;
      let analysisPayload = null;

      if (kpiResponse.ok) {
        kpiPayload = await kpiResponse.json();
      } else {
        const payload = await kpiResponse.json();
        errors.push(payload.error || 'failed to extract metrics');
      }

      if (analysisResponse.ok) {
        analysisPayload = await analysisResponse.json();
        if (analysisPayload.error) {
          errors.push(analysisPayload.error);
        }
      } else {
        const payload = await analysisResponse.json();
        errors.push(payload.error || 'failed to run analysis');
      }

      if (kpiPayload) {
        setRows(kpiPayload.items || []);
      }
      if (analysisPayload) {
        setExtracted(analysisPayload.extracted || []);
      }

      setMetadata({
        totalCount: kpiPayload?.totalCount ?? 0,
        maxFiles: kpiPayload?.maxFiles ?? 0,
        baseDir: kpiPayload?.baseDir ?? '-',
        outputDir: analysisPayload?.outputDir ?? '-',
        extractedCount: analysisPayload?.extractedCount ?? 0
      });

      if (errors.length > 0) {
        setStatus(`解析に失敗しました: ${errors.join(' / ')}`);
      } else {
        setStatus('解析が完了しました。');
      }
    } catch (error) {
      setStatus(`解析に失敗しました: ${error.message}`);
      setRows([]);
      setExtracted([]);
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
            対象フォルダ: {metadata.baseDir} / 出力: {metadata.outputDir} / 件数: {metadata.totalCount} (最大{' '}
            {metadata.maxFiles} 件) / 抽出済み: {metadata.extractedCount}
          </p>
        ) : null}
      </div>
      <TanshinKpiTable rows={rows} />
      <ExtractionTable items={extracted} />
    </main>
  );
}
