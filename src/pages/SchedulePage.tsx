import { FormEvent, useMemo, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageHeader } from "../components/PageHeader";
import { Appointment, AppointmentStatus, Patient, Professional } from "../types";
import { formatCurrency, formatDate, getWeekRange } from "../utils/format";

type Props = {
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  createAppointment: (input: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, input: Omit<Appointment, "id">) => void;
  deleteAppointment: (id: string) => void;
};

type ViewMode = "Diaria" | "Semanal";

const statusOptions: AppointmentStatus[] = ["Agendado", "Realizado", "Cancelado"];

const emptyForm: Omit<Appointment, "id"> = {
  patientId: "",
  professionalId: "",
  procedure: "",
  date: "",
  time: "",
  durationMinutes: 60,
  status: "Agendado",
  notes: "",
  price: 0
};

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function SchedulePage({
  patients,
  professionals,
  appointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("Diaria");
  const [referenceDate, setReferenceDate] = useState(getTodayIso());
  const [form, setForm] = useState<Omit<Appointment, "id">>({
    ...emptyForm,
    patientId: patients[0]?.id ?? "",
    professionalId: professionals[0]?.id ?? "",
    date: getTodayIso()
  });

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient.fullName])),
    [patients]
  );
  const professionalNameById = useMemo(
    () => new Map(professionals.map((professional) => [professional.id, professional.name])),
    [professionals]
  );

  const visibleAppointments = useMemo(() => {
    const sorted = [...appointments].sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`));
    if (viewMode === "Diaria") return sorted.filter((item) => item.date === referenceDate);

    const range = getWeekRange(referenceDate);
    return sorted.filter((item) => item.date >= range.start && item.date <= range.end);
  }, [appointments, referenceDate, viewMode]);

  const reset = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      patientId: patients[0]?.id ?? "",
      professionalId: professionals[0]?.id ?? "",
      date: referenceDate
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.patientId || !form.professionalId || !form.procedure.trim()) return;
    if (editingId) updateAppointment(editingId, form);
    else createAppointment(form);
    reset();
  };

  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Marcacao de horarios integrada ao financeiro."
        description="Atendimentos realizados geram receita automaticamente no modulo financeiro, mantendo o fluxo da operacao centralizado."
        badge={`${appointments.length} agendamentos`}
      />

      <section className="section page-grid">
        <CrudPanel title={editingId ? "Editar atendimento" : "Novo atendimento"} subtitle="Agenda diaria e semanal">
          <form className="crud-form" onSubmit={submit}>
            <div className="form-grid form-grid-2">
              <label>
                <span>Paciente</span>
                <select value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Profissional</span>
                <select value={form.professionalId} onChange={(event) => setForm({ ...form, professionalId: event.target.value })}>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Procedimento</span>
                <input value={form.procedure} onChange={(event) => setForm({ ...form, procedure: event.target.value })} />
              </label>
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AppointmentStatus })}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Data</span>
                <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </label>
              <label>
                <span>Horario</span>
                <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
              </label>
              <label>
                <span>Duracao (min)</span>
                <input type="number" min="15" step="15" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} />
              </label>
              <label>
                <span>Valor do procedimento</span>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
              </label>
            </div>
            <label>
              <span>Observacoes</span>
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? "Salvar alteracoes" : "Marcar horario"}
              </button>
              <button className="ghost-button" type="button" onClick={reset}>
                Limpar
              </button>
            </div>
          </form>
        </CrudPanel>

        <CrudPanel title="Agenda operacional" subtitle="Visualizacao diaria ou semanal">
          <div className="toolbar">
            <div className="segmented-control">
              <button
                className={`inline-button ${viewMode === "Diaria" ? "segmented-active" : ""}`}
                type="button"
                onClick={() => setViewMode("Diaria")}
              >
                Diaria
              </button>
              <button
                className={`inline-button ${viewMode === "Semanal" ? "segmented-active" : ""}`}
                type="button"
                onClick={() => setViewMode("Semanal")}
              >
                Semanal
              </button>
            </div>
            <label className="toolbar-field">
              <span>Data de referencia</span>
              <input type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horario</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Procedimento</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {visibleAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.time}</td>
                    <td>{patientNameById.get(appointment.patientId) ?? appointment.patientId}</td>
                    <td>{professionalNameById.get(appointment.professionalId) ?? appointment.professionalId}</td>
                    <td>{appointment.procedure}</td>
                    <td>{appointment.status}</td>
                    <td>{formatCurrency(appointment.price)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="inline-button"
                          type="button"
                          onClick={() => {
                            setEditingId(appointment.id);
                            setForm(appointment);
                          }}
                        >
                          Editar
                        </button>
                        <button className="inline-button danger" type="button" onClick={() => deleteAppointment(appointment.id)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CrudPanel>
      </section>
    </>
  );
}
