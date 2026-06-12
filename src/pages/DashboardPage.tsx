import { useState } from "react";
import { CalendarDays, CalendarX, Sparkles, Users, Wallet } from "lucide-react";
import { Appointment, AppointmentStatus, FinancialEntry, Patient, Professional, AnamnesisRecord } from "../types";
import { AppointmentDetailsModal } from "../components/AppointmentDetailsModal";
import { formatCurrency, formatDate } from "../utils/format";

type Props = {
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  anamneses: AnamnesisRecord[];
  financialEntries: FinancialEntry[];
  updateAppointment: (id: string, input: Omit<Appointment, "id">) => void;
};

const statusLabels: AppointmentStatus[] = ["Agendado", "Confirmado", "Em atendimento", "Finalizado", "Concluído", "Desmarcado", "Realizado", "Cancelado"];

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
      "Em atendimento": 0,
      Finalizado: 0,
      "Concluído": 0,
      Desmarcado: 0,
      Realizado: 0,
      Cancelado: 0
    }
  );
}

function getStatusClass(status: AppointmentStatus) {
  const slug = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  return `appointment-status appointment-status-${slug}`;
}

export function DashboardPage({ patients, professionals, appointments, anamneses, updateAppointment }: Props) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
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
    (appointment) =>
      (appointment.status === "Realizado" || appointment.status === "Finalizado" || appointment.status === "Concluído") &&
      appointment.date.startsWith(currentMonth)
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
          ? `${todayStatusCounts.Confirmado} confirmados | ${todayStatusCounts.Agendado} aguardando confirmação | ${todayStatusCounts.Realizado} realizados`
          : "Não há agendamentos para hoje",
      icon: CalendarDays
    },
    {
      label: "Pacientes ativos",
      value: String(patients.length),
      detail: `${recentPatientIds.size} pacientes com movimentação recente`,
      icon: Users
    },
    {
      label: "Faturamento do mês",
      value: monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : formatCurrency(0),
      detail:
        completedThisMonth.length > 0
          ? `${completedThisMonth.length} procedimentos concluídos no mês`
          : "Sem faturamento no período",
      icon: Wallet
    },
    {
      label: "Procedimentos realizados",
      value: String(completedThisMonth.length),
      detail: completedThisMonth.length > 0 ? "No mês atual" : "Nenhum procedimento realizado",
      icon: Sparkles
    }
  ];
  const selectedAppointment = selectedAppointmentId
    ? appointments.find((appointment) => appointment.id === selectedAppointmentId)
    : undefined;

  return (
    <div className="beauty-dashboard">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">Painel</p>
          <h2>Olá, Administrador!</h2>
          <p>Bem-vinda ao seu painel de controle.</p>
        </div>

        <div className="user-cluster" aria-label="Perfil da administradora">
          <button className="icon-button" type="button" aria-label="Notificações">
            <span />
          </button>
          <div className="avatar">A</div>
          <strong>Administradora</strong>
          <span className="online-indicator" title="Sistema on-line" aria-label="Sistema on-line" />
        </div>
      </header>

      <section className="metric-grid beauty-metrics" aria-label="Indicadores principais">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;

          return (
            <article className="metric-card beauty-metric-card" key={indicator.label}>
              <div className="metric-icon">
                <Icon aria-hidden="true" size={20} strokeWidth={2} />
              </div>
              <span>{indicator.label}</span>
              <strong>{indicator.value}</strong>
              <small>{indicator.detail}</small>
            </article>
          );
        })}
      </section>

      <section className="section">
        <article className="panel beauty-panel">
          <div className="panel-header">
            <div>
              <h4>Agenda</h4>
              <p>Agendamentos de hoje e próximos atendimentos futuros, ordenados por data e horário.</p>
            </div>
          </div>
          {agendaAppointments.length > 0 ? (
            <div className="table-wrap">
              <table className="beauty-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Paciente</th>
                    <th>Procedimento</th>
                    <th>Profissional</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaAppointments.map((appointment) => (
                    <tr
                      className="clickable-appointment-row"
                      key={appointment.id}
                      tabIndex={0}
                      onClick={() => setSelectedAppointmentId(appointment.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedAppointmentId(appointment.id);
                        }
                      }}
                    >
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
            <div className="empty-state empty-state-featured">
              <CalendarX aria-hidden="true" size={30} strokeWidth={1.8} />
              <p>{todaysAppointments.length === 0 ? "Nenhum agendamento para hoje" : "Nenhum atendimento futuro"}</p>
            </div>
          )}
        </article>
      </section>

      {selectedAppointment ? (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          patients={patients}
          professionals={professionals}
          appointments={appointments}
          anamneses={anamneses}
          updateAppointment={updateAppointment}
          onClose={() => setSelectedAppointmentId(null)}
        />
      ) : null}
    </div>
  );
}
