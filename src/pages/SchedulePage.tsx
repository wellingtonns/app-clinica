import { FormEvent, useMemo, useState } from "react";
import { CalendarX } from "lucide-react";
import { CrudPanel } from "../components/CrudPanel";
import { PageTopbar } from "../components/PageTopbar";
import { Appointment, AppointmentStatus, FinancialStatus, Patient, Professional } from "../types";
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

const statusOptions: AppointmentStatus[] = ["Agendado", "Confirmado", "Desmarcado", "Realizado", "Cancelado"];
const paymentStatusOptions: FinancialStatus[] = ["Pendente", "Pago", "Parcial", "Cancelado"];
const paymentMethodOptions = ["Pix", "Cartao de debito", "Cartao de credito", "Dinheiro"];
const currentUserName = "Administradora";
const blockingStatuses: AppointmentStatus[] = ["Agendado", "Confirmado", "Realizado"];
const businessStartMinutes = 8 * 60;
const businessEndMinutes = 19 * 60;
const slotIntervalMinutes = 30;

const emptyForm: Omit<Appointment, "id"> = {
  patientId: "",
  professionalId: "",
  procedure: "",
  date: "",
  time: "",
  durationMinutes: 60,
  status: "Agendado",
  paymentStatus: "Pendente",
  paymentMethod: "",
  paymentDate: "",
  paidAmount: 0,
  installments: undefined,
  notes: "",
  price: 0
};

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function createHistoryEntry(
  appointment: Appointment,
  nextStatus: AppointmentStatus,
  nextDate = appointment.date,
  nextTime = appointment.time,
  reason?: string
) {
  return {
    id: `HIS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    changedBy: currentUserName,
    changedAt: new Date().toISOString(),
    previousStatus: appointment.status,
    nextStatus,
    previousDate: appointment.date,
    previousTime: appointment.time,
    nextDate,
    nextTime,
    reason: reason?.trim() || undefined
  };
}

function getStatusClass(status: AppointmentStatus) {
  return `appointment-status appointment-status-${status.toLowerCase()}`;
}

function getAppointmentRowClass(appointment: Appointment) {
  return appointment.isRescheduled ? "appointment-row appointment-row-remarcado" : `appointment-row appointment-row-${appointment.status.toLowerCase()}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function appointmentBlocksSchedule(appointment: Pick<Appointment, "status">) {
  return blockingStatuses.includes(appointment.status);
}

function intervalsOverlap(start: number, end: number, blockedStart: number, blockedEnd: number) {
  return start < blockedEnd && end > blockedStart;
}

function hasScheduleConflict(
  appointments: Appointment[],
  candidate: Omit<Appointment, "id">,
  editingId: string | null
) {
  if (!appointmentBlocksSchedule(candidate)) return false;

  const candidateStart = timeToMinutes(candidate.time);
  if (candidateStart === null) return false;

  const candidateEnd = candidateStart + candidate.durationMinutes;

  return appointments.some((appointment) => {
    if (appointment.id === editingId) return false;
    if (!appointmentBlocksSchedule(appointment)) return false;
    if (appointment.professionalId !== candidate.professionalId) return false;
    if (appointment.date !== candidate.date) return false;

    const appointmentStart = timeToMinutes(appointment.time);
    if (appointmentStart === null) return false;

    const appointmentEnd = appointmentStart + appointment.durationMinutes;
    return intervalsOverlap(candidateStart, candidateEnd, appointmentStart, appointmentEnd);
  });
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let minutes = businessStartMinutes; minutes <= businessEndMinutes; minutes += slotIntervalMinutes) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
}

function getBlockingAppointments(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  editingId: string | null
) {
  return appointments.filter(
    (appointment) =>
      appointment.id !== editingId &&
      appointment.professionalId === professionalId &&
      appointment.date === date &&
      appointmentBlocksSchedule(appointment)
  );
}

function getScheduleConflict(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  time: string,
  durationMinutes: number,
  editingId: string | null
) {
  const start = timeToMinutes(time);
  if (start === null) return undefined;

  const end = start + durationMinutes;

  return getBlockingAppointments(appointments, professionalId, date, editingId)
    .map((appointment) => {
      const appointmentStart = timeToMinutes(appointment.time);
      if (appointmentStart === null) return null;

      return {
        appointment,
        start: appointmentStart,
        end: appointmentStart + appointment.durationMinutes
      };
    })
    .filter((item): item is { appointment: Appointment; start: number; end: number } => Boolean(item))
    .sort((left, right) => left.start - right.start)
    .find((item) => intervalsOverlap(start, end, item.start, item.end));
}

function buildConflictMessage(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  time: string,
  durationMinutes: number,
  editingId: string | null
) {
  const start = timeToMinutes(time);
  const conflict = getScheduleConflict(appointments, professionalId, date, time, durationMinutes, editingId);
  if (start === null || !conflict) return "Este profissional ja possui um agendamento nesse horario.";

  if (conflict.start > start) {
    return `Nao foi possivel agendar. Este profissional so possui horario livre das ${time} as ${minutesToTime(
      conflict.start
    )}, pois ja existe outro paciente agendado a partir das ${minutesToTime(conflict.start)}.`;
  }

  return `Nao foi possivel agendar. Este profissional ja possui outro paciente entre ${minutesToTime(
    conflict.start
  )} e ${minutesToTime(conflict.end)}.`;
}

function isSlotAvailableForDuration(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  time: string,
  durationMinutes: number,
  editingId: string | null
) {
  if (!professionalId || !date || !time || durationMinutes < 15) return false;

  const start = timeToMinutes(time);
  if (start === null) return false;

  if (start < businessStartMinutes || start > businessEndMinutes) return false;

  return !getScheduleConflict(appointments, professionalId, date, time, durationMinutes, editingId);
}

function findConflictingAppointment(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  time: string,
  durationMinutes: number,
  editingId: string | null
) {
  return getScheduleConflict(appointments, professionalId, date, time, durationMinutes, editingId)?.appointment;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Diaria");
  const [referenceDate, setReferenceDate] = useState(getTodayIso());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
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
  const allTimeSlots = useMemo(() => buildTimeSlots(), []);

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

  const openCreateModal = () => {
    setFeedback(null);
    setEditingId(null);
    setForm({
      ...emptyForm,
      patientId: patients[0]?.id ?? "",
      professionalId: professionals[0]?.id ?? "",
      date: referenceDate
    });
    setIsModalOpen(true);
  };

  const openEditModal = (appointment: Appointment) => {
    setFeedback(null);
    setEditingId(appointment.id);
    setForm({
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      procedure: appointment.procedure,
      date: appointment.date,
      time: appointment.time,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus ?? "Pendente",
      paymentMethod: appointment.paymentMethod ?? "",
      paymentDate: appointment.paymentDate ?? "",
      paidAmount: appointment.paidAmount ?? 0,
      installments: appointment.installments,
      notes: appointment.notes,
      price: appointment.price,
      originalDate: appointment.originalDate,
      originalTime: appointment.originalTime,
      rescheduleReason: appointment.rescheduleReason,
      isRescheduled: appointment.isRescheduled,
      history: appointment.history ?? []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const validateForm = () => {
    if (!form.patientId) return "Selecione uma paciente.";
    if (!form.professionalId) return "Selecione uma profissional.";
    if (!form.procedure.trim()) return "Informe o procedimento.";
    if (!form.date) return "Informe a data do atendimento.";
    if (!form.time) return "Informe o horario do atendimento.";
    if (!form.durationMinutes || form.durationMinutes < 15) return "Informe uma duracao valida.";
    if (form.price < 0) return "Informe um valor valido.";
    if (form.paymentStatus === "Pago" && form.paidAmount !== form.price) {
      return "Para pagamento Pago, o valor pago deve ser igual ao valor do procedimento.";
    }
    if (form.paymentStatus === "Parcial" && (form.paidAmount === undefined || form.paidAmount <= 0 || form.paidAmount >= form.price)) {
      return "Para pagamento Parcial, o valor pago deve ser maior que zero e menor que o valor do procedimento.";
    }
    if (form.paymentStatus === "Pendente" && (form.paidAmount ?? 0) !== 0) {
      return "Para pagamento Pendente, o valor pago deve ser zero.";
    }
    if (form.paymentStatus === "Cancelado" && (form.paidAmount ?? 0) !== 0) {
      return "Para pagamento Cancelado, o valor pago deve ser zero.";
    }
    if (form.paymentMethod === "Cartao de credito" && !form.installments) {
      return "Informe a quantidade de parcelas para pagamento no cartao de credito.";
    }
    return null;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    if (
      appointmentBlocksSchedule(form) &&
      !isSlotAvailableForDuration(
        appointments,
        form.professionalId,
        form.date,
        form.time,
        form.durationMinutes,
        editingId
      )
    ) {
      setFeedback({
        type: "error",
        message: buildConflictMessage(
          appointments,
          form.professionalId,
          form.date,
          form.time,
          form.durationMinutes,
          editingId
        )
      });
      return;
    }

    try {
      const currentAppointment = editingId ? appointments.find((appointment) => appointment.id === editingId) : undefined;
      const scheduleChanged = Boolean(
        currentAppointment &&
          (form.date !== currentAppointment.date ||
            form.time !== currentAppointment.time ||
            form.professionalId !== currentAppointment.professionalId ||
            form.durationMinutes !== currentAppointment.durationMinutes)
      );
      const isRescheduled = Boolean(currentAppointment?.isRescheduled || scheduleChanged);

      const normalizedForm = {
        ...form,
        procedure: form.procedure.trim(),
        notes: form.notes.trim(),
        paymentStatus: form.paymentStatus ?? "Pendente",
        paymentMethod: form.paymentMethod === "Cartao de credito" ? form.paymentMethod : form.paymentMethod,
        paymentDate: form.paymentDate,
        paidAmount: form.paymentStatus === "Pago" ? form.price : form.paymentStatus === "Parcial" ? form.paidAmount ?? 0 : 0,
        installments: form.paymentMethod === "Cartao de credito" ? form.installments : undefined,
        originalDate: isRescheduled ? currentAppointment?.originalDate ?? currentAppointment?.date ?? form.originalDate : undefined,
        originalTime: isRescheduled ? currentAppointment?.originalTime ?? currentAppointment?.time ?? form.originalTime : undefined,
        rescheduleReason: isRescheduled ? form.rescheduleReason?.trim() : undefined,
        isRescheduled,
        history:
          currentAppointment && (scheduleChanged || currentAppointment.status !== form.status)
            ? [
                ...(currentAppointment.history ?? []),
                createHistoryEntry(
                  currentAppointment,
                  form.status,
                  form.date,
                  form.time,
                  isRescheduled ? form.rescheduleReason : undefined
                )
              ]
            : form.history ?? []
      };

      if (hasScheduleConflict(appointments, normalizedForm, editingId)) {
        setFeedback({
          type: "error",
          message: buildConflictMessage(
            appointments,
            normalizedForm.professionalId,
            normalizedForm.date,
            normalizedForm.time,
            normalizedForm.durationMinutes,
            editingId
          )
        });
        return;
      }

      if (editingId) updateAppointment(editingId, normalizedForm);
      else createAppointment(normalizedForm);

      setReferenceDate(normalizedForm.date);
      setFeedback({
        type: "success",
        message: editingId ? "Agendamento atualizado com sucesso." : "Agendamento salvo com sucesso."
      });
      setIsModalOpen(false);
      reset();
    } catch {
      setFeedback({ type: "error", message: "Nao foi possivel salvar o agendamento. Tente novamente." });
    }
  };

  return (
    <>
      <PageTopbar
        title="Agendamentos"
        subtitle="Controle da agenda da clinica"
        action={
          <button className="primary-button prominent-button" type="button" onClick={openCreateModal}>
            Novo agendamento
          </button>
        }
      />

      <section className="section">
        <CrudPanel title="Agenda operacional" subtitle="Visualizacao diaria ou semanal">
          <div className="schedule-panel-header">
            <div className="toolbar schedule-toolbar">
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
          </div>

          {feedback ? <div className={`feedback-message feedback-${feedback.type}`}>{feedback.message}</div> : null}

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
                  <tr className={getAppointmentRowClass(appointment)} key={appointment.id}>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.time}</td>
                    <td>{patientNameById.get(appointment.patientId) ?? appointment.patientId}</td>
                    <td>{professionalNameById.get(appointment.professionalId) ?? appointment.professionalId}</td>
                    <td>{appointment.procedure}</td>
                    <td>
                      <div className="status-badge-group">
                        {appointment.isRescheduled ? <span className="appointment-status appointment-status-remarcado">Remarcado</span> : null}
                        <span className={getStatusClass(appointment.status)}>{appointment.status}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(appointment.price)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="inline-button"
                          type="button"
                          onClick={() => openEditModal(appointment)}
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
                {visibleAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state empty-state-featured">
                        <CalendarX aria-hidden="true" size={30} strokeWidth={1.8} />
                        <p>Nenhum agendamento para hoje</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CrudPanel>
      </section>

      {isModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
          <div className="modal-shell schedule-modal-shell">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Agenda</p>
                <h3 id="schedule-modal-title">{editingId ? "Editar agendamento" : "Novo agendamento"}</h3>
              </div>
              <button className="ghost-button" type="button" onClick={closeModal}>
                Fechar
              </button>
            </div>

            {feedback?.type === "error" ? <div className="feedback-message feedback-error">{feedback.message}</div> : null}

            <form className="crud-form modal-content" onSubmit={submit}>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Paciente</span>
                  <select value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
                    <option value="">Selecione uma paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Profissional</span>
                  <select value={form.professionalId} onChange={(event) => setForm({ ...form, professionalId: event.target.value, time: "" })}>
                    <option value="">Selecione uma profissional</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Procedimento</span>
                  <input value={form.procedure} onChange={(event) => setForm({ ...form, procedure: event.target.value, time: "" })} />
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
                  <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value, time: "" })} />
                </label>
                <label>
                  <span>Duracao em minutos</span>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={form.durationMinutes}
                    onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value), time: "" })}
                  />
                </label>
                <label>
                  <span>Valor do procedimento</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => {
                      const nextPrice = Number(event.target.value);
                      setForm({
                        ...form,
                        price: nextPrice,
                        paidAmount: form.paymentStatus === "Pago" ? nextPrice : form.paidAmount
                      });
                    }}
                  />
                </label>
              </div>

              <section className="schedule-picker">
                <div className="schedule-picker-header">
                  <div>
                    <h4>Pagamento</h4>
                    <p>Dados usados automaticamente no modulo financeiro.</p>
                  </div>
                </div>
                <div className="form-grid form-grid-2">
                  <label>
                    <span>Status do pagamento</span>
                    <select
                      value={form.paymentStatus ?? "Pendente"}
                      onChange={(event) => {
                        const nextStatus = event.target.value as FinancialStatus;
                        setForm({
                          ...form,
                          paymentStatus: nextStatus,
                          paidAmount: nextStatus === "Pago" ? form.price : nextStatus === "Parcial" ? form.paidAmount : 0
                        });
                      }}
                    >
                      {paymentStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Forma de pagamento</span>
                    <select
                      value={form.paymentMethod ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          paymentMethod: event.target.value,
                          installments: event.target.value === "Cartao de credito" ? form.installments ?? 1 : undefined
                        })
                      }
                    >
                      <option value="">Selecione</option>
                      {paymentMethodOptions.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Valor pago</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.paidAmount ?? 0}
                      onChange={(event) => setForm({ ...form, paidAmount: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>Data do pagamento</span>
                    <input
                      type="date"
                      value={form.paymentDate ?? ""}
                      onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}
                    />
                  </label>
                  {form.paymentMethod === "Cartao de credito" ? (
                    <label>
                      <span>Quantidade de parcelas</span>
                      <select
                        value={form.installments ?? ""}
                        onChange={(event) => setForm({ ...form, installments: Number(event.target.value) })}
                      >
                        <option value="">Selecione</option>
                        {Array.from({ length: 12 }, (_, index) => index + 1).map((installment) => (
                          <option key={installment} value={installment}>
                            {installment}x
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              </section>

              <section className="schedule-picker">
                <div className="schedule-picker-header">
                  <div>
                    <h4>Horarios disponiveis</h4>
                    <p>
                      {form.professionalId && form.date && form.procedure.trim()
                        ? "Selecione um horario livre em intervalos de 30 minutos."
                        : "Selecione profissional, data e procedimento para carregar a grade."}
                    </p>
                  </div>
                  {form.time ? <span className="selected-slot">Selecionado: {form.time}</span> : null}
                </div>

                <div className="time-slot-grid">
                  {allTimeSlots.map((slot) => {
                    const hasRequiredScheduleFields = Boolean(
                      form.professionalId && form.date && form.procedure.trim() && form.durationMinutes >= 15
                    );
                    const canSelect =
                      hasRequiredScheduleFields &&
                      isSlotAvailableForDuration(
                        appointments,
                        form.professionalId,
                        form.date,
                        slot,
                        form.durationMinutes,
                        editingId
                      );

                    const conflictingAppointment = findConflictingAppointment(
                      appointments,
                      form.professionalId,
                      form.date,
                      slot,
                      form.durationMinutes,
                      editingId
                    );
                    const slotClassName = !hasRequiredScheduleFields
                      ? "time-slot-unavailable"
                      : canSelect
                        ? "time-slot-free"
                        : "time-slot-busy";

                    return (
                      <button
                        className={`time-slot-button ${slotClassName} ${
                          form.time === slot ? "time-slot-selected" : ""
                        }`}
                        disabled={!canSelect}
                        key={slot}
                        title={!canSelect && conflictingAppointment ? "Ocupado por outro atendimento" : undefined}
                        type="button"
                        onClick={() => setForm({ ...form, time: slot })}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </section>

              <label>
                <span>Observacoes</span>
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
              </label>
              {form.isRescheduled ? (
                <label>
                  <span>Motivo da remarcacao</span>
                  <textarea
                    value={form.rescheduleReason ?? ""}
                    onChange={(event) => setForm({ ...form, rescheduleReason: event.target.value })}
                    rows={3}
                  />
                </label>
              ) : null}
              <div className="form-actions modal-footer">
                <button className="ghost-button" type="button" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  {editingId ? "Salvar alteracoes" : "Marcar horario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
