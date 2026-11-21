import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { user: User | null; session: Session | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, session: null, loading: true });

/** Single app-wide auth listener: keeps session state and refreshes the signed-in user's data. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
      if (event === "SIGNED_OUT") queryClient.removeQueries({ queryKey: ["me"] });
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void queryClient.invalidateQueries({ queryKey: ["me"] });
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export async function signOut() {
  await supabase.auth.signOut();
}
