import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/drip/TopBar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Drip" },
      { name: "description", content: "Choose a new password for your Drip account." },
      { property: "og:title", content: "Set a new password — Drip" },
      { property: "og:description", content: "Choose a new password for your Drip account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Couldn't update your password", { description: error.message });
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/auth" });
  };

  return (
    <main className="min-h-dvh pb-36">
      <TopBar title="Reset" />
      <section className="mt-4 px-5">
        <h1 className="font-display text-6xl italic leading-[0.9]">New password.</h1>
        {loading ? (
          <div className="mt-6 h-12 animate-pulse rounded-full bg-card" aria-busy="true" />
        ) : user ? (
          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-3">
            <input
              type="password"
              aria-label="New password"
              placeholder="New password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="glass h-12 w-full rounded-full px-5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button type="submit" disabled={busy} className="bg-signal h-12 w-full rounded-full font-label text-xs font-extrabold text-primary-foreground disabled:opacity-50">
              {busy ? "Saving…" : "Save password"}
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">This reset link has expired or was already used. Ask for a new one from the sign-in screen.</p>
            <Link to="/auth" className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 font-label text-[10px] font-bold text-primary-foreground">
              Back to sign in
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
