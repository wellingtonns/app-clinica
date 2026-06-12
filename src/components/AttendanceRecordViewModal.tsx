import { Appointment, Patient, Professional } from "../types";
import { formatDate, formatDateTime } from "../utils/format";

type Props = {
  appointment: Appointment;
  patient?: Patient;
  professional?: Professional;
  onClose: () => void;
};

function formatDuration(minutes?: number) {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function formatDateTimeSafe(value?: string) {
  if (!value) return "-";
  return formatDateTime(value);
}

function DetailItem({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="medical-record-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="medical-record-text-block">
      <span>{label}</span>
      <p>{value?.trim() || "-"}</p>
    </div>
  );
}

export function AttendanceRecordViewModal({ appointment, patient, professional, onClose }: Props) {
  const procedure = appointment.attendanceProcedureDescription || appointment.procedure;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="medical-record-view-title">
      <div className="modal-shell attendance-record-modal-shell">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Prontuário do atendimento</p>
            <h3 id="medical-record-view-title">{procedure || "Atendimento finalizado"}</h3>
            <p>
              {patient?.fullName ?? appointment.patientId} · {formatDate(appointment.date)}
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="medical-record-view modal-content">
          <section className="medical-record-section">
            <div className="medical-record-section-header">
              <h4>Dados do paciente</h4>
            </div>
            <div className="medical-record-detail-grid">
              <DetailItem label="Paciente" value={patient?.fullName ?? appointment.patientId} />
              <DetailItem label="Telefone" value={patient?.phone || "Não informado"} />
              <DetailItem label="CPF" value={patient?.cpf || "Não informado"} />
              <DetailItem label="Profissional responsável" value={professional?.name || "Não informado"} />
            </div>
          </section>

          <section className="medical-record-section">
            <div className="medical-record-section-header">
              <h4>Atendimento</h4>
              <span className={getStatusClass(appointment.status)}>{appointment.status}</span>
            </div>
            <div className="medical-record-detail-grid">
              <DetailItem label="Data" value={formatDate(appointment.date)} />
              <DetailItem label="Horário agendado" value={appointment.time || "-"} />
              <DetailItem label="Início real" value={formatDateTimeSafe(appointment.attendanceStartedAt)} />
              <DetailItem label="Fim real" value={formatDateTimeSafe(appointment.attendanceFinishedAt)} />
              <DetailItem label="Tempo total" value={formatDuration(appointment.attendanceDurationMinutes)} />
              <DetailItem label="Agendamento relacionado" value={appointment.id} />
            </div>
          </section>

          <section className="medical-record-section">
            <div className="medical-record-section-header">
              <h4>Prontuário</h4>
            </div>
            <div className="medical-record-text-grid">
              <TextBlock label="Procedimento realizado" value={procedure} />
              <TextBlock label="Observações do prontuário" value={appointment.attendanceClinicalNotes || appointment.notes} />
              <TextBlock label="Recomendações" value={appointment.attendancePostProcedureRecommendations} />
              <TextBlock label="Produtos utilizados" value={appointment.attendanceProductsUsed} />
              <TextBlock label="Próximo retorno" value={appointment.attendanceNextReturn} />
              <TextBlock label="Evolução" value={appointment.attendanceEvolution} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status: Appointment["status"]) {
  const slug = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  return `appointment-status appointment-status-${slug}`;
}
