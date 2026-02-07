import { useState } from 'react';

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
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event) => {
    event.preventDefault();
    const files = event.target.elements.pdfs?.files;
    if (!files || files.length === 0) {
      setStatus('PDFファイルを選択してください。');
      return;
    }

    setIsUploading(true);
    setStatus('アップロード中...');

    try {
      const uploads = Array.from(files).map(async (file) => {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(file);
        });
        const base64 = String(dataUrl).split(',')[1] || '';
        const response = await fetch('/api/tanshin-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64 })
        });
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || 'upload failed');
        }
        return response.json();
      });

      const results = await Promise.all(uploads);
      setStatus(`アップロード完了: ${results.map((r) => r.filename).join(', ')}`);
    } catch (error) {
      setStatus(`アップロード失敗: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Tanshin Summary</h1>
      <p>このページは決算短信のサマリーを表示します。</p>
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>PDF取り込み</h2>
        <form onSubmit={handleUpload}>
          <input type="file" name="pdfs" accept="application/pdf" multiple />
          <button type="submit" disabled={isUploading} style={{ marginLeft: 8 }}>
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </button>
        </form>
        {status ? <p style={{ marginTop: 8 }}>{status}</p> : null}
      </section>
      <TanshinKpiTable rows={[]} />
    </main>
  );
}
