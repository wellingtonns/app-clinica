import { useMemo, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageTopbar } from "../components/PageTopbar";
import { Appointment, FinancialEntry, FinancialEntryType, FinancialStatus, Patient, Product, Professional } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

type Props = {
  patients: Patient[];
  appointments: Appointment[];
  professionals: Professional[];
  products: Product[];
  financialEntries: FinancialEntry[];
  updateFinancialStatus: (id: string, status: FinancialStatus) => void;
  updateFinancialEntry: (
    id: string,
    input: Pick<FinancialEntry, "status" | "paymentMethod" | "paymentDate" | "paidAmount" | "installments">
  ) => void;
};

const paymentStatuses: Array<FinancialStatus | "Todos"> = ["Todos", "Pendente", "Pago", "Parcial", "Cancelado"];
const entryTypes: Array<FinancialEntryType | "Todos"> = ["Todos", "Receita", "Despesa"];

function getMonthRange(referenceMonth: string) {
  const start = `${referenceMonth}-01`;
  const end = `${referenceMonth}-31`;
  return { start, end };
}

export function FinancePage({
  patients,
  appointments,
  professionals,
  products,
  financialEntries,
  updateFinancialStatus,
  updateFinancialEntry
}: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [fromDate, setFromDate] = useState(getMonthRange(currentMonth).start);
  const [toDate, setToDate] = useState(getMonthRange(currentMonth).end);
  const [typeFilter, setTypeFilter] = useState<FinancialEntryType | "Todos">("Todos");
  const [statusFilter, setStatusFilter] = useState<FinancialStatus | "Todos">("Todos");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("Todos");
  const [procedureFilter, setProcedureFilter] = useState("Todos");
  const [productFilter, setProductFilter] = useState("Todos");

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient.fullName])),
    [patients]
  );
  const appointmentById = useMemo(
    () => new Map(appointments.map((appointment) => [appointment.id, appointment])),
    [appointments]
  );
  const professionalNameById = useMemo(
    () => new Map(professionals.map((professional) => [professional.id, professional.name])),
    [professionals]
  );

  const paymentMethods = Array.from(
    new Set(financialEntries.map((entry) => entry.paymentMethod).filter(Boolean))
  ).sort();
  const procedures = Array.from(
    new Set(financialEntries.map((entry) => entry.procedure).filter(Boolean) as string[])
  ).sort();
  const productNames = Array.from(
    new Set(products.map((product) => product.name).concat(financialEntries.map((entry) => entry.productName ?? ""))).values()
  )
    .filter(Boolean)
    .sort();

  const filteredEntries = financialEntries
    .filter((entry) => entry.date >= fromDate && entry.date <= toDate)
    .filter((entry) => typeFilter === "Todos" || entry.type === typeFilter)
    .filter((entry) => statusFilter === "Todos" || entry.status === statusFilter)
    .filter((entry) => paymentMethodFilter === "Todos" || entry.paymentMethod === paymentMethodFilter)
    .filter((entry) => procedureFilter === "Todos" || entry.procedure === procedureFilter)
    .filter((entry) => productFilter === "Todos" || entry.productName === productFilter)
    .sort((left, right) => `${right.date}${right.id}`.localeCompare(`${left.date}${left.id}`));

  const revenueReceived = financialEntries
    .filter((entry) => entry.type === "Receita" && (entry.status === "Pago" || entry.status === "Parcial"))
    .reduce((total, entry) => total + entry.paidAmount, 0);

  const revenueToReceive = financialEntries
    .filter((entry) => entry.type === "Receita" && entry.status !== "Pago" && entry.status !== "Cancelado")
    .reduce((total, entry) => total + entry.balanceAmount, 0);

  const productExpenses = financialEntries
    .filter((entry) => entry.type === "Despesa")
    .reduce((total, entry) => total + entry.amount, 0);

  const estimatedProfit = revenueReceived - productExpenses;
  const receivedByPaymentMethod = ["Pix", "Cartão de débito", "Cartão de crédito", "Dinheiro"].map((method) => ({
    method,
    amount: financialEntries
      .filter((entry) => entry.type === "Receita" && entry.paymentMethod === method && (entry.status === "Pago" || entry.status === "Parcial"))
      .reduce((total, entry) => total + entry.paidAmount, 0)
  }));

  const productCostRanking = products
    .map((product) => ({
      id: product.id,
      name: product.name,
      amount: product.stock * product.unitCost
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);

  return (
    <>
      <PageTopbar title="Financeiro" subtitle="Controle de receitas e despesas." />

      <section className="section">
        <div className="metric-grid">
          <article className="metric-card tone-success">
            <span>Receita recebida</span>
            <strong>{formatCurrency(revenueReceived)}</strong>
            <small>Pagamentos com status pago</small>
          </article>
          <article className="metric-card tone-warning">
            <span>Receita a receber</span>
            <strong>{formatCurrency(revenueToReceive)}</strong>
            <small>Pendentes e parciais</small>
          </article>
          <article className="metric-card tone-danger">
            <span>Gastos com produtos</span>
            <strong>{formatCurrency(productExpenses)}</strong>
            <small>Custo total em estoque</small>
          </article>
          <article className="metric-card tone-primary">
            <span>Lucro estimado</span>
            <strong>{formatCurrency(estimatedProfit)}</strong>
            <small>Receita recebida menos produtos</small>
          </article>
        </div>
      </section>

      <section className="section extra-card-grid">
        {receivedByPaymentMethod.map((item) => (
          <article className="panel extra-card soft-primary" key={item.method}>
            <span>{item.method}</span>
            <strong>{formatCurrency(item.amount)}</strong>
            <p>Recebido por forma de pagamento</p>
          </article>
        ))}
      </section>

      <section className="section">
        <CrudPanel title="Lançamentos financeiros" subtitle="Receitas da agenda e despesas do estoque">
          <div className="toolbar">
            <label className="toolbar-field">
              <span>De</span>
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label className="toolbar-field">
              <span>Até</span>
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <label className="toolbar-field">
              <span>Tipo</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as FinancialEntryType | "Todos")}>
                {entryTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FinancialStatus | "Todos")}>
                {paymentStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              <span>Forma</span>
              <select value={paymentMethodFilter} onChange={(event) => setPaymentMethodFilter(event.target.value)}>
                <option value="Todos">Todos</option>
                {paymentMethods.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              <span>Procedimento</span>
              <select value={procedureFilter} onChange={(event) => setProcedureFilter(event.target.value)}>
                <option value="Todos">Todos</option>
                {procedures.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              <span>Produto</span>
              <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
                <option value="Todos">Todos</option>
                {productNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Procedimento/Produto</th>
                  <th>Forma</th>
                  <th>Parcelas</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const appointment = entry.appointmentId ? appointmentById.get(entry.appointmentId) : undefined;
                  const paidAmount = entry.status === "Pago" ? entry.amount : entry.paidAmount;

                  return (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.date)}</td>
                      <td>{entry.type}</td>
                      <td>{entry.description}</td>
                      <td>{entry.patientId ? patientNameById.get(entry.patientId) ?? entry.patientId : "-"}</td>
                      <td>{appointment ? professionalNameById.get(appointment.professionalId) ?? appointment.professionalId : "-"}</td>
                      <td>{entry.procedure ?? entry.productName ?? "-"}</td>
                      <td>
                        {entry.type === "Receita" ? (
                          <input
                            value={entry.paymentMethod}
                            onChange={(event) =>
                              updateFinancialEntry(entry.id, {
                                status: entry.status,
                                paymentMethod: event.target.value,
                                paymentDate: entry.paymentDate,
                                paidAmount,
                                installments: event.target.value === "Cartão de crédito" ? entry.installments ?? 1 : undefined
                              })
                            }
                          />
                        ) : (
                          entry.paymentMethod || "-"
                        )}
                      </td>
                      <td>{entry.installments ? `${entry.installments}x` : "-"}</td>
                      <td>
                        {entry.type === "Receita" ? (
                          <select
                            value={entry.status}
                            onChange={(event) => {
                              const nextStatus = event.target.value as FinancialStatus;
                              if (appointment) updateFinancialStatus(entry.id, nextStatus);
                              updateFinancialEntry(entry.id, {
                                status: nextStatus,
                                paymentMethod: entry.paymentMethod,
                                paymentDate: nextStatus === "Pago" ? entry.paymentDate || new Date().toISOString().slice(0, 10) : entry.paymentDate,
                                paidAmount: nextStatus === "Pago" ? entry.amount : entry.paidAmount,
                                installments: entry.installments
                              });
                            }}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Pago">Pago</option>
                            <option value="Parcial">Parcial</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        ) : (
                          entry.status
                        )}
                      </td>
                      <td>
                        <strong>{formatCurrency(entry.amount)}</strong>
                        {entry.status === "Parcial" ? (
                          <div className="table-subtitle">
                            Pago {formatCurrency(entry.paidAmount)} | Saldo {formatCurrency(entry.balanceAmount)}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">Nenhum lançamento encontrado para os filtros selecionados.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CrudPanel>
      </section>

      <section className="section">
        <CrudPanel title="Produtos com maior custo" subtitle="Itens que mais concentram valor de estoque">
          <div className="stack">
            {productCostRanking.map((item) => (
              <div className="list-card" key={item.id}>
                <strong>{item.name}</strong>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {productCostRanking.length === 0 ? <div className="empty-state">Nenhum produto cadastrado.</div> : null}
          </div>
        </CrudPanel>
      </section>
    </>
  );
}
