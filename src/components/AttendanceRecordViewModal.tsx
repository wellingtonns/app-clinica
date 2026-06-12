import { MedicalRecord, Patient, Professional } from "../types";
import { formatDate, formatDateTime } from "../utils/format";

type Props = {
  record: MedicalRecord;
  relatedRecords?: MedicalRecord[];
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

export function AttendanceRecordViewModal({ record, relatedRecords = [], patient, professional, onClose }: Props) {
  const previousRecords = relatedRecords
    .filter((item) => item.patientId === record.patientId)
    .filter((item) => item.id !== record.id)
    .sort((left, right) =>
      `${right.date} ${right.startedAt || right.scheduledTime}`.localeCompare(
        `${left.date} ${left.startedAt || left.scheduledTime}`
      )
    );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="medical-record-view-title">
      <div className="modal-shell attendance-record-modal-shell">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Prontuario do atendimento</p>
            <h3 id="medical-record-view-title">{record.procedure || "Atendimento finalizado"}</h3>
            <p>
              {patient?.fullName ?? record.patientId} - {formatDate(record.date)}
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
              <DetailItem label="Paciente" value={patient?.fullName ?? record.patientId} />
              <DetailItem label="Telefone" value={patient?.phone || "Nao informado"} />
              <DetailItem label="CPF" value={patient?.cpf || "Nao informado"} />
              <DetailItem label="Profissional responsavel" value={professional?.name || "Nao informado"} />
            </div>
          </section>

          <section className="medical-record-section">
            <div className="medical-record-section-header">
              <h4>Atendimento</h4>
              <span className={getStatusClass(record.status)}>{record.status}</span>
            </div>
            <div className="medical-record-detail-grid">
              <DetailItem label="Data" value={formatDate(record.date)} />
              <DetailItem label="Horario agendado" value={record.scheduledTime || "-"} />
              <DetailItem label="Inicio real" value={formatDateTimeSafe(record.startedAt)} />
              <DetailItem label="Fim real" value={formatDateTimeSafe(record.finishedAt)} />
              <DetailItem label="Tempo total" value={formatDuration(record.durationMinutes)} />
              <DetailItem label="Agendamento relacionado" value={record.appointmentId || "Sem referencia"} />
            </div>
          </section>

          <section className="medical-record-section">
            <div className="medical-record-section-header">
              <h4>Prontuario</h4>
            </div>
            <div className="medical-record-text-grid">
              <TextBlock label="Procedimento realizado" value={record.procedure} />
              <TextBlock label="Observacoes do prontuario" value={record.clinicalNotes} />
              <TextBlock label="Recomendacoes" value={record.recommendations} />
              <TextBlock label="Produtos utilizados" value={record.productsUsed} />
              <TextBlock label="Proximo retorno" value={record.nextReturn} />
              <TextBlock label="Evolucao" value={record.evolution} />
            </div>
          </section>

          {previousRecords.length ? (
            <section className="medical-record-section">
              <div className="medical-record-section-header">
                <h4>Prontuarios anteriores do paciente</h4>
                <span className="status-pill status-confirmed">{previousRecords.length} registro(s)</span>
              </div>
              <div className="medical-record-previous-list">
                {previousRecords.map((previous) => (
                  <article className="medical-record-previous-card" key={previous.id}>
                    <div>
                      <strong>{previous.procedure}</strong>
                      <span>
                        {formatDate(previous.date)} - {previous.scheduledTime || "-"} - {formatDuration(previous.durationMinutes)}
                      </span>
                    </div>
                    <p>{previous.clinicalNotes || "Sem observacoes registradas."}</p>
                    {previous.recommendations ? <small>Recomendacoes: {previous.recommendations}</small> : null}
                    {previous.productsUsed ? <small>Produtos utilizados: {previous.productsUsed}</small> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status: MedicalRecord["status"]) {
  const slug = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  return `appointment-status appointment-status-${slug}`;
}
