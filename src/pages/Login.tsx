import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    const result = login(username, password);

    if (!result.success) {
      setError(result.error || "Login failed");
      setIsLoading(false);
      return;
    }

    // Login successful - will redirect automatically via App.tsx
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#050816_45%,_#111827_100%)] p-4 text-cyan-50">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
      <div className="pointer-events-none absolute -top-32 left-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <Card className="w-full max-w-md border border-cyan-400/40 bg-slate-950/85 shadow-[0_0_35px_rgba(34,211,238,0.25)] backdrop-blur-xl">
          <CardHeader className="space-y-3 border-b border-cyan-400/20 px-6 pb-4 pt-6">
            <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Secure Access
            </div>
            <CardTitle className="text-3xl font-black tracking-[0.2em] text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
              NEMOTRON-3 CHAT
            </CardTitle>
            <p className="text-sm text-slate-400">
              Enter your credentials to connect to the neural grid.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-cyan-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="demo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-cyan-400/30 bg-slate-900/80 text-cyan-50 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-cyan-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-cyan-400/30 bg-slate-900/80 text-cyan-50 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/50"
                />
              </div>

              {error && (
                <div className="rounded-md border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-500 font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] transition hover:brightness-110"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Credentials panel removed for security. Configure users via Vercel env variables. */}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
