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

ブラウザで `http://localhost:3000/` を開いてください。
トップページから各機能への導線があります。

Windowsでは `start.bat` をダブルクリックすると `npm install` の後に `npm run dev` を実行し、
ブラウザを開きます。

- 監視銘柄の追加・削除: `/watchlist`
- 開示一覧: `/disclosures`
- 短信PDFまとめ: `/tanshin-summary`

初回起動時にJSONファイル（`data.json`）が作成され、監視銘柄が保存されます。
