import { Link } from "react-router-dom";
import { Appointment, FinancialEntry, Patient, Professional } from "../types";

type Props = {
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
};

const indicators = [
  { label: "Agendamentos hoje", value: "12", detail: "4 confirmados para a tarde", icon: "A" },
  { label: "Clientes ativas", value: "235", detail: "Base em acompanhamento", icon: "C" },
  { label: "Faturamento do mes", value: "R$ 28.450,00", detail: "Meta mensal em 78%", icon: "F" },
  { label: "Procedimentos realizados", value: "87", detail: "No ciclo atual", icon: "P" },
];

const todaysSchedule = [
  { time: "09:00", client: "Juliana Silva", procedure: "Limpeza de pele", status: "Confirmado" },
  { time: "10:30", client: "Camila Santos", procedure: "Hidratacao facial", status: "Confirmado" },
  { time: "13:30", client: "Larissa Oliveira", procedure: "Massagem modeladora", status: "Pendente" },
  { time: "15:00", client: "Beatriz Lima", procedure: "Depilacao a laser", status: "Confirmado" },
  { time: "16:30", client: "Amanda Costa", procedure: "Peeling quimico", status: "Pendente" },
];

const upcomingAppointments = [
  {
    date: "12/06",
    client: "Mariana Rocha",
    procedure: "Botox preventivo",
    time: "09:30",
    status: "Confirmado",
  },
  {
    date: "13/06",
    client: "Renata Alves",
    procedure: "Drenagem linfatica",
    time: "11:00",
    status: "Pendente",
  },
  {
    date: "14/06",
    client: "Fernanda Martins",
    procedure: "Design de sobrancelhas",
    time: "14:00",
    status: "Confirmado",
  },
  {
    date: "15/06",
    client: "Patricia Gomes",
    procedure: "Radiofrequencia",
    time: "16:00",
    status: "Confirmado",
  },
];

const extraCards = [
  { label: "Clientes em atraso", value: "8", detail: "Precisam de contato", tone: "soft-danger" },
  { label: "Aniversariantes do mes", value: "19", detail: "Campanha pronta para envio", tone: "soft-primary" },
  { label: "Avaliacoes recebidas", value: "4,9", detail: "Media dos ultimos 30 dias", tone: "soft-success" },
  { label: "Recebimentos hoje", value: "R$ 3.280,00", detail: "Entradas confirmadas", tone: "soft-warning" },
];

function getStatusClass(status: string) {
  return status === "Confirmado" ? "status-pill status-confirmed" : "status-pill status-pending";
}

export function DashboardPage({ patients, professionals, appointments, financialEntries }: Props) {
  const platformSnapshot = [
    `${patients.length} clientes cadastradas`,
    `${professionals.length} profissionais na equipe`,
    `${appointments.length} registros de agenda`,
    `${financialEntries.length} lancamentos financeiros`,
  ];

  return (
    <div className="beauty-dashboard">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Ola, Administrador!</h2>
          <p>Bem-vinda ao seu painel de controle.</p>
        </div>

        <div className="user-cluster" aria-label="Perfil da administradora">
          <button className="icon-button" type="button" aria-label="Notificacoes">
            <span />
          </button>
          <div className="avatar">A</div>
          <strong>Administradora</strong>
        </div>
      </header>

      <section className="beauty-hero">
        <div className="beauty-hero-copy">
          <p className="eyebrow">Belleza Estetica</p>
          <h1>Gestao completa para sua clinica de estetica</h1>
          <p>Organize, encante e fidelize suas clientes.</p>
          <Link className="primary-button hero-action" to="/agenda">
            Ver agendamentos de hoje
          </Link>
        </div>
        <div className="hero-stats">
          {platformSnapshot.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="metric-grid beauty-metrics" aria-label="Indicadores principais">
        {indicators.map((indicator) => (
          <article className="metric-card beauty-metric-card" key={indicator.label}>
            <div className="metric-icon">{indicator.icon}</div>
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
            <small>{indicator.detail}</small>
          </article>
        ))}
      </section>

      <section className="section dashboard-main-grid">
        <article className="panel beauty-panel">
          <div className="panel-header">
            <div>
              <h4>Agenda de hoje</h4>
              <p>Horarios, clientes, procedimentos e status do dia.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="beauty-table">
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Cliente</th>
                  <th>Procedimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysSchedule.map((appointment) => (
                  <tr key={`${appointment.time}-${appointment.client}`}>
                    <td>{appointment.time}</td>
                    <td>{appointment.client}</td>
                    <td>{appointment.procedure}</td>
                    <td>
                      <span className={getStatusClass(appointment.status)}>{appointment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel beauty-panel">
          <div className="panel-header">
            <div>
              <h4>Proximos agendamentos</h4>
              <p>Compromissos ja mapeados para os proximos dias.</p>
            </div>
          </div>
          <div className="appointment-list">
            {upcomingAppointments.map((appointment) => (
              <div className="appointment-card" key={`${appointment.date}-${appointment.client}`}>
                <div className="date-badge">
                  <strong>{appointment.date}</strong>
                  <span>{appointment.time}</span>
                </div>
                <div>
                  <strong>{appointment.client}</strong>
                  <span>{appointment.procedure}</span>
                </div>
                <span className={getStatusClass(appointment.status)}>{appointment.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="section extra-card-grid">
        {extraCards.map((card) => (
          <article className={`panel extra-card ${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
