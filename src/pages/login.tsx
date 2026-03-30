import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/4" />
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/8 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-primary/6 blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/3 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <img
            src="/logo.svg"
            alt="Navios"
            className="mx-auto mb-4 size-16 rounded-2xl shadow-lg shadow-primary/25"
          />
          <h1 className="text-2xl font-bold tracking-tight">Navios Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理画面にログイン
          </p>
        </div>

        {/* カード */}
        <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                パスワード
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          NaviOs 地域情報共有アプリ 管理画面
        </p>
      </div>
    </div>
  );
}
