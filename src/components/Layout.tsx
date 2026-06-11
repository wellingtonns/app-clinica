import { BarChart3, CalendarDays, LogOut, Package, Stethoscope, Users, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onLogout: () => void;
};

function navClassName({ isActive }: { isActive: boolean }) {
  return `nav-link ${isActive ? "nav-link-active" : ""}`.trim();
}

const navItems = [
  { to: "/", label: "Painel", icon: BarChart3, end: true },
  { to: "/agenda", label: "Agendamentos", icon: CalendarDays },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/profissionais", label: "Profissionais", icon: Stethoscope }
];

export function Layout({ children, onLogout }: Props) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/stetic-soft-logo.png" alt="Stetic Soft - Gestão para clínicas" />
        </div>

        <nav className="nav-card">
          <span>Menu principal</span>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink to={item.to} end={item.end} className={navClassName} key={item.to}>
                <span className="nav-icon">
                  <Icon aria-hidden="true" size={20} strokeWidth={2} />
                </span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button className="nav-link nav-logout-button" type="button" onClick={onLogout}>
          <span className="nav-icon">
            <LogOut aria-hidden="true" size={20} strokeWidth={2} />
          </span>
          Sair
        </button>
      </aside>

      <div className="content">{children}</div>
    </main>
  );
}
