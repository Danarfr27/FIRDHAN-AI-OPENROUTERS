import { useState } from "react";
import { getAuthUsers, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const credentialUsers = getAuthUsers().map((user, index) => ({
  label: user.username,
  value: user.name || `User ${index + 1}`,
  username: user.username,
  password: user.password,
}));

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

    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06070b] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,130,64,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(0,212,255,0.12),_transparent_24%),linear-gradient(135deg,_#04070d_0%,_#090d14_40%,_#0d1018_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute left-10 top-10 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#ff7a18]/20 bg-[#0b1018]/80 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl md:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative border-b border-[#ff7a18]/20 bg-[#0d1117]/90 p-6 md:border-b-0 md:border-r">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#ffb37a]">Access portal</div>
                <div className="mt-2 text-2xl font-black tracking-[0.26em] text-[#f7f1eb]">FIRDHAN</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                <span className="text-[9px] uppercase tracking-[0.25em] text-emerald-300">online</span>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Status</div>
              <div className="rounded-md border border-[#ff7a18]/20 bg-[#111825]/90 px-3 py-2 text-sm text-[#f6d5b8]">
                Secure shell ready • Node matrix connected
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Authorized users</div>
              <div className="space-y-2">
                {credentialUsers.map((user, index) => (
                  <button
                    key={user.label}
                    type="button"
                    onClick={() => {
                      setUsername(user.username);
                      setPassword(user.password);
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-[#ff7a18]/15 bg-[#0d121b]/80 px-3 py-2.5 text-left transition hover:border-[#ff7a18]/35 hover:bg-[#111827]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded border border-[#ff7a18]/30 bg-[#ff7a18]/10 text-[9px] font-bold text-[#ffcf9f]">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6d5b8]">{user.label}</div>
                        <div className="text-[9px] text-slate-400">{user.value}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">›</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="border-b border-[#ff7a18]/15 px-6 pb-4 pt-6 md:px-8">
              <div className="inline-flex w-fit items-center rounded-full border border-[#ff7a18]/30 bg-[#ff7a18]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#ffbd82]">
                Secure Access
              </div>
              <CardTitle className="mt-4 text-2xl font-black tracking-[0.18em] text-[#f7f1eb] md:text-3xl">
                SIGN IN
              </CardTitle>
              <p className="mt-2 text-sm text-slate-400">
                Authenticate to continue into the AI operations console.
              </p>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-5 md:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ffcf9f]">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="type your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="h-12 border border-[#ff7a18]/25 bg-[#0f1725]/90 text-[#f5f7ff] placeholder:text-slate-500 focus:border-[#ff7a18]/50 focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ffcf9f]">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 border border-[#ff7a18]/25 bg-[#0f1725]/90 text-[#f5f7ff] placeholder:text-slate-500 focus:border-[#ff7a18]/50 focus:ring-0"
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-md border border-[#ff7a18]/30 bg-[linear-gradient(135deg,_rgba(255,122,24,0.95),_rgba(255,186,66,0.95),_rgba(0,212,255,0.75))] font-semibold uppercase tracking-[0.22em] text-[#0f172a] shadow-[0_0_22px_rgba(255,122,24,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Enter System"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
