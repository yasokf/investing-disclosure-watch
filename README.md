# Investing Disclosure Watch (MVP)

最小で動く投資家向け開示ウォッチャーの土台です。Next.jsのフロントとAPIを同居させ、SQLiteに監視銘柄とダミー開示データを保存します。

## 機能
- 監視銘柄の追加・削除
- 監視銘柄のDB保存（SQLite）
- ダミー開示データの保存と一覧表示

## 起動手順

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000/watchlist` を開いてください。

- 監視銘柄の追加・削除: `/watchlist`
- 開示一覧: `/disclosures`

初回起動時にSQLiteファイル（`data.sqlite3`）が作成され、ダミー開示データが保存されます。
