# NaviosAdmin 管理画面 作成プロンプト

```
あなたは地域情報共有アプリの管理画面構築に精通したシニアフルスタックエンジニアです。
以下の仕様に基づいて、本番品質の管理画面を構築してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 1. プロジェクト概要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **プロジェクト名**: NaviosAdmin
- **目的**: 地域情報共有モバイルアプリ「NaviOs」の運営管理画面。投稿・ユーザー・通報・コンテンツを一元管理する
- **利用者**: 運営スタッフ、コミュニティマネージャー、システム管理者
- **モバイルアプリ**: Expo + React Native（C:\NaviosMobileRelease）
- **共有バックエンド**: Supabase（Auth, PostgreSQL + PostGIS, Storage, Realtime）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 2. 技術スタック（確定済み）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **フロントエンド**: React 19 (SPA) + TypeScript 5 + Vite 6
- **UIライブラリ**: shadcn/ui + Tailwind CSS 4 + Lucide React + @base-ui/react
- **バックエンド/API**: Hono (Cloudflare Pages Functions)
- **DB**: Supabase (PostgreSQL + PostGIS)※モバイルアプリと同一DB
- **認証**: Supabase Auth
- **ホスティング**: Cloudflare Pages（無料枠）
- **ルーティング**: React Router v7
- **その他**: class-variance-authority, tw-animate-css, clsx, tailwind-merge

上記のスタックに厳密に従ってください。代替ライブラリは提案しないでください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 3. 既存DBスキーマ（モバイルアプリと共有）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

管理画面はモバイルアプリと**同一のSupabaseプロジェクト**に接続します。
以下のテーブルは既に存在しており、変更不可です:

### 既存テーブル

- **profiles** (id[uuid/PK], display_name, avatar_url, bio, location_text, is_verified, is_public, show_location, show_checkins, created_at, updated_at)
- **posts** (id[uuid/PK], author_id, category[lifeline|event|help], title, content, image_url, image_urls[], location[geography], location_text, deadline, crowd[crowded|moderate|empty|null], is_featured, likes_count, comments_count, tags[], created_at, updated_at)
- **talks** (id[uuid/PK], author_id, message[max140], image_url, image_urls[], location[geography], location_text, likes_count, replies_count, tags[], is_hall_of_fame, created_at)
- **comments** (id[uuid/PK], post_id, author_id, body, created_at)
- **talk_replies** (id[uuid/PK], talk_id, author_id, body, likes_count, created_at)
- **likes** (id[uuid/PK], user_id, target_type[post|talk|comment|reply], target_id, created_at) UNIQUE(user_id, target_type, target_id)
- **reports** (id[uuid/PK], reporter_id, target_type[feed|talk|nearby], target_id, reason[spam|inappropriate|misleading|harassment|dangerous|other], detail, created_at) UNIQUE(reporter_id, target_type, target_id)
- **user_badges** (id[uuid/PK], user_id, badge_type[resident|face|legend], area_name, earned_at) UNIQUE(user_id, badge_type, area_name)
- **notifications** (id[uuid/PK], user_id, type[like|comment|reply|hall_of_fame], title, body, target_type[post|talk|comment], target_id, actor_id, is_read, created_at)

### 既存RPC関数

- `get_street_history(user_lat, user_lng, radius_m, page_limit, page_offset)` — 街の記憶取得
- `search_posts_trgm(search_query, category_filter, result_limit)` — 全文検索
- `refresh_user_badges(target_user_id)` — バッジ再計算
- `get_user_top_badge(target_user_id)` — トップバッジ取得

### Storage Buckets

- `avatars` — アバター画像
- `post-images` — 投稿画像
- `talk-images` — トーク画像

### カテゴリ定義

| ID | ラベル | 説明 |
|----|--------|------|
| lifeline | ライフライン | 生活インフラ・防災情報 |
| event | イベント | 地域イベント・催し |
| help | 近助 | 助け合い・相互支援 |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 4. 画面構成と機能要件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 4-A. ダッシュボード（トップページ）

KPIカード:
- 今日の新規投稿数（posts + talks）/ 昨日比 ％表示
- 今月のアクティブユーザー数 / 前月比
- 未対応の通報件数（アラート表示）
- 殿堂入りトーク数（is_hall_of_fame = true）

グラフ:
- 投稿数推移（日別/週別/月別 切り替え可能な折れ線グラフ、posts と talks 別）
- カテゴリ別投稿構成（lifeline / event / help の円グラフ or 棒グラフ）
- ユーザー登録数推移（折れ線グラフ）

直近アクティビティ:
- 最新投稿5件のリスト（カテゴリバッジ付き）
- 最新通報5件のリスト（理由バッジ付き）

### 4-B. 投稿管理（Posts）

**一覧画面:**
- テーブル表示: 投稿画像サムネイル, タイトル, カテゴリ, 投稿者, いいね数, コメント数, 場所, 投稿日
- 検索: タイトル・内容・場所でのインクリメンタルサーチ
- フィルタ: カテゴリ(lifeline/event/help), is_featured, 期間指定, いいね数帯
- ソート: 各カラムクリックでのソート切り替え
- 一括操作: 複数選択 → 注目投稿(is_featured)ON/OFF / 一括削除
- ページネーション: 1ページ20件、ページサイズ変更可能
- CSV出力: 現在のフィルタ条件を反映した状態でエクスポート

**詳細・編集画面:**
- 基本情報: タイトル, 内容, カテゴリ, タグ, 投稿者プロフィールへのリンク
- メタ情報: 場所テキスト, 位置座標（地図表示は任意）, 期限, 混雑度
- 画像: image_url + image_urls[] の表示
- エンゲージメント: いいね数, コメント一覧（コメント削除可能）
- フラグ: is_featured の切り替え
- 削除: 物理削除、確認モーダル付き

### 4-C. ひとこと管理（Talks）

**一覧画面:**
- テーブル表示: メッセージ（140文字）, 投稿者, いいね数, リプライ数, 殿堂入り, 場所, 投稿日
- 検索: メッセージ内容でのインクリメンタルサーチ
- フィルタ: is_hall_of_fame, 期間指定, いいね数帯
- ページネーション + CSV出力

**詳細画面:**
- メッセージ内容, 画像, タグ
- 投稿者プロフィールへのリンク
- リプライ一覧（リプライ削除可能）
- 殿堂入りフラグの手動切り替え
- 削除: 物理削除、確認モーダル付き

### 4-D. ユーザー管理（Users / Profiles）

**一覧画面:**
- テーブル表示: アバター, 表示名, メール（auth.users から）, 認証済みフラグ, バッジ, 投稿数, 登録日
- 検索: 表示名, メールアドレス
- フィルタ: is_verified, 登録期間, バッジ保有
- CSV出力

**詳細画面:**
- プロフィール情報: 表示名, bio, アバター, 場所, 公開設定
- 認証済みフラグ（is_verified）の管理者切り替え
- バッジ一覧: user_badges の表示（種別, エリア名, 獲得日）
- 投稿履歴: このユーザーの posts / talks 一覧
- 統計: 累計投稿数, 累計いいね獲得数, 累計コメント数
- アカウント停止（BAN）: Supabase Auth のユーザー無効化

### 4-E. 通報管理（Reports）

**一覧画面:**
- テーブル表示: 通報対象タイプ, 通報理由, 詳細（truncate）, 通報者, 通報日, 対応状況
- フィルタ: target_type(feed/talk/nearby), reason, 対応状況（未対応/対応済み）
- ソート: 通報日順

**詳細画面:**
- 通報情報: 理由, 詳細テキスト, 通報者プロフィールへのリンク
- 対象コンテンツのプレビュー（投稿/トークの内容を表示）
- アクションボタン: 対象コンテンツ削除, ユーザーBAN, 通報を却下（対応済みに変更）

※ 既存reportsテーブルには「対応状況」カラムがないため、管理画面用に `status` カラム（pending/resolved/dismissed）の追加マイグレーションを作成してください。

### 4-F. 共通レイアウト

**サイドバーナビゲーション:**
- ダッシュボード, 投稿管理, ひとこと管理, ユーザー管理, 通報管理, 設定
- 折りたたみ可能（アイコンのみモード）
- 現在のページをハイライト
- 未対応通報件数のバッジ表示
- モバイル時はハンバーガーメニュー

**ヘッダー:**
- パンくずリスト
- 通報アラートベル（未対応件数バッジ付き）
- ユーザーアバター → ドロップダウン（プロフィール, ログアウト）

**共通UI:**
- トースト通知（成功/エラー/警告）
- 確認モーダル（削除・BAN などの破壊的操作時）
- ローディングスケルトン（データ取得中）
- 空状態（EmptyState）の表示
- エラーバウンダリ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 5. 権限管理（RBAC）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下の3ロールを実装:

| 権限 | Admin | Manager | Staff |
|------|-------|---------|-------|
| ダッシュボード閲覧 | ✅ | ✅ | ✅ |
| 投稿の閲覧 | ✅ | ✅ | ✅ |
| 投稿の編集（is_featured等） | ✅ | ✅ | ✅ |
| 投稿の削除 | ✅ | ✅ | ❌ |
| ひとことの閲覧 | ✅ | ✅ | ✅ |
| ひとことの削除 | ✅ | ✅ | ❌ |
| ユーザー閲覧 | ✅ | ✅ | ✅ |
| ユーザー編集（is_verified等） | ✅ | ✅ | ❌ |
| ユーザーBAN | ✅ | ❌ | ❌ |
| 通報の閲覧 | ✅ | ✅ | ✅ |
| 通報への対応（削除・BAN） | ✅ | ✅ | ❌ |
| CSV出力 | ✅ | ✅ | ❌ |
| 管理者ロール変更 | ✅ | ❌ | ❌ |
| システム設定 | ✅ | ❌ | ❌ |

実装方針:
- Hono API層での権限チェック必須
- 管理者ロールは profiles テーブルへの `admin_role` カラム追加 or 別テーブルで管理
- Supabase RLS に管理者用ポリシーを追加（Service Role Key はWorkers側のみで使用）
- フロントでは権限に応じてUI要素の表示/非表示を切り替え
- 権限不足時は403ページまたはトースト通知

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 6. 管理画面用の追加マイグレーション
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

既存テーブルを壊さないように、管理画面に必要なスキーマ変更を追加マイグレーションとして作成してください:

1. **reports テーブル**: `status` カラム追加（`pending` / `resolved` / `dismissed`、デフォルト `pending`）、`resolved_by` (uuid)、`resolved_at` (timestamptz)
2. **admin_users テーブル**: 管理画面のロール管理用（user_id, role[admin|manager|staff], created_at）
3. **管理者用RLSポリシー**: admin_users に登録されたユーザーが全テーブルを閲覧・操作できるポリシー

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 7. 非機能要件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **レスポンシブ**: デスクトップ優先、タブレットでも操作可能に
- **ダークモード**: ライト/ダークの切り替え対応（Tailwind CSS dark variant使用）
- **パフォーマンス**: テーブルのページネーション、Supabaseクエリの最適化
- **アクセシビリティ**: キーボードナビゲーション、適切なaria属性（shadcn/ui が標準対応）
- **エラーハンドリング**: API失敗時のリトライUI、ユーザーへの日本語エラーメッセージ
- **Cloudflare制約**: Workers の10MBサイズ制限を意識、Node.js APIに依存しない
- **DB安全性**: 管理画面の操作がモバイルアプリの既存データ・RLSを壊さないこと

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 8. 出力の進め方
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下の順序で段階的に実装してください:

**フェーズ1**: 共通レイアウト（サイドバー、ヘッダー、認証ガード、管理者用マイグレーション）
**フェーズ2**: ダッシュボード画面（KPIカード + グラフ）
**フェーズ3**: 投稿管理（一覧 + 詳細・編集）
**フェーズ4**: ひとこと管理（一覧 + 詳細）
**フェーズ5**: ユーザー管理（一覧 + 詳細）
**フェーズ6**: 通報管理（一覧 + 詳細 + 対応アクション）
**フェーズ7**: 権限管理 + CSV出力 + 仕上げ

各フェーズ完了時に「次に進みますか？」と確認してください。
一度にすべてを出力せず、フェーズごとに分割してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9. コード品質ルール
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- TypeScriptのstrictモード、any禁止
- コンポーネントは1ファイル150行以内を目安に分割
- カスタムフックでロジックを分離（usePosts, useTalks, useReports等）
- Supabase呼び出しは lib/ 層のサービス関数に集約（画面から直接書かない）
- Hono APIルートは functions/ に集約
- 定数・型定義は専用ファイルに分離
- 日本語コメントで要所にコメントを記載
- 環境変数はフロント側 VITE_ プレフィックス、Workers側は wrangler で管理

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 10. 既存プロジェクト情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

プロジェクトは既に初期化済みです。以下が構築済み:
- Vite + React 19 + TypeScript + Tailwind CSS 4 の設定
- Hono API (Cloudflare Pages Functions) の雛形（functions/api/[[route]].ts）
- React Router v7 によるルーティング（src/App.tsx）
- Supabase Auth による認証（AuthProvider + ProtectedRoute）
- shadcn/ui コンポーネント14種（button, card, input, table, dialog, dropdown-menu, avatar, badge, separator, sheet, sidebar, skeleton, tabs, tooltip）
- ログインページ（src/pages/login.tsx）とダッシュボード雛形（src/pages/dashboard.tsx）
- CLAUDE.md（開発ガイドライン）
```
