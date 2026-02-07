# Investing Disclosure Watch (MVP)

最小で動く投資家向け開示ウォッチャーの土台です。Next.jsのフロントとAPIを同居させ、JSONファイルに監視銘柄を保存します。

## 機能
- 監視銘柄の追加・削除
- 監視銘柄のJSON保存
- TDnet一覧の取得と表示（監視銘柄に絞り込み）

## 起動手順

```bash
npm install
npm run dev
```

Windowsは `start-dev.bat` をダブルクリックで起動してください。

ブラウザで `http://localhost:3000/watchlist` を開いてください。

- 監視銘柄の追加・削除: `/watchlist`
- 開示一覧: `/disclosures`

初回起動時にJSONファイル（`data.json`）が作成され、監視銘柄が保存されます。
