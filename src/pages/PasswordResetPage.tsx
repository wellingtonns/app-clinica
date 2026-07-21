import { FormEvent, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

async function responseMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function PasswordResetPage({ mode }: { mode: "request" | "reset" }) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReset = mode === "reset";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedback({ type: "error", message: "Informe um e-mail valido." });
      return;
    }
    if (isReset && (password.length < 8 || password !== confirmPassword)) {
      setFeedback({
        type: "error",
        message: password.length < 8 ? "A senha deve ter pelo menos 8 caracteres." : "As senhas nao conferem."
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch(isReset ? "/api/auth/reset-password" : "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isReset ? { token: searchParams.get("token"), password } : { email: email.trim() })
      });
      setFeedback({
        type: response.ok ? "success" : "error",
        message: await responseMessage(response, "Nao foi possivel concluir a solicitacao.")
      });
    } catch {
      setFeedback({ type: "error", message: "Nao foi possivel conectar ao servidor." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label={isReset ? "Redefinir senha" : "Recuperar senha"}>
        <aside className="auth-brand-panel">
          <img src="/stetic-soft-logo.png" alt="SteticSoft" className="auth-logo" />
          <div className="auth-brand-copy">
            <h1>Gestao inteligente para sua clinica</h1>
            <p>Recupere o acesso a sua conta com seguranca.</p>
          </div>
        </aside>
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>{isReset ? "Crie uma nova senha" : "Esqueceu sua senha?"}</h2>
            <p>{isReset ? "Informe uma nova senha para sua conta." : "Enviaremos um link de redefinicao para seu e-mail."}</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {!isReset ? (
              <label>
                <span>E-mail</span>
                <div className="auth-input-shell">
                  <Mail aria-hidden="true" size={20} />
                  <input autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </label>
            ) : (
              <>
                <label>
                  <span>Nova senha</span>
                  <div className="auth-input-shell">
                    <Lock aria-hidden="true" size={20} />
                    <input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </div>
                </label>
                <label>
                  <span>Confirmar nova senha</span>
                  <div className="auth-input-shell">
                    <Lock aria-hidden="true" size={20} />
                    <input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  </div>
                </label>
              </>
            )}
            {feedback ? <div className={`auth-feedback auth-feedback-${feedback.type}`}>{feedback.message}</div> : null}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : isReset ? "Redefinir senha" : "Enviar link"}
            </button>
          </form>
          <p className="auth-switch"><Link to="/login">Voltar para o login</Link></p>
        </div>
      </section>
      <footer className="auth-footer">© 2026 SteticSoft. Todos os direitos reservados.</footer>
    </main>
  );
}
