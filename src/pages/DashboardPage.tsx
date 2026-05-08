import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CrudPanel } from "../components/CrudPanel";
import { PageHeader } from "../components/PageHeader";
import { Appointment, FinancialEntry, Patient, Professional } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

type Props = {
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
};

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function buildMonthlySeries(financialEntries: FinancialEntry[]) {
  const totals = financialEntries.reduce<Record<string, number>>((accumulator, entry) => {
    const month = entry.date.slice(0, 7);
    accumulator[month] = (accumulator[month] ?? 0) + entry.amount;
    return accumulator;
  }, {});

  return Object.entries(totals)
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, revenue]) => ({ month: month.slice(5, 7), revenue }));
}

export function DashboardPage({ patients, professionals, appointments, financialEntries }: Props) {
  const today = getTodayIso();
  const currentMonth = today.slice(0, 7);
  const todaysAppointments = appointments.filter((item) => item.date === today);
  const upcomingAppointments = appointments
    .filter((item) => item.status !== "Cancelado" && item.date >= today)
    .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`))
    .slice(0, 5);
  const monthlyRevenue = financialEntries
    .filter((item) => item.date.startsWith(currentMonth))
    .reduce((total, item) => total + item.amount, 0);
  const monthlySeries = buildMonthlySeries(financialEntries);

  const patientNameById = new Map(patients.map((item) => [item.id, item.fullName]));
  const professionalNameById = new Map(professionals.map((item) => [item.id, item.name]));

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Indicadores operacionais conectados aos modulos da plataforma."
        description="A visao executiva agora reflete pacientes, agenda e financeiro no mesmo padrao visual da aplicacao."
        badge="Plataforma integrada"
      />

      <section className="section">
        <div className="metric-grid">
          <article className="metric-card tone-primary">
            <span>Total de pacientes</span>
            <strong>{patients.length}</strong>
            <small>Base ativa da clinica</small>
          </article>
          <article className="metric-card tone-success">
            <span>Atendimentos do dia</span>
            <strong>{todaysAppointments.length}</strong>
            <small>{today}</small>
          </article>
          <article className="metric-card tone-warning">
            <span>Faturamento do mes</span>
            <strong>{formatCurrency(monthlyRevenue)}</strong>
            <small>Receita originada de procedimentos realizados</small>
          </article>
          <article className="metric-card tone-danger">
            <span>Proximos agendamentos</span>
            <strong>{upcomingAppointments.length}</strong>
            <small>Consultas futuras e de hoje</small>
          </article>
        </div>
      </section>

      <section className="section split-grid">
        <CrudPanel title="Agenda imediata" subtitle="Proximos agendamentos da operacao">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horario</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.time}</td>
                    <td>{patientNameById.get(appointment.patientId) ?? appointment.patientId}</td>
                    <td>{professionalNameById.get(appointment.professionalId) ?? appointment.professionalId}</td>
                    <td>{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CrudPanel>

        <CrudPanel title="Resumo do dia" subtitle="Leituras rapidas da plataforma">
          <div className="stack">
            <div className="list-card">
              <strong>Atendimentos realizados</strong>
              <span>{todaysAppointments.filter((item) => item.status === "Realizado").length} concluidos hoje.</span>
            </div>
            <div className="list-card">
              <strong>Profissionais ativos</strong>
              <span>{professionals.filter((item) => item.status === "Ativo").length} disponiveis na operacao.</span>
            </div>
            <div className="list-card">
              <strong>Receitas pendentes</strong>
              <span>
                {formatCurrency(
                  financialEntries
                    .filter((item) => item.status === "Pendente")
                    .reduce((total, item) => total + item.amount, 0)
                )}
              </span>
            </div>
          </div>
        </CrudPanel>
      </section>

      <section className="section">
        <CrudPanel title="Faturamento mensal" subtitle="Serie consolidada a partir dos atendimentos realizados">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.12)" />
                <XAxis dataKey="month" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="url(#dashboardRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CrudPanel>
      </section>
    </>
  );
}
