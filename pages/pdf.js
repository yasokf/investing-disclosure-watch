import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const isAllowedPdfUrl = (value) => {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      parsed.host === 'www.release.tdnet.info' &&
      parsed.pathname.toLowerCase().endsWith('.pdf')
    );
  } catch (error) {
    return false;
  }
};

export default function PdfPage() {
  const router = useRouter();
  const { u } = router.query;

  const pdfUrl = useMemo(() => (typeof u === 'string' ? u : ''), [u]);
  const isValid = useMemo(() => (pdfUrl ? isAllowedPdfUrl(pdfUrl) : false), [pdfUrl]);
  const proxyUrl = useMemo(
    () => (isValid ? `/api/proxy-pdf?u=${encodeURIComponent(pdfUrl)}` : ''),
    [isValid, pdfUrl]
  );

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>PDF表示</h1>
      <p>
        <Link href="/disclosures">開示一覧へ戻る</Link>
      </p>
      {!pdfUrl ? (
        <p>PDFのURLが指定されていません。</p>
      ) : !isValid ? (
        <p>許可されていないPDFのURLです。</p>
      ) : (
        <section>
          <p>
            <a href={proxyUrl} target="_blank" rel="noopener noreferrer">
              PDFを開く
            </a>
          </p>
          <iframe
            title="PDF"
            src={proxyUrl}
            style={{ width: '100%', height: '80vh', border: '1px solid #ccc' }}
          />
        </section>
      )}
    </main>
  );
}
