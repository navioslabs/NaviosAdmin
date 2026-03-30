import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ACCESS_TOKEN: string;
  SUPABASE_PROJECT_REF: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.use("*", cors());

/** Service Role クライアント（特権操作用） */
function getServiceClient(c: { env: Bindings }) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Authorization ヘッダーからユーザーを検証 */
async function verifyAdmin(c: { env: Bindings; req: { header: (name: string) => string | undefined } }) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const supabase = getServiceClient(c);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  // admin_users テーブルでロール確認
  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!admin) return null;
  return { userId: user.id, role: admin.role as string };
}

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ユーザーBAN（Supabase Auth のユーザーを無効化）
app.post("/users/:id/ban", async (c) => {
  const admin = await verifyAdmin(c);
  if (!admin || admin.role !== "admin") {
    return c.json({ error: "権限がありません" }, 403);
  }

  const targetId = c.req.param("id");
  const supabase = getServiceClient(c);

  const { error } = await supabase.auth.admin.updateUserById(targetId, {
    ban_duration: "876600h", // 約100年
  });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true, message: "ユーザーをBANしました" });
});

// ユーザーBAN解除
app.post("/users/:id/unban", async (c) => {
  const admin = await verifyAdmin(c);
  if (!admin || admin.role !== "admin") {
    return c.json({ error: "権限がありません" }, 403);
  }

  const targetId = c.req.param("id");
  const supabase = getServiceClient(c);

  const { error } = await supabase.auth.admin.updateUserById(targetId, {
    ban_duration: "none",
  });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true, message: "BANを解除しました" });
});

// Supabase Usage 取得
app.get("/usage", async (c) => {
  const admin = await verifyAdmin(c);
  if (!admin) {
    return c.json({ error: "権限がありません" }, 403);
  }

  const token = c.env.SUPABASE_ACCESS_TOKEN;
  const ref = c.env.SUPABASE_PROJECT_REF;

  if (!token || !ref) {
    return c.json({ error: "Supabase access token or project ref not configured" }, 500);
  }

  try {
    // プロジェクト情報
    const [projectRes, usageRes] = await Promise.all([
      fetch(`https://api.supabase.com/v1/projects/${ref}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`https://api.supabase.com/v1/projects/${ref}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!projectRes.ok || !usageRes.ok) {
      const errText = await usageRes.text();
      return c.json({ error: `Supabase API error: ${errText}` }, usageRes.status as 500);
    }

    const project = await projectRes.json();
    const usage = await usageRes.json();

    return c.json({ project, usage });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

export const onRequest = handle(app);
