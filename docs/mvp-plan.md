# 投資家向け開示ウォッチャー（最小完成形）計画

## 目的
- TDNETから開示情報を取得し、保存・閲覧できる最小の完成形（MVP）を作る。
- 画面は2つのみ：
  1. 監視銘柄の登録画面
  2. 開示の一覧画面
- 将来機能追加（通知、フィルタ、詳細表示等）を前提に拡張しやすい構造にする。

## MVPの構成（順番）

### 1. 基盤セットアップ
- アプリの骨組み（API + DB + UI）を作る。
- TDNETデータを保存するための最小スキーマを用意する。

### 2. 監視銘柄の登録（登録画面）
- 監視銘柄を登録・編集・削除できる。
- 監視銘柄テーブルへのCRUD APIを用意する。

### 3. TDNET取得と保存
- 取得処理（バッチ/定期実行）でTDNETの最新開示を取得。
- 監視銘柄に該当する開示のみDBに保存。

### 4. 開示一覧画面
- 監視銘柄に紐づく開示を一覧表示。
- 最低限のフィルタ（期間/銘柄）をUIに用意。

### 5. 初期運用サイクル
- 手動実行で取得 → DB保存 → UIで確認の流れを確認。
- 以降、通知や検索を追加できるように設計レビュー。

## 必要なファイル一覧（MVP）

### 1. データベース/モデル
- `schema.sql` or `prisma/schema.prisma` （監視銘柄/開示のテーブル）
- `src/models/Watchlist.ts`
- `src/models/Disclosure.ts`

### 2. TDNET取得
- `src/services/tdnetClient.ts` （TDNET取得ロジック）
- `src/jobs/fetchTdnet.ts` （定期実行/バッチ処理）

### 3. API
- `src/routes/watchlist.ts` （監視銘柄CRUD）
- `src/routes/disclosures.ts` （開示一覧取得）

### 4. UI
- `src/pages/WatchlistPage.tsx`
- `src/pages/DisclosureListPage.tsx`
- `src/components/DisclosureTable.tsx`

### 5. 設定・共通
- `src/config/index.ts`
- `src/utils/logger.ts`

## 拡張余地（将来追加）
- 通知（メール/Slack/LINE）
- 詳細ビュー（開示本文/リンク）
- 高度フィルタ（カテゴリ/キーワード）
- 監視ルール（銘柄別条件）

