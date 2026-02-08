export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Investing Disclosure Watch</h1>
      <p style={{ color: '#555' }}>
        監視銘柄の登録、開示一覧の確認、そして短信PDFまとめの作成を行えるローカル向けアプリです。
      </p>
      <section style={{ display: 'grid', gap: 12 }}>
        <a href="/watchlist" style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          監視銘柄の登録を開く
        </a>
        <a href="/disclosures" style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          開示一覧を開く
        </a>
        <a
          href="/tanshin-summary"
          style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
        >
          短信PDFまとめを開く
        </a>
        <a
          href="/tanshin-summary-analysis"
          style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
        >
          短信PDFまとめ(抽出結果つき)を開く
        </a>
      </section>
    </main>
  );
}
