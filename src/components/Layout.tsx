import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function navClassName({ isActive }: { isActive: boolean }) {
  return `nav-link ${isActive ? "nav-link-active" : ""}`.trim();
}

export function Layout({ children }: Props) {
  const secondaryItems = ["Procedimentos", "Relatorios", "Marketing", "Configuracoes"];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BE</div>
          <div>
            <p className="eyebrow">Belleza Estetica</p>
            <h1>Gestao para clinicas premium</h1>
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
          {secondaryItems.map((item) => (
            <span className="nav-link nav-link-disabled" key={item}>
              <span className="nav-icon">{item.slice(0, 1)}</span>
              {item}
            </span>
          ))}
        </nav>

        <div className="highlight-card">
          <span>Experiencia Belleza</span>
          <strong>Organizacao, cuidado e encantamento em cada atendimento.</strong>
          <p>Painel preparado para acompanhar agenda, clientes, financeiro e relacionamento.</p>
        </div>
      </aside>

      <div className="content">{children}</div>
    </main>
  );
}
