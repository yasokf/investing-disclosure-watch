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
