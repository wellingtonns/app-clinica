import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthResult = {
  ok: boolean;
  message?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isCheckingSession: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    if (response.status === 404 || response.status === 405) {
      return "A API de autenticação não está disponível neste ambiente. Use o Vercel local ou o deploy da Vercel para testar.";
    }

    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (isMounted) setUser(null);
          return;
        }

        const payload = (await response.json()) as { user: AuthUser };
        if (isMounted) setUser(payload.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isCheckingSession,
      login: async (email, password) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          return {
            ok: false,
            message: await readErrorMessage(response, "E-mail ou senha inválidos.")
          };
        }

        const payload = (await response.json()) as { user: AuthUser };
        setUser(payload.user);
        return { ok: true };
      },
      register: async (name, email, password) => {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
          return {
            ok: false,
            message: await readErrorMessage(response, "Não foi possível criar a conta.")
          };
        }

        const payload = (await response.json()) as { user: AuthUser };
        setUser(payload.user);
        return { ok: true, message: "Cadastro realizado com sucesso." };
      },
      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          cache: "no-store"
        });
        sessionStorage.removeItem("softstetic:clinic-data:v1");
        localStorage.removeItem("softstetic:clinic-data:persistent:v1");
        setUser(null);
      }
    }),
    [isCheckingSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
