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
          <img className="brand-icon" src="/softstetic-favicon.svg" alt="" aria-hidden="true" />
          <div className="brand-copy">
            <strong>
              <span>Soft</span>
              <span>Stetic</span>
            </strong>
            <small>Gestao para clinicas</small>
          </div>
        </div>

        <nav className="nav-card">
          <span>Menu principal</span>
          <NavLink to="/" end className={navClassName}>
            <span className="nav-icon">D</span>
            Dashboard
          </NavLink>
          <NavLink to="/agenda" className={navClassName}>
            <span className="nav-icon">A</span>
            Agendamentos
          </NavLink>
          <NavLink to="/pacientes" className={navClassName}>
            <span className="nav-icon">C</span>
            Clientes
          </NavLink>
          <NavLink to="/financeiro" className={navClassName}>
            <span className="nav-icon">F</span>
            Financeiro
          </NavLink>
          <NavLink to="/produtos" className={navClassName}>
            <span className="nav-icon">P</span>
            Produtos
          </NavLink>
          <NavLink to="/profissionais" className={navClassName}>
            <span className="nav-icon">E</span>
            Equipe
          </NavLink>
        </nav>
      </aside>

      <div className="content">{children}</div>
    </main>
  );
}
