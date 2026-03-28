import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { cors } from "hono/cors";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.use("*", cors());

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// TODO: API ルートをここに追加

export const onRequest = handle(app);
