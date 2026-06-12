import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, PlayCircle, Save, X } from "lucide-react";
import { AnamnesisRecord, Appointment, Patient, Professional } from "../types";
import { formatDate, formatDateTime } from "../utils/format";

type TabKey = "atendimento" | "historico" | "anamnese" | "evolucao";

type Props = {
  appointment: Appointment;
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  anamneses: AnamnesisRecord[];
  updateAppointment: (id: string, input: Omit<Appointment, "id">) => void;
  onClose: () => void;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "atendimento", label: "Atendimento" },
  { key: "historico", label: "Histórico" },
  { key: "anamnese", label: "Anamnese" },
  { key: "evolucao", label: "Evolução" }
];

function appointmentInput(appointment: Appointment): Omit<Appointment, "id"> {
  const { id: _id, ...input } = appointment;
  return input;
}

function calculateDurationMinutes(startedAt?: string, finishedAt?: string) {
  if (!startedAt || !finishedAt) return undefined;
  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();
  if (Number.isNaN(started) || Number.isNaN(finished) || finished < started) return undefined;
  return Math.max(1, Math.round((finished - started) / 60000));
}

function formatDuration(minutes?: number) {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function formatDateTimeSafe(value?: string) {
  return value ? formatDateTime(value) : "-";
}

function getStatusClass(status: Appointment["status"]) {
  const slug = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  return `appointment-status appointment-status-${slug}`;
}

function FieldValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="appointment-detail-card">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export function AppointmentDetailsModal({
  appointment,
  patients,
  professionals,
  appointments,
  anamneses,
  updateAppointment,
  onClose
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("atendimento");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    attendanceProcedureDescription: appointment.attendanceProcedureDescription ?? "",
    attendanceProductsUsed: appointment.attendanceProductsUsed ?? "",
    attendanceClinicalNotes: appointment.attendanceClinicalNotes ?? "",
    attendancePostProcedureRecommendations: appointment.attendancePostProcedureRecommendations ?? "",
    attendanceNextReturn: appointment.attendanceNextReturn ?? "",
    attendanceEvolution: appointment.attendanceEvolution ?? ""
  });

  const patient = patients.find((item) => item.id === appointment.patientId);
  const professional = professionals.find((item) => item.id === appointment.professionalId);

  const professionalNameById = useMemo(
    () => new Map(professionals.map((item) => [item.id, item.name])),
    [professionals]
  );

  const patientHistory = appointments
    .filter((item) => item.patientId === appointment.patientId && item.id !== appointment.id)
    .filter(
      (item) =>
        item.status === "Realizado" ||
        item.status === "Finalizado" ||
        item.status === "Concluído" ||
        item.date <= appointment.date
    )
    .sort((left, right) => `${right.date}${right.time}`.localeCompare(`${left.date}${left.time}`))
    .slice(0, 8);

  const patientAnamneses = anamneses
    .filter((item) => item.patientId === appointment.patientId)
    .sort((left, right) => right.version - left.version);
  const latestAnamnesis = patientAnamneses[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setForm({
      attendanceProcedureDescription: appointment.attendanceProcedureDescription ?? "",
      attendanceProductsUsed: appointment.attendanceProductsUsed ?? "",
      attendanceClinicalNotes: appointment.attendanceClinicalNotes ?? "",
      attendancePostProcedureRecommendations: appointment.attendancePostProcedureRecommendations ?? "",
      attendanceNextReturn: appointment.attendanceNextReturn ?? "",
      attendanceEvolution: appointment.attendanceEvolution ?? ""
    });
  }, [appointment]);

  const persistAppointment = (nextAppointment: Appointment, message: string) => {
    updateAppointment(nextAppointment.id, appointmentInput(nextAppointment));
    setFeedback({ type: "success", message });
  };

  const startAttendance = () => {
    if (appointment.attendanceStartedAt) {
      setFeedback({ type: "error", message: "Este atendimento já foi iniciado." });
      return;
    }

    persistAppointment(
      {
        ...appointment,
        status: "Em atendimento",
        attendanceStartedAt: new Date().toISOString()
      },
      "Atendimento iniciado com sucesso."
    );
  };

  const finishAttendance = () => {
    const startedAt = appointment.attendanceStartedAt || new Date().toISOString();
    const finishedAt = new Date().toISOString();

    persistAppointment(
      {
        ...appointment,
        status: "Finalizado",
        attendanceStartedAt: startedAt,
        attendanceFinishedAt: finishedAt,
        attendanceDurationMinutes: calculateDurationMinutes(startedAt, finishedAt)
      },
      "Atendimento finalizado com sucesso."
    );
  };

  const saveEvolution = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.attendanceProcedureDescription.trim() && !form.attendanceEvolution.trim()) {
      setFeedback({
        type: "error",
        message: "Informe a descrição do procedimento ou a evolução do paciente antes de salvar."
      });
      return;
    }

    persistAppointment(
      {
        ...appointment,
        ...form
      },
      "Evolução salva com sucesso."
    );
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title" onMouseDown={onClose}>
      <div className="modal-shell appointment-details-modal-shell" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Controle do atendimento</p>
            <h3 id="appointment-details-title">{patient?.fullName ?? "Paciente não encontrado"}</h3>
            <p>{appointment.procedure || "Procedimento não informado"}</p>
          </div>
          <button className="ghost-button icon-text-button" type="button" onClick={onClose}>
            <X aria-hidden="true" size={18} />
            Fechar
          </button>
        </div>

        <div className="modal-tabs appointment-details-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? "tab-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {feedback ? <div className={feedback.type === "error" ? "form-error" : "form-success"}>{feedback.message}</div> : null}

        <div className="modal-content appointment-details-content">
          {activeTab === "atendimento" ? (
            <div className="appointment-details-section">
              <div className="appointment-detail-grid">
                <FieldValue label="Paciente" value={patient?.fullName ?? appointment.patientId} />
                <FieldValue label="Data" value={formatDate(appointment.date)} />
                <FieldValue label="Horário agendado" value={appointment.time} />
                <FieldValue label="Procedimento" value={appointment.procedure} />
                <FieldValue label="Profissional" value={professional?.name ?? appointment.professionalId} />
                <div className="appointment-detail-card">
                  <span>Status atual</span>
                  <strong>
                    <span className={getStatusClass(appointment.status)}>{appointment.status}</span>
                  </strong>
                </div>
              </div>

              <div className="appointment-control-grid">
                <FieldValue label="Início real" value={formatDateTimeSafe(appointment.attendanceStartedAt)} />
                <FieldValue label="Finalização real" value={formatDateTimeSafe(appointment.attendanceFinishedAt)} />
                <FieldValue label="Duração total" value={formatDuration(appointment.attendanceDurationMinutes)} />
                <FieldValue
                  label="Atraso estimado"
                  value={
                    appointment.attendanceStartedAt
                      ? formatDuration(
                          calculateDurationMinutes(`${appointment.date}T${appointment.time || "00:00"}:00`, appointment.attendanceStartedAt)
                        )
                      : "-"
                  }
                />
              </div>

              {appointment.notes ? (
                <div className="appointment-notes-box">
                  <strong>Observações do agendamento</strong>
                  <p>{appointment.notes}</p>
                </div>
              ) : null}

              <div className="appointment-actions">
                <button className="primary-button icon-text-button" type="button" onClick={startAttendance}>
                  <PlayCircle aria-hidden="true" size={18} />
                  Iniciar atendimento
                </button>
                <button className="ghost-button icon-text-button" type="button" onClick={finishAttendance}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  Finalizar atendimento
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "historico" ? (
            <div className="appointment-details-section">
              {patientHistory.length > 0 ? (
                <div className="appointment-history-list">
                  {patientHistory.map((item) => (
                    <article className="appointment-history-card" key={item.id}>
                      <div>
                        <strong>{item.procedure}</strong>
                        <span>
                          {formatDate(item.date)} às {item.time} com {professionalNameById.get(item.professionalId) ?? "profissional não informado"}
                        </span>
                      </div>
                      <span className={getStatusClass(item.status)}>{item.status}</span>
                      <p>{item.notes || item.attendanceClinicalNotes || "Sem observações registradas."}</p>
                      <small>{item.attendanceEvolution || item.attendanceProcedureDescription || "Evolução ainda não registrada."}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Nenhum histórico encontrado para este paciente.</div>
              )}
            </div>
          ) : null}

          {activeTab === "anamnese" ? (
            <div className="appointment-details-section">
              {latestAnamnesis ? (
                <div className="appointment-detail-grid">
                  <FieldValue label="Queixa principal" value={latestAnamnesis.mainComplaint} />
                  <FieldValue label="Alergias" value={latestAnamnesis.allergies || patient?.allergySummary} />
                  <FieldValue label="Medicamentos em uso" value={latestAnamnesis.medications} />
                  <FieldValue label="Doenças pré-existentes" value={latestAnamnesis.priorDiseases} />
                  <FieldValue label="Procedimentos anteriores" value={latestAnamnesis.surgeries || latestAnamnesis.treatments} />
                  <FieldValue label="Cuidados especiais" value={patient?.restrictionSummary} />
                  <FieldValue label="Histórico de saúde" value={latestAnamnesis.healthHistory} />
                  <FieldValue label="Observações gerais" value={latestAnamnesis.professionalObservations || patient?.generalObservations} />
                </div>
              ) : (
                <div className="empty-state">Nenhuma anamnese encontrada para este paciente.</div>
              )}
            </div>
          ) : null}

          {activeTab === "evolucao" ? (
            <form className="crud-form appointment-evolution-form" onSubmit={saveEvolution}>
              <label>
                Descrição do procedimento realizado
                <textarea
                  value={form.attendanceProcedureDescription}
                  onChange={(event) => setForm({ ...form, attendanceProcedureDescription: event.target.value })}
                  placeholder="Descreva o procedimento realizado"
                />
              </label>
              <label>
                Produtos utilizados
                <textarea
                  value={form.attendanceProductsUsed}
                  onChange={(event) => setForm({ ...form, attendanceProductsUsed: event.target.value })}
                  placeholder="Informe produtos, quantidades ou ativos utilizados"
                />
              </label>
              <label>
                Observações clínicas
                <textarea
                  value={form.attendanceClinicalNotes}
                  onChange={(event) => setForm({ ...form, attendanceClinicalNotes: event.target.value })}
                  placeholder="Registre observações clínicas relevantes"
                />
              </label>
              <label>
                Recomendações pós-procedimento
                <textarea
                  value={form.attendancePostProcedureRecommendations}
                  onChange={(event) => setForm({ ...form, attendancePostProcedureRecommendations: event.target.value })}
                  placeholder="Informe cuidados e recomendações"
                />
              </label>
              <label>
                Próximo retorno sugerido
                <input
                  value={form.attendanceNextReturn}
                  onChange={(event) => setForm({ ...form, attendanceNextReturn: event.target.value })}
                  placeholder="Ex.: retornar em 30 dias"
                />
              </label>
              <label>
                Evolução do paciente
                <textarea
                  value={form.attendanceEvolution}
                  onChange={(event) => setForm({ ...form, attendanceEvolution: event.target.value })}
                  placeholder="Campo livre para evolução do paciente"
                />
              </label>
              <div className="modal-footer">
                <button className="primary-button icon-text-button" type="submit">
                  <Save aria-hidden="true" size={18} />
                  Salvar evolução
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
