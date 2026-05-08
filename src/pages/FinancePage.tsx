import { useMemo, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageHeader } from "../components/PageHeader";
import { FinancialEntry, FinancialStatus, Patient } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

type Props = {
  patients: Patient[];
  financialEntries: FinancialEntry[];
  updateFinancialStatus: (id: string, status: FinancialStatus) => void;
};

function getMonthRange(referenceMonth: string) {
  const start = `${referenceMonth}-01`;
  const end = `${referenceMonth}-31`;
  return { start, end };
}

export function FinancePage({ patients, financialEntries, updateFinancialStatus }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [fromDate, setFromDate] = useState(getMonthRange(currentMonth).start);
  const [toDate, setToDate] = useState(getMonthRange(currentMonth).end);

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient.fullName])),
    [patients]
  );

  const filteredEntries = financialEntries
    .filter((item) => item.date >= fromDate && item.date <= toDate)
    .sort((left, right) => right.date.localeCompare(left.date));

  const monthlyRevenue = financialEntries
    .filter((item) => item.date.startsWith(currentMonth))
    .reduce((total, item) => total + item.amount, 0);
  const totalRevenue = financialEntries.reduce((total, item) => total + item.amount, 0);
  const pendingRevenue = financialEntries
    .filter((item) => item.status === "Pendente")
    .reduce((total, item) => total + item.amount, 0);

  const monthlyReport = Object.entries(
    financialEntries.reduce<Record<string, number>>((accumulator, item) => {
      const month = item.date.slice(0, 7);
      accumulator[month] = (accumulator[month] ?? 0) + item.amount;
      return accumulator;
    }, {})
  )
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([month, amount]) => ({ month, amount }));

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Receita automatica a partir dos procedimentos realizados."
        description="O modulo financeiro nasce da agenda: ao marcar um atendimento como realizado, a receita passa a ser controlada aqui."
        badge={`${financialEntries.length} lancamentos`}
      />

      <section className="section">
        <div className="metric-grid">
          <article className="metric-card tone-success">
            <span>Receita do mes</span>
            <strong>{formatCurrency(monthlyRevenue)}</strong>
            <small>Baseada em atendimentos realizados</small>
          </article>
          <article className="metric-card tone-primary">
            <span>Receita total</span>
            <strong>{formatCurrency(totalRevenue)}</strong>
            <small>Historico consolidado</small>
          </article>
          <article className="metric-card tone-warning">
            <span>Valores pendentes</span>
            <strong>{formatCurrency(pendingRevenue)}</strong>
            <small>Requer acompanhamento</small>
          </article>
          <article className="metric-card tone-danger">
            <span>Registros filtrados</span>
            <strong>{filteredEntries.length}</strong>
            <small>No periodo selecionado</small>
          </article>
        </div>
      </section>

      <section className="section page-grid">
        <CrudPanel title="Controle financeiro" subtitle="Filtro por periodo e status de pagamento">
          <div className="toolbar">
            <label className="toolbar-field">
              <span>De</span>
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label className="toolbar-field">
              <span>Ate</span>
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Paciente</th>
                  <th>Procedimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{patientNameById.get(entry.patientId) ?? entry.patientId}</td>
                    <td>{entry.procedure}</td>
                    <td>{formatCurrency(entry.amount)}</td>
                    <td>
                      <select
                        value={entry.status}
                        onChange={(event) => updateFinancialStatus(entry.id, event.target.value as FinancialStatus)}
                      >
                        <option value="Pago">Pago</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </td>
                    <td>{entry.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CrudPanel>

        <CrudPanel title="Relatorio mensal" subtitle="Fechamento consolidado">
          <div className="stack">
            {monthlyReport.map((item) => (
              <div key={item.month} className="list-card">
                <strong>{item.month}</strong>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </CrudPanel>
      </section>
    </>
  );
}
