import { BarChart3, CalendarDays, Package, Stethoscope, Users, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function navClassName({ isActive }: { isActive: boolean }) {
  return `nav-link ${isActive ? "nav-link-active" : ""}`.trim();
}

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/agenda", label: "Agendamentos", icon: CalendarDays },
  { to: "/pacientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/profissionais", label: "Profissionais", icon: Stethoscope }
];

export function Layout({ children }: Props) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/stetic-soft-logo.png" alt="Stetic Soft - Gestao para clinicas" />
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
      </aside>

      <div className="content">{children}</div>
    </main>
  );
}
