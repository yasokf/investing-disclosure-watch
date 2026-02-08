import { useState } from 'react';

export default function TanshinUploadPage() {
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event) => {
    event.preventDefault();
    const fileInput = event.target.elements.pdfs?.files;
    const folderInput = event.target.elements.folder?.files;
    const files = [...(fileInput ? Array.from(fileInput) : []), ...(folderInput ? Array.from(folderInput) : [])];
    if (files.length === 0) {
      setStatus('PDFファイルを選択してください。');
      return;
    }

    setIsUploading(true);
    setStatus('アップロード中...');

    try {
      const uploads = files.map(async (file) => {
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
          body: JSON.stringify({
            filename: file.name,
            relativePath: file.webkitRelativePath || file.name,
            data: base64
          })
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
      <h1>PDF取り込み</h1>
      <p>決算短信PDFをアップロードして、inputフォルダに保存します。</p>
      <form onSubmit={handleUpload} style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            PDFファイル選択:
            <input type="file" name="pdfs" accept="application/pdf" multiple style={{ marginLeft: 8 }} />
          </label>
          <label>
            フォルダ選択:
            <input
              type="file"
              name="folder"
              accept="application/pdf"
              multiple
              webkitdirectory="true"
              directory="true"
              style={{ marginLeft: 8 }}
            />
          </label>
        </div>
        <button type="submit" disabled={isUploading} style={{ marginLeft: 8 }}>
          {isUploading ? 'アップロード中...' : 'アップロード'}
        </button>
      </form>
      {status ? <p style={{ marginTop: 8 }}>{status}</p> : null}
    </main>
  );
}
