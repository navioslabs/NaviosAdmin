<!-- このファイルは、リポジトリ全体で Claude Code が従う共通の開発ガイドラインを定義します。 -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

- **Name**: NaviosAdmin — Navios モバイルアプリ管理画面
- **Stack**: Hono + React 19 + TypeScript 5 + Vite 6
- **UI**: Tailwind CSS 4 + shadcn/ui + Lucide React
- **Backend**: Supabase (Auth, Postgres)
- **API**: Hono (Cloudflare Pages Functions)
- **デプロイ**: Cloudflare Pages (無料枠)
- **対応言語**: 日本語のみ
- **Path alias**: `@/*` → `./src/*`（`tsconfig.json` の `paths` で設定）

## Commands

- `npm run dev` — Vite 開発サーバー起動
- `npm run build` — プロダクションビルド
- `npm run preview` — Cloudflare Pages ローカルプレビュー（wrangler）
- `npm run deploy` — Cloudflare Pages へデプロイ
- `npm run lint` — ESLint 実行

## ディレクトリ構成

| ディレクトリ       | 責務                          | ルール                                              |
| ------------------ | ----------------------------- | --------------------------------------------------- |
| `src/pages/`       | 画面コンポーネント            | ルーティングは `App.tsx` で React Router v7 を使用   |
| `src/components/`  | 再利用可能 UI コンポーネント  | `ui/`（shadcn/ui）, 機能別コンポーネント            |
| `src/hooks/`       | カスタム hooks                | `useAuth`, `useIsMobile` 等                         |
| `src/lib/`         | サービス層 + ユーティリティ   | Supabase クライアント、認証、`utils.ts`             |
| `functions/`       | Hono API ルート               | Cloudflare Pages Functions。`/api/*` にマッピング   |

## 命名規則

| 対象                     | 規則                                   | 例                                     |
| ------------------------ | -------------------------------------- | -------------------------------------- |
| コンポーネントファイル   | `kebab-case.tsx`                       | `login.tsx`, `dashboard.tsx`           |
| コンポーネント           | `export function PascalCase()`         | named export                           |
| hooks                    | `use` プレフィックス                   | `useAuth`, `useIsMobile`               |
| 定数                     | `UPPER_SNAKE_CASE`                     | `API_BASE_URL`                         |
| 型                       | `PascalCase`                           | `User`, `AuthContextType`              |

## コーディングルール

- **1ファイル500行以内を目標**
- **コメントは「なぜ」だけ書く**
- **不要な import / 変数は即削除**
- **`"use client"` ディレクティブ**: SPA なので不要だが、shadcn/ui コンポーネントに残っていても害はないので放置可

## データ取得方針

- **Supabase 呼び出しは `lib/` に関数として切り出し、画面から直接書かない**
- **認証状態は `AuthProvider`（`lib/auth.tsx`）で管理**
- **API 呼び出しは Hono ルート（`functions/`）経由で行う**

## 環境変数の管理

- **`.env` ファイルで管理**（`.env` は `.gitignore` に含めること）
- **フロント側**: `VITE_` プレフィックス付き → `import.meta.env.VITE_*` でアクセス
- **Workers 側**: `wrangler.jsonc` の env または Cloudflare ダッシュボードで設定
- **必須変数**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **シークレット（Service Role Key 等）はフロントに絶対に含めない** — Workers 側のみで使用
- 新しい環境変数を追加した際は `.env.example` にキー名だけ追記する

## エラーハンドリング方針

- **ユーザー向けエラー**と**開発者向けエラー**を区別する（ユーザーには日本語メッセージを表示）
- **Supabase 呼び出しは必ず `error` をチェック**し、握り潰さない
- **Hono API ではエラーを適切な HTTP ステータスコードで返す**

## 依存パッケージ追加ルール

- **Cloudflare Workers 互換を確認** — Node.js API に依存するパッケージは使用不可
- **追加前に確認**: バンドルサイズ、メンテナンス状況（最終更新・Star数）
- **類似ライブラリの重複導入禁止** — 既存の依存を確認してから追加する

## ドキュメントルール

- **`MEMORY.md`**: 200行以内厳守（200行以降は切り捨てられる）
- **`CLAUDE.md`（本ファイル）**: 簡潔に保つ
