import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LogOut } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { GoogleButton } from "@/components/drip/GoogleButton";
import { TopBar } from "@/components/drip/TopBar";
import { signOut, useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-drip-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Your account — Drip" },
      { name: "description", content: "Sign in to Drip to keep your wishlist and swipes on every device." },
      { property: "og:title", content: "Your account — Drip" },
      { property: "og:description", content: "Sign in with email or Google to save your style." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const field = "glass h-12 w-full rounded-full px-5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";
const cta = "bg-signal h-12 w-full rounded-full font-label text-xs font-extrabold text-primary-foreground transition active:scale-[0.98] disabled:opacity-50";

function SignInForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Couldn't sign you in", { description: error.message });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name.trim(), display_name: name.trim() } },
      });
      if (error) toast.error("Couldn't create your account", { description: error.message });
      else if (!data.session) toast.success("Check your email", { description: "Open the link we sent to finish signing up." });
    }
    setBusy(false);
  };

  const forgot = async () => {
    if (!email) {
      toast("Type your email first, then tap Forgot password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error("Couldn't send the reset email", { description: error.message });
    else toast.success("Reset link sent", { description: `Check ${email}.` });
  };

  return (
    <section className="px-5">
      <h1 className="font-display text-6xl italic leading-[0.9]">{mode === "in" ? "Welcome back." : "Join Drip."}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Keep your wishlist and swipes on every device.</p>

      <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-full bg-secondary p-1.5">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn("h-10 rounded-full font-label text-[10px] font-bold transition", mode === m ? "bg-foreground text-background" : "text-foreground/70")}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3">
        {mode === "up" && (
          <input className={field} placeholder="Your name" aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" />
        )}
        <input className={field} type="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input
          className={field}
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
        />
        <button type="submit" disabled={busy} className={cta}>
          {busy ? "One sec…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      {mode === "in" && (
        <button type="button" onClick={() => void forgot()} className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline">
          Forgot password?
        </button>
      )}

      <div className="my-5 flex items-center gap-3 font-label text-[9px] font-bold text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
    </section>
  );
}

function Profile() {
  const { user } = useAuth();
  const profile = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const saved = profile.data?.display_name ?? "";
  useEffect(() => setName(saved), [saved]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save your name", { description: error.message });
      return;
    }
    toast.success("Name updated");
    void qc.invalidateQueries({ queryKey: ["me", user.id, "profile"] });
  };

  const avatar = profile.data?.avatar_url;
  return (
    <section className="px-5">
      <div className="flex items-center gap-4">
        <div className="glass grid size-20 shrink-0 place-items-center overflow-hidden rounded-full">
          {avatar ? (
            <img src={avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="font-display text-4xl italic text-primary">{(saved || user?.email || "D").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-5xl italic leading-none">{saved || "Hey you."}</h1>
          <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={(e) => void save(e)} className="mt-8 space-y-3">
        <label htmlFor="display-name" className="font-label text-[10px] font-bold text-muted-foreground">
          Display name
        </label>
        <input id="display-name" className={field} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Your name" />
        <button type="submit" disabled={busy || !name.trim() || name.trim() === saved} className={cta}>
          {busy ? "Saving…" : "Save name"}
        </button>
      </form>

      <Link to="/wishlist" className="glass mt-6 flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold">
        <Heart className="size-4 text-primary" /> Your wishlist
      </Link>
      <button
        type="button"
        onClick={() => void signOut().then(() => toast("Signed out"))}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-bold text-foreground/80"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </section>
  );
}

function AuthPage() {
  const { user, loading } = useAuth();
  return (
    <main className="min-h-dvh pb-36">
      <TopBar back title="Account" />
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3 px-5" aria-busy="true">
            <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-card" />
            <div className="h-12 animate-pulse rounded-full bg-card" />
            <div className="h-12 animate-pulse rounded-full bg-card" />
          </div>
        ) : user ? (
          <Profile />
        ) : (
          <SignInForm />
        )}
      </div>
    </main>
  );
}
