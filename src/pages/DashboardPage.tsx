import { Appointment, AppointmentStatus, FinancialEntry, Patient, Professional } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

type Props = {
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
};

const statusLabels: AppointmentStatus[] = ["Agendado", "Confirmado", "Desmarcado", "Realizado", "Cancelado"];

function toLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + amount);
  return nextDate;
}

function getAppointmentStamp(appointment: Appointment) {
  return `${appointment.date}T${appointment.time || "00:00"}`;
}

function sortAppointments(left: Appointment, right: Appointment) {
  return getAppointmentStamp(left).localeCompare(getAppointmentStamp(right));
}

function countByStatus(appointments: Appointment[]) {
  return statusLabels.reduce<Record<AppointmentStatus, number>>(
    (accumulator, status) => ({
      ...accumulator,
      [status]: appointments.filter((appointment) => appointment.status === status).length
    }),
    {
      Agendado: 0,
      Confirmado: 0,
      Desmarcado: 0,
      Realizado: 0,
      Cancelado: 0
    }
  );
}

function getStatusClass(status: AppointmentStatus) {
  return `appointment-status appointment-status-${status.toLowerCase()}`;
}

export function DashboardPage({ patients, professionals, appointments }: Props) {
  const now = new Date();
  const today = toLocalIsoDate(now);
  const currentMonth = today.slice(0, 7);
  const ninetyDaysAgo = toLocalIsoDate(addDays(now, -90));

  const patientNameById = new Map(patients.map((patient) => [patient.id, patient.fullName]));
  const professionalNameById = new Map(professionals.map((professional) => [professional.id, professional.name]));

  const todaysAppointments = appointments.filter((appointment) => appointment.date === today).sort(sortAppointments);
  const todayStatusCounts = countByStatus(todaysAppointments);

  const recentPatientIds = new Set(
    appointments
      .filter(
        (appointment) =>
          appointment.date >= ninetyDaysAgo &&
          appointment.date <= today &&
          appointment.status !== "Cancelado" &&
          appointment.status !== "Desmarcado"
      )
      .map((appointment) => appointment.patientId)
  );

  const completedThisMonth = appointments.filter(
    (appointment) => appointment.status === "Realizado" && appointment.date.startsWith(currentMonth)
  );
  const monthlyRevenue = completedThisMonth.reduce((total, appointment) => total + appointment.price, 0);

  const futureAppointments = appointments
    .filter((appointment) => getAppointmentStamp(appointment) >= `${today}T${now.toTimeString().slice(0, 5)}`)
    .filter((appointment) => appointment.status !== "Cancelado" && appointment.status !== "Desmarcado")
    .sort(sortAppointments);

  const agendaAppointments = [...todaysAppointments, ...futureAppointments.filter((appointment) => appointment.date !== today)]
    .sort(sortAppointments)
    .slice(0, 12);

  const indicators = [
    {
      label: "Agendamentos hoje",
      value: String(todaysAppointments.length),
      detail:
        todaysAppointments.length > 0
          ? `${todayStatusCounts.Confirmado} confirmados | ${todayStatusCounts.Agendado} aguardando confirmacao | ${todayStatusCounts.Realizado} realizados`
          : "Nao ha agendamentos para hoje",
      icon: "A"
    },
    {
      label: "Clientes ativos",
      value: String(patients.length),
      detail: `${recentPatientIds.size} pacientes com movimentacao recente`,
      icon: "C"
    },
    {
      label: "Faturamento do mes",
      value: monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : formatCurrency(0),
      detail:
        completedThisMonth.length > 0
          ? `${completedThisMonth.length} procedimentos concluidos no mes`
          : "Sem faturamento no periodo",
      icon: "F"
    },
    {
      label: "Procedimentos realizados",
      value: String(completedThisMonth.length),
      detail: completedThisMonth.length > 0 ? "No mes atual" : "Nenhum procedimento realizado",
      icon: "P"
    }
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

      <section className="section">
        <article className="panel beauty-panel">
          <div className="panel-header">
            <div>
              <h4>Agenda</h4>
              <p>Agendamentos de hoje e proximos atendimentos futuros, ordenados por data e horario.</p>
            </div>
          </div>
          {agendaAppointments.length > 0 ? (
            <div className="table-wrap">
              <table className="beauty-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horario</th>
                    <th>Cliente</th>
                    <th>Procedimento</th>
                    <th>Profissional</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.date === today ? "Hoje" : formatDate(appointment.date)}</td>
                      <td>{appointment.time}</td>
                      <td>{patientNameById.get(appointment.patientId) ?? appointment.patientId}</td>
                      <td>{appointment.procedure}</td>
                      <td>{professionalNameById.get(appointment.professionalId) ?? appointment.professionalId}</td>
                      <td>
                        <div className="status-badge-group">
                          {appointment.isRescheduled ? (
                            <span className="appointment-status appointment-status-remarcado">Remarcado</span>
                          ) : null}
                          <span className={getStatusClass(appointment.status)}>{appointment.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              {todaysAppointments.length === 0 ? "Nao ha agendamentos para hoje" : "Nenhum atendimento futuro"}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
