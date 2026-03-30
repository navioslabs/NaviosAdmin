import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
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
      {/* 背景 */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <div className="absolute -top-60 -right-60 size-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />
      <div className="absolute -bottom-60 -left-60 size-[500px] rounded-full bg-primary/6 blur-[100px] animate-pulse [animation-delay:3s]" />
      <div className="absolute top-1/4 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/4 blur-[80px]" />

      <div className="relative w-full max-w-sm">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-5 w-fit">
            <img
              src="/logo.svg"
              alt="Navios"
              className="size-18 rounded-2xl glow-primary-lg"
            />
            <div className="absolute inset-0 rounded-2xl pulse-ring" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">
            Navios Admin
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            管理コンソールにアクセス
          </p>
        </div>

        {/* カード */}
        <div className="glass-strong rounded-2xl p-6 glow-primary-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/20 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
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
                className="h-11 glass-light border-border/50 focus:glow-primary-sm transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
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
                  className="h-11 pr-10 glass-light border-border/50 focus:glow-primary-sm transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
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
              className="w-full h-11 font-semibold glow-primary transition-all hover:glow-primary-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  認証中...
                </>
              ) : (
                <>
                  ログイン
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          Navios Admin Console v1.0
        </p>
      </div>
    </div>
  );
}
