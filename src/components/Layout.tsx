import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function navClassName({ isActive }: { isActive: boolean }) {
  return `nav-link ${isActive ? "nav-link-active" : ""}`.trim();
}

export function Layout({ children }: Props) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CF</div>
          <div>
            <p className="eyebrow">ClinicFlow Pro</p>
            <h1>Plataforma de gestao clinica</h1>
          </div>
        </div>

        <nav className="nav-card">
          <span>Modulos</span>
          <NavLink to="/" end className={navClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/pacientes" className={navClassName}>
            Pacientes
          </NavLink>
          <NavLink to="/agenda" className={navClassName}>
            Agenda
          </NavLink>
          <NavLink to="/financeiro" className={navClassName}>
            Financeiro
          </NavLink>
          <NavLink to="/produtos" className={navClassName}>
            Produtos
          </NavLink>
          <NavLink to="/profissionais" className={navClassName}>
            Profissionais
          </NavLink>
        </nav>

        <div className="highlight-card">
          <span>Direcao do produto</span>
          <strong>O paciente agora concentra historico, contrato, procedimentos, fotos e arquivos em uma unica central.</strong>
          <p>A base visual foi mantida e o fluxo principal ficou organizado por paciente para consulta futura.</p>
        </div>
      </aside>

      <div className="content">{children}</div>
    </main>
  );
}
