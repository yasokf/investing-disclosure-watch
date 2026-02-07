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

- 監視銘柄の追加・削除: `/watchlist`
- 開示一覧: `/disclosures`
- 短信PDFまとめ: `/tanshin-summary`

## Windowsのワンクリック起動

初回のみ `build_once.cmd` をダブルクリックしてください。依存導入とビルドを行います。

通常起動は `StartApp.vbs` をダブルクリックしてください。ローカルの本番サーバを起動し、
`http://127.0.0.1:3000/` を自動で開きます。LAN公開は行わず 127.0.0.1 固定です。

停止は `stop_app.cmd` をダブルクリックしてください。

初回起動時にJSONファイル（`data.json`）が作成され、監視銘柄が保存されます。

---

# 日本株 決算短信PDF 自動解析ツール

ローカルに保存した決算短信PDFを `input/` に置くだけで、`output/` にTSV/JSON/ログを生成する
デスクトップ向けの簡易解析ツールを同梱しています。Windowsでも動作するように、パスと文字コードは
UTF-8前提で統一しています。

## 前提条件

- Python 3.11+

## セットアップ

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .[dev]
```

## 使い方

### 一括処理

```bash
python -m ta batch
```

### 監視モード

```bash
python -m ta watch
```

`input/` フォルダに新しいPDFが追加されたら、自動で解析を実行します。

### 出力

- `output/{ファイル名}.tsv`: 1行11列（A〜K）で出力。C〜K列はダブルクォートで囲みます。
- `output/{ファイル名}.json`: 各項目に `page` と `snippet` の抽出根拠、`notes`、`confidence` を含むJSONです。
- `output/{ファイル名}.log`: 処理ログ。
- `output/.done.json`: 処理済みのハッシュ一覧（重複防止）。

## 抽出ルールについて

現在は骨組みを優先し、抽出ルールは最小限です。抽出できない項目は `不明` にし、
`notes` に理由を書き、`confidence` を低くしています。OCRは入れていませんが、
将来拡張できるように抽出ロジックを分離しています。

## テスト

```bash
pytest
```
