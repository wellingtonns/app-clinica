import { FormEvent, useState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type Props = {
  mode: "login" | "register";
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  const validate = () => {
    if (!isLogin && !name.trim()) return "Informe seu nome completo.";
    if (!email.trim()) return "Informe seu e-mail.";
    if (!isValidEmail(email.trim())) return "Informe um e-mail válido.";
    if (!password) return "Informe sua senha.";
    if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (!isLogin && password !== confirmPassword) return "As senhas não conferem.";
    return null;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = isLogin
        ? await login(email.trim(), password)
        : await register(name.trim(), email.trim(), password);

      if (!result.ok) {
        setFeedback({ type: "error", message: result.message ?? "Não foi possível concluir a operação." });
        return;
      }

      if (!isLogin) setFeedback({ type: "success", message: result.message ?? "Cadastro realizado com sucesso." });
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label={isLogin ? "Login" : "Cadastro"}>
        <aside className="auth-brand-panel">
          <img src="/stetic-soft-logo.png" alt="SteticSoft" className="auth-logo" />
          <div className="auth-brand-copy">
            <h1>Gestão inteligente para sua clínica</h1>
            <p>Organize agendamentos, pacientes, procedimentos, profissionais e muito mais em um só lugar.</p>
          </div>
          <div className="auth-illustration" aria-hidden="true">
            <div className="mini-window">
              <div className="mini-sidebar">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="mini-content">
                <div className="mini-topline" />
                <div className="mini-metrics">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mini-chart">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>{isLogin ? "Entrar no SteticSoft" : "Criar conta"}</h2>
            <p>
              {isLogin
                ? "Acesse sua conta para gerenciar sua clínica."
                : "Cadastre-se para começar a usar o SteticSoft."}
            </p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {!isLogin ? (
              <label>
                <span>Nome completo</span>
                <div className="auth-input-shell">
                  <UserRound aria-hidden="true" size={20} />
                  <input
                    autoComplete="name"
                    disabled={isSubmitting}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
              </label>
            ) : null}

            <label>
              <span>E-mail</span>
              <div className="auth-input-shell">
                <Mail aria-hidden="true" size={20} />
                <input
                  autoComplete="email"
                  disabled={isSubmitting}
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </label>

            <label>
              <span>Senha</span>
              <div className="auth-input-shell">
                <Lock aria-hidden="true" size={20} />
                <input
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  disabled={isSubmitting}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                />
              </div>
            </label>

            {!isLogin ? (
              <label>
                <span>Confirmar senha</span>
                <div className="auth-input-shell">
                  <Lock aria-hidden="true" size={20} />
                  <input
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirme sua senha"
                  />
                </div>
              </label>
            ) : null}

            {feedback ? <div className={`auth-feedback auth-feedback-${feedback.type}`}>{feedback.message}</div> : null}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isLogin ? "Entrando..." : "Criando conta...") : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Ainda não tem conta? " : "Já tem uma conta? "}
            <Link to={isLogin ? "/cadastro" : "/login"}>{isLogin ? "Criar cadastro" : "Entrar"}</Link>
          </p>
        </div>
      </section>
      <footer className="auth-footer">© 2026 SteticSoft. Todos os direitos reservados.</footer>
    </main>
  );
}
