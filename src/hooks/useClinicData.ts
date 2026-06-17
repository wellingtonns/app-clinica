import { useEffect, useState } from "react";
import {
  AnamnesisRecord,
  Appointment,
  AppointmentStatus,
  BodyArea,
  ContractRecord,
  FinancialEntry,
  FinancialStatus,
  MedicalRecord,
  Patient,
  PatientFileRecord,
  PersistedClinicData,
  PhotoCategory,
  ProcedureRecord,
  Product,
  Professional,
  RoleName
} from "../types";

type PatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;
type ProductInput = Omit<Product, "id">;
type ProfessionalInput = Omit<Professional, "id">;
type AnamnesisInput = Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">;
type ContractInput = Omit<ContractRecord, "id" | "version" | "uploadedAt">;
type ProcedureInput = Omit<ProcedureRecord, "id">;
type PatientFileInput = Omit<PatientFileRecord, "id">;
type AppointmentInput = Omit<Appointment, "id">;
type MedicalRecordInput = Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">;

const emptyClinicData: PersistedClinicData = {
  patients: [],
  products: [],
  professionals: [],
  anamneses: [],
  contracts: [],
  procedures: [],
  patientFiles: [],
  appointments: [],
  medicalRecords: [],
  financialEntries: []
};

let clinicDataFetchPromise: Promise<PersistedClinicData> | null = null;
let clinicDataVersion = 0;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function toIsoStamp() {
  return new Date().toISOString();
}

function normalizeRoleName(value: unknown): RoleName {
  return value === "Recepcao" || value === "Recepção" ? "Recepção" : value === "Administrador" ? "Administrador" : "Profissional";
}

function normalizeProfessionalStatus(value: unknown): Professional["status"] {
  if (value === "Ferias" || value === "Férias") return "Férias";
  return value === "Inativo" ? "Inativo" : "Ativo";
}

function normalizePhotoCategory(value: unknown): PhotoCategory {
  if (value === "Depois" || value === "Durante") return value;
  if (value === "Evolucao" || value === "Evolução") return "Evolução";
  return "Antes";
}

function normalizeBodyArea(value: unknown): BodyArea {
  if (value === "Rosto" || value === "Costas" || value === "Barriga" || value === "Pernas" || value === "Geral") return value;
  if (value === "Gluteos" || value === "Glúteos") return "Glúteos";
  if (value === "Bracos" || value === "Braços") return "Braços";
  return "Geral";
}

function normalizePaymentMethod(value: unknown) {
  if (value === "Cartao" || value === "Cartao de credito" || value === "Cartão de crédito") return "Cartão de crédito";
  if (value === "Cartao de debito" || value === "Cartão de débito") return "Cartão de débito";
  return typeof value === "string" ? value : "";
}

function normalizeProfessional(raw: Professional): Professional {
  return {
    ...raw,
    role: normalizeRoleName(raw.role),
    status: normalizeProfessionalStatus(raw.status)
  };
}

function normalizePatient(raw: Partial<Patient> & { name?: string }): Patient {
  const fallbackStamp = toIsoStamp();

  return {
    id: raw.id ?? createId("PAT"),
    fullName: raw.fullName ?? raw.name ?? "",
    birthDate: raw.birthDate ?? "",
    cpf: raw.cpf ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    address: raw.address ?? "",
    generalObservations: raw.generalObservations ?? "",
    allergySummary: raw.allergySummary ?? "",
    restrictionSummary: raw.restrictionSummary ?? "",
    status: raw.status === "Inativo" ? "Inativo" : "Ativo",
    createdAt: raw.createdAt ?? raw.updatedAt ?? fallbackStamp,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? fallbackStamp
  };
}

function normalizeProcedure(raw: ProcedureRecord): ProcedureRecord {
  return {
    ...raw,
    professionalId: raw.professionalId ?? "",
    photos: Array.isArray(raw.photos)
      ? raw.photos.map((photo) => ({
          ...photo,
          category: normalizePhotoCategory(photo.category),
          area: normalizeBodyArea(photo.area)
        }))
      : []
  };
}

function normalizeProduct(raw: Partial<Product>): Product {
  return {
    id: raw.id ?? createId("PRD"),
    name: raw.name ?? "",
    category: raw.category ?? "",
    sku: raw.sku ?? "",
    batch: raw.batch ?? "",
    expiry: raw.expiry ?? "",
    price: raw.price ?? raw.unitCost ?? 0,
    stock: raw.stock ?? 0,
    minimumStock: raw.minimumStock ?? 0,
    unit: raw.unit ?? "",
    unitCost: raw.unitCost ?? raw.price ?? 0,
    purchaseDate: raw.purchaseDate ?? "",
    supplier: raw.supplier ?? "",
    description: raw.description ?? ""
  };
}

function normalizeAppointmentStatus(rawStatus: unknown): AppointmentStatus {
  if (
    rawStatus === "Confirmado" ||
    rawStatus === "Desmarcado" ||
    rawStatus === "Realizado" ||
    rawStatus === "Em atendimento" ||
    rawStatus === "Finalizado" ||
    rawStatus === "Concluído" ||
    rawStatus === "Cancelado"
  ) {
    return rawStatus;
  }

  return "Agendado";
}

function normalizeAppointment(raw: Partial<Appointment>): Appointment {
  const legacyStatus = raw.status as string | undefined;
  const isLegacyRescheduled = legacyStatus === "Remarcado";
  const paymentMethod = normalizePaymentMethod(raw.paymentMethod);

  return {
    id: raw.id ?? createId("APT"),
    patientId: raw.patientId ?? "",
    professionalId: raw.professionalId ?? "",
    procedure: raw.procedure ?? "",
    date: raw.date ?? "",
    time: raw.time ?? "",
    originalDate: raw.originalDate,
    originalTime: raw.originalTime,
    rescheduleReason: raw.rescheduleReason,
    isRescheduled: raw.isRescheduled ?? isLegacyRescheduled,
    durationMinutes: raw.durationMinutes ?? 60,
    status: normalizeAppointmentStatus(raw.status),
    paymentStatus: raw.paymentStatus ?? "Pendente",
    paymentMethod,
    paymentDate: raw.paymentDate ?? "",
    paidAmount: raw.paidAmount ?? 0,
    installments: raw.installments,
    notes: raw.notes ?? "",
    price: raw.price ?? 0,
    history: Array.isArray(raw.history) ? raw.history : [],
    attendanceStartedAt: raw.attendanceStartedAt ?? "",
    attendanceFinishedAt: raw.attendanceFinishedAt ?? "",
    attendanceDurationMinutes: raw.attendanceDurationMinutes,
    attendanceProcedureDescription: raw.attendanceProcedureDescription ?? "",
    attendanceProductsUsed: raw.attendanceProductsUsed ?? "",
    attendanceClinicalNotes: raw.attendanceClinicalNotes ?? "",
    attendancePostProcedureRecommendations: raw.attendancePostProcedureRecommendations ?? "",
    attendanceNextReturn: raw.attendanceNextReturn ?? "",
    attendanceEvolution: raw.attendanceEvolution ?? ""
  };
}

function hasAppointmentMedicalRecord(raw: {
  attendanceClinicalNotes?: string;
  attendanceProcedureDescription?: string;
  attendanceStartedAt?: string;
  status?: string;
}) {
  return Boolean(
    raw.attendanceClinicalNotes ||
      raw.attendanceProcedureDescription ||
      raw.attendanceStartedAt ||
      raw.status === "Finalizado" ||
      raw.status === "ConcluÃ­do" ||
      raw.status === "Realizado"
  );
}

function medicalRecordFromAppointment(appointment: Appointment): MedicalRecord {
  const stamp = appointment.attendanceFinishedAt || appointment.attendanceStartedAt || appointment.date || toIsoStamp();

  const record = {
    id: `MR-${appointment.id}`,
    patientId: appointment.patientId,
    appointmentId: appointment.id,
    professionalId: appointment.professionalId,
    date: appointment.date,
    scheduledTime: appointment.time,
    status: appointment.status,
    procedure: appointment.attendanceProcedureDescription || appointment.procedure,
    startedAt: appointment.attendanceStartedAt ?? "",
    finishedAt: appointment.attendanceFinishedAt ?? "",
    durationMinutes: appointment.attendanceDurationMinutes,
    clinicalNotes: appointment.attendanceClinicalNotes || appointment.notes || "",
    recommendations: appointment.attendancePostProcedureRecommendations ?? "",
    productsUsed: appointment.attendanceProductsUsed ?? "",
    nextReturn: appointment.attendanceNextReturn ?? "",
    evolution: appointment.attendanceEvolution ?? "",
    createdAt: stamp,
    updatedAt: stamp
  };

  return {
    ...record,
    time: record.scheduledTime,
    notes: record.clinicalNotes,
    attendanceStartedAt: record.startedAt,
    attendanceFinishedAt: record.finishedAt,
    attendanceDurationMinutes: record.durationMinutes,
    attendanceProcedureDescription: record.procedure,
    attendanceProductsUsed: record.productsUsed,
    attendanceClinicalNotes: record.clinicalNotes,
    attendancePostProcedureRecommendations: record.recommendations,
    attendanceNextReturn: record.nextReturn
  };
}

function normalizeMedicalRecord(raw: Partial<MedicalRecord>): MedicalRecord {
  const stamp = raw.updatedAt ?? raw.createdAt ?? toIsoStamp();

  const record = {
    id: raw.id ?? createId("MR"),
    patientId: raw.patientId ?? "",
    appointmentId: raw.appointmentId,
    professionalId: raw.professionalId ?? "",
    date: raw.date ?? "",
    scheduledTime: raw.scheduledTime ?? "",
    status: normalizeAppointmentStatus(raw.status),
    procedure: raw.procedure ?? "",
    startedAt: raw.startedAt ?? "",
    finishedAt: raw.finishedAt ?? "",
    durationMinutes: raw.durationMinutes,
    clinicalNotes: raw.clinicalNotes ?? "",
    recommendations: raw.recommendations ?? "",
    productsUsed: raw.productsUsed ?? "",
    nextReturn: raw.nextReturn ?? "",
    evolution: raw.evolution ?? "",
    createdAt: raw.createdAt ?? stamp,
    updatedAt: raw.updatedAt ?? stamp
  };

  return {
    ...record,
    time: record.scheduledTime,
    notes: record.clinicalNotes,
    attendanceStartedAt: record.startedAt,
    attendanceFinishedAt: record.finishedAt,
    attendanceDurationMinutes: record.durationMinutes,
    attendanceProcedureDescription: record.procedure,
    attendanceProductsUsed: record.productsUsed,
    attendanceClinicalNotes: record.clinicalNotes,
    attendancePostProcedureRecommendations: record.recommendations,
    attendanceNextReturn: record.nextReturn
  };
}

function normalizeFinancialEntry(raw: Partial<FinancialEntry>): FinancialEntry {
  const amount = raw.amount ?? 0;
  const paidAmount = raw.paidAmount ?? (raw.status === "Pago" ? amount : 0);
  const paymentMethod = normalizePaymentMethod(raw.paymentMethod);

  return {
    id: raw.id ?? createId("FIN"),
    type: raw.type ?? "Receita",
    appointmentId: raw.appointmentId,
    productId: raw.productId,
    patientId: raw.patientId,
    procedure: raw.procedure,
    productName: raw.productName,
    description: raw.description ?? raw.procedure ?? raw.productName ?? "Lançamento financeiro",
    date: raw.date ?? raw.paymentDate ?? "",
    amount,
    paidAmount,
    balanceAmount: raw.balanceAmount ?? Math.max(amount - paidAmount, 0),
    status: raw.status ?? "Pendente",
    paymentMethod,
    paymentDate: raw.paymentDate ?? "",
    installments: raw.installments,
    source: raw.source ?? "Lançamento manual"
  };
}

function normalizeClinicData(raw: Partial<PersistedClinicData>): PersistedClinicData {
  const appointments = Array.isArray(raw.appointments)
    ? raw.appointments.map((appointment) => normalizeAppointment(appointment as Partial<Appointment>))
    : [];
  const explicitMedicalRecords = Array.isArray(raw.medicalRecords)
    ? raw.medicalRecords.map((record) => normalizeMedicalRecord(record as Partial<MedicalRecord>))
    : [];
  const medicalRecordAppointmentIds = new Set(
    explicitMedicalRecords.map((record) => record.appointmentId).filter(Boolean)
  );
  const legacyMedicalRecords = appointments
    .filter((appointment) => hasAppointmentMedicalRecord(appointment))
    .filter((appointment) => !medicalRecordAppointmentIds.has(appointment.id))
    .map((appointment) => medicalRecordFromAppointment(appointment));

  return {
    patients: Array.isArray(raw.patients)
      ? raw.patients.map((patient) => normalizePatient(patient as Partial<Patient> & { name?: string }))
      : [],
    products: Array.isArray(raw.products) ? raw.products.map((product) => normalizeProduct(product)) : [],
    professionals: Array.isArray(raw.professionals) ? raw.professionals.map((professional) => normalizeProfessional(professional)) : [],
    anamneses: Array.isArray(raw.anamneses) ? raw.anamneses : [],
    contracts: Array.isArray(raw.contracts) ? raw.contracts : [],
    procedures: Array.isArray(raw.procedures)
      ? raw.procedures.map((procedure) => normalizeProcedure(procedure as ProcedureRecord))
      : [],
    patientFiles: Array.isArray(raw.patientFiles) ? raw.patientFiles : [],
    appointments,
    medicalRecords: [...explicitMedicalRecords, ...legacyMedicalRecords].sort((left, right) =>
      `${right.date}${right.startedAt || right.scheduledTime}`.localeCompare(`${left.date}${left.startedAt || left.scheduledTime}`)
    ),
    financialEntries: Array.isArray(raw.financialEntries)
      ? raw.financialEntries.map((entry) => normalizeFinancialEntry(entry as Partial<FinancialEntry>))
      : []
  };
}

function syncFinancialEntries(
  appointments: Appointment[],
  currentEntries: FinancialEntry[],
  patients: Patient[],
  products: Product[]
): FinancialEntry[] {
  const patientIds = new Set(patients.map((item) => item.id));
  const productIds = new Set(products.map((item) => item.id));
  const appointmentIds = new Set(appointments.map((item) => item.id));
  const normalizedEntries = currentEntries.filter(
    (entry) =>
      (entry.type === "Receita" &&
        entry.patientId &&
        patientIds.has(entry.patientId) &&
        entry.appointmentId &&
        appointmentIds.has(entry.appointmentId)) ||
      (entry.type === "Despesa" && entry.productId && productIds.has(entry.productId))
  );
  const entriesByAppointmentId = new Map(
    normalizedEntries
      .filter((entry) => entry.type === "Receita" && entry.appointmentId)
      .map((entry) => [entry.appointmentId, entry])
  );
  const entriesByProductId = new Map(
    normalizedEntries
      .filter((entry) => entry.type === "Despesa" && entry.productId)
      .map((entry) => [entry.productId, entry])
  );

  const revenueEntries = appointments.reduce<FinancialEntry[]>((accumulator, appointment) => {
    if (appointment.status === "Cancelado" || appointment.status === "Desmarcado") {
      return accumulator.filter((entry) => entry.appointmentId !== appointment.id || entry.type !== "Receita");
    }

    const existingEntry = entriesByAppointmentId.get(appointment.id);
    const status = appointment.paymentStatus ?? existingEntry?.status ?? "Pendente";
    const paidAmount =
      status === "Pago"
        ? appointment.price
        : status === "Parcial"
          ? appointment.paidAmount ?? existingEntry?.paidAmount ?? 0
          : 0;
    const nextEntry: FinancialEntry = {
      id: existingEntry?.id ?? createId("FIN"),
      type: "Receita",
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      procedure: appointment.procedure,
      description: appointment.procedure,
      date: appointment.paymentDate || appointment.date,
      amount: appointment.price,
      paidAmount,
      balanceAmount: Math.max(appointment.price - paidAmount, 0),
      status,
      paymentMethod: appointment.paymentMethod ?? existingEntry?.paymentMethod ?? "",
      paymentDate: appointment.paymentDate ?? existingEntry?.paymentDate ?? "",
      installments: appointment.installments,
      source: "Agendamento"
    };

    if (existingEntry) {
      return accumulator.map((entry) => (entry.appointmentId === appointment.id ? nextEntry : entry));
    }

    return [...accumulator, nextEntry];
  }, normalizedEntries);

  return products.reduce<FinancialEntry[]>((accumulator, product) => {
    const amount = product.stock * product.unitCost;
    const existingEntry = entriesByProductId.get(product.id);
    const nextEntry: FinancialEntry = {
      id: existingEntry?.id ?? createId("EXP"),
      type: "Despesa",
      productId: product.id,
      productName: product.name,
      description: `Compra/estoque: ${product.name}`,
      date: product.purchaseDate || new Date().toISOString().slice(0, 10),
      amount,
      paidAmount: amount,
      balanceAmount: 0,
      status: "Pago",
      paymentMethod: "Estoque",
      paymentDate: product.purchaseDate || "",
      source: "Produtos"
    };

    if (existingEntry) {
      return accumulator.map((entry) => (entry.id === existingEntry.id ? nextEntry : entry));
    }

    return [...accumulator, nextEntry];
  }, revenueEntries);
}

function withSyncedFinancialEntries(data: PersistedClinicData): PersistedClinicData {
  return {
    ...data,
    financialEntries: syncFinancialEntries(data.appointments, data.financialEntries, data.patients, data.products)
  };
}

function markClinicDataVersion() {
  clinicDataVersion += 1;
}

async function fetchClinicData() {
  if (clinicDataFetchPromise) return clinicDataFetchPromise;

  clinicDataFetchPromise = fetch("/api/clinic", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Não foi possível carregar os dados.");
      return response.json() as Promise<PersistedClinicData>;
    })
    .then((payload) => withSyncedFinancialEntries(normalizeClinicData(payload)))
    .finally(() => {
      clinicDataFetchPromise = null;
    });

  return clinicDataFetchPromise;
}

async function saveClinicData(data: PersistedClinicData) {
  const response = await fetch("/api/clinic", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const debugMessage = payload?.debug?.message ? ` Detalhe: ${payload.debug.message}` : "";
    throw new Error(`${payload?.error ?? "Não foi possível salvar os dados."}${debugMessage}`);
  }
}

async function mutateClinicResource(resource: string, method: "POST" | "PUT" | "DELETE", body?: unknown, id?: string) {
  const params = new URLSearchParams({ resource });
  if (id) params.set("id", id);

  const response = await fetch(`/api/clinic?${params.toString()}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const debugMessage = payload?.debug?.message ? ` Detalhe: ${payload.debug.message}` : "";
    throw new Error(`${payload?.error ?? "Não foi possível salvar os dados."}${debugMessage}`);
  }
}

export function useClinicData() {
  const [data, setData] = useState<PersistedClinicData>(emptyClinicData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasFreshServerData, setHasFreshServerData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const requestedVersion = clinicDataVersion;

    fetchClinicData()
      .then((freshData) => {
        if (!isMounted || clinicDataVersion !== requestedVersion) return;
        markClinicDataVersion();
        setData(freshData);
        setHasFreshServerData(true);
        setLoadError(null);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setHasFreshServerData(false);
          setLoadError("Não foi possível carregar os dados da clínica.");
          setData(emptyClinicData);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const canPersistClinicData = () => {
    if (hasFreshServerData) return true;

    const message = "Não foi possível confirmar os dados do banco. Recarregue a página antes de salvar alterações.";
    setLoadError(message);
    if (typeof window !== "undefined") window.alert(message);
    return false;
  };

  const setPersistedData = (
    updater: (current: PersistedClinicData) => PersistedClinicData,
    mutation?: () => Promise<void>
  ) => {
    if (!canPersistClinicData()) return false;

    setData((current) => {
      const next = withSyncedFinancialEntries(updater(current));
      const previous = current;
      markClinicDataVersion();
      void (mutation ? mutation() : saveClinicData(next))
        .then(fetchClinicData)
        .then((freshData) => {
          const normalized = withSyncedFinancialEntries(normalizeClinicData(freshData));
          markClinicDataVersion();
          setData(normalized);
          setHasFreshServerData(true);
          setLoadError(null);
        })
        .catch((error) => {
          console.error(error);
          markClinicDataVersion();
          setData(previous);
          const message = error instanceof Error ? error.message : "Não foi possível salvar no banco.";
          setLoadError(`${message} A alteração foi desfeita.`);
          if (typeof window !== "undefined") {
            window.alert(`${message} A alteração foi desfeita.`);
          }
        });
      return next;
    });

    return true;
  };

  return {
    isLoading,
    loadError,
    patients: data.patients,
    products: data.products,
    professionals: data.professionals,
    anamneses: data.anamneses,
    contracts: data.contracts,
    procedures: data.procedures,
    patientFiles: data.patientFiles,
    appointments: data.appointments,
    medicalRecords: data.medicalRecords,
    financialEntries: data.financialEntries,
    createPatient: (input: PatientInput) => {
      const id = createId("PAT");
      const now = toIsoStamp();
      const patient = { ...input, id, createdAt: now, updatedAt: now };
      const saved = setPersistedData((current) => ({
        ...current,
        patients: [...current.patients, patient]
      }), () => mutateClinicResource("patients", "POST", patient));
      return saved ? id : "";
    },
    updatePatient: (id: string, input: PatientInput) => {
      const currentPatient = data.patients.find((item) => item.id === id);
      const patient = { ...input, id, createdAt: currentPatient?.createdAt ?? toIsoStamp(), updatedAt: toIsoStamp() };
      setPersistedData((current) => ({
        ...current,
        patients: current.patients.map((item) =>
          item.id === id ? { ...input, id, createdAt: item.createdAt, updatedAt: patient.updatedAt } : item
        )
      }), () => mutateClinicResource("patients", "PUT", patient, id));
    },
    deletePatient: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        patients: current.patients.filter((item) => item.id !== id),
        anamneses: current.anamneses.filter((item) => item.patientId !== id),
        contracts: current.contracts.filter((item) => item.patientId !== id),
        procedures: current.procedures.filter((item) => item.patientId !== id),
        patientFiles: current.patientFiles.filter((item) => item.patientId !== id),
        appointments: current.appointments.filter((item) => item.patientId !== id),
        medicalRecords: current.medicalRecords.filter((item) => item.patientId !== id),
        financialEntries: current.financialEntries.filter((item) => item.patientId !== id)
      }), () => mutateClinicResource("patients", "DELETE", undefined, id));
    },
    createProduct: (input: ProductInput) => {
      const product = { ...input, id: createId("PRD") };
      setPersistedData((current) => ({
        ...current,
        products: [...current.products, product]
      }), () => mutateClinicResource("products", "POST", product));
    },
    updateProduct: (id: string, input: ProductInput) => {
      const product = { ...input, id };
      setPersistedData((current) => ({
        ...current,
        products: current.products.map((item) => (item.id === id ? { ...input, id } : item))
      }), () => mutateClinicResource("products", "PUT", product, id));
    },
    deleteProduct: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== id)
      }), () => mutateClinicResource("products", "DELETE", undefined, id));
    },
    createProfessional: (input: ProfessionalInput) => {
      const professional = { ...input, id: createId("PRO") };
      setPersistedData((current) => ({
        ...current,
        professionals: [...current.professionals, professional]
      }), () => mutateClinicResource("professionals", "POST", professional));
    },
    updateProfessional: (id: string, input: ProfessionalInput) => {
      const professional = { ...input, id };
      setPersistedData((current) => ({
        ...current,
        professionals: current.professionals.map((item) => (item.id === id ? { ...input, id } : item))
      }), () => mutateClinicResource("professionals", "PUT", professional, id));
    },
    deleteProfessional: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        professionals: current.professionals.filter((item) => item.id !== id),
        appointments: current.appointments.filter((item) => item.professionalId !== id),
        procedures: current.procedures.map((item) =>
          item.professionalId === id ? { ...item, professionalId: "" } : item
        )
      }), () => mutateClinicResource("professionals", "DELETE", undefined, id));
    },
    createAnamnesis: (input: AnamnesisInput) => {
      let recordToCreate: AnamnesisRecord | null = null;
      setPersistedData((current) => {
        const versions = current.anamneses.filter((item) => item.patientId === input.patientId);
        recordToCreate = {
          ...input,
          id: createId("ANA"),
          version: versions.length + 1,
          createdAt: toIsoStamp(),
          updatedAt: toIsoStamp()
        };
        return {
          ...current,
          anamneses: [...current.anamneses, recordToCreate as AnamnesisRecord]
        };
      }, () => mutateClinicResource("anamneses", "POST", recordToCreate));
    },
    updateAnamnesis: (id: string, input: AnamnesisInput) => {
      const existing = data.anamneses.find((item) => item.id === id);
      const record = { ...existing, ...input, id, updatedAt: toIsoStamp() };
      setPersistedData((current) => ({
        ...current,
        anamneses: current.anamneses.map((item) =>
          item.id === id ? { ...item, ...input, updatedAt: record.updatedAt } : item
        )
      }), () => mutateClinicResource("anamneses", "PUT", record, id));
    },
    deleteAnamnesis: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        anamneses: current.anamneses.filter((item) => item.id !== id)
      }), () => mutateClinicResource("anamneses", "DELETE", undefined, id));
    },
    createContract: (input: ContractInput) => {
      let recordToCreate: ContractRecord | null = null;
      setPersistedData((current) => {
        const versions = current.contracts.filter((item) => item.patientId === input.patientId);
        recordToCreate = {
          ...input,
          id: createId("CON"),
          version: versions.length + 1,
          uploadedAt: toIsoStamp()
        };
        return {
          ...current,
          contracts: [...current.contracts, recordToCreate as ContractRecord]
        };
      }, () => mutateClinicResource("contracts", "POST", recordToCreate));
    },
    updateContract: (id: string, input: ContractInput) => {
      const existing = data.contracts.find((item) => item.id === id);
      const record = { ...existing, ...input, id, uploadedAt: toIsoStamp() };
      setPersistedData((current) => ({
        ...current,
        contracts: current.contracts.map((item) =>
          item.id === id ? { ...item, ...input, uploadedAt: record.uploadedAt } : item
        )
      }), () => mutateClinicResource("contracts", "PUT", record, id));
    },
    deleteContract: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        contracts: current.contracts.filter((item) => item.id !== id)
      }), () => mutateClinicResource("contracts", "DELETE", undefined, id));
    },
    createProcedure: (input: ProcedureInput) => {
      const procedure = { ...input, id: createId("PRC") };
      setPersistedData((current) => ({
        ...current,
        procedures: [...current.procedures, procedure]
      }), () => mutateClinicResource("procedures", "POST", procedure));
    },
    updateProcedure: (id: string, input: ProcedureInput) => {
      const procedure = { ...input, id };
      setPersistedData((current) => ({
        ...current,
        procedures: current.procedures.map((item) => (item.id === id ? { ...input, id } : item))
      }), () => mutateClinicResource("procedures", "PUT", procedure, id));
    },
    deleteProcedure: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        procedures: current.procedures.filter((item) => item.id !== id)
      }), () => mutateClinicResource("procedures", "DELETE", undefined, id));
    },
    createPatientFile: (input: PatientFileInput) => {
      const fileRecord = { ...input, id: createId("PFILE") };
      setPersistedData((current) => ({
        ...current,
        patientFiles: [...current.patientFiles, fileRecord]
      }), () => mutateClinicResource("patientFiles", "POST", fileRecord));
    },
    updatePatientFile: (id: string, input: PatientFileInput) => {
      const fileRecord = { ...input, id };
      setPersistedData((current) => ({
        ...current,
        patientFiles: current.patientFiles.map((item) => (item.id === id ? { ...input, id } : item))
      }), () => mutateClinicResource("patientFiles", "PUT", fileRecord, id));
    },
    deletePatientFile: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        patientFiles: current.patientFiles.filter((item) => item.id !== id)
      }), () => mutateClinicResource("patientFiles", "DELETE", undefined, id));
    },
    createAppointment: (input: AppointmentInput) => {
      const appointment = { ...input, id: createId("APT") };
      setPersistedData((current) => ({
        ...current,
        appointments: [...current.appointments, appointment]
      }), () => mutateClinicResource("appointments", "POST", appointment));
    },
    updateAppointment: (id: string, input: AppointmentInput) => {
      const appointment = { ...input, id };
      setPersistedData((current) => ({
        ...current,
        appointments: current.appointments.map((item) => (item.id === id ? { ...input, id } : item))
      }), () => mutateClinicResource("appointments", "PUT", appointment, id));
    },
    deleteAppointment: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        appointments: current.appointments.filter((item) => item.id !== id),
        medicalRecords: current.medicalRecords.map((item) =>
          item.appointmentId === id ? { ...item, appointmentId: undefined, updatedAt: toIsoStamp() } : item
        ),
        financialEntries: current.financialEntries.filter((item) => item.appointmentId !== id)
      }), () => mutateClinicResource("appointments", "DELETE", undefined, id));
    },
    createMedicalRecord: (input: MedicalRecordInput) => {
      const now = toIsoStamp();
      const id = createId("MR");
      const nextRecord = normalizeMedicalRecord({ ...input, id, createdAt: now, updatedAt: now });
      const existingByAppointment = input.appointmentId
        ? data.medicalRecords.find((item) => item.appointmentId === input.appointmentId)
        : undefined;
      const recordToPersist = existingByAppointment
        ? { ...nextRecord, id: existingByAppointment.id, createdAt: existingByAppointment.createdAt, updatedAt: now }
        : nextRecord;

      setPersistedData((current) => {
        if (existingByAppointment) {
          return {
            ...current,
            medicalRecords: current.medicalRecords.map((item) =>
              item.id === existingByAppointment.id
                ? { ...nextRecord, id: item.id, createdAt: item.createdAt, updatedAt: now }
                : item
            )
          };
        }

        return {
          ...current,
          medicalRecords: [nextRecord, ...current.medicalRecords]
        };
      }, () =>
        mutateClinicResource(
          "medicalRecords",
          existingByAppointment ? "PUT" : "POST",
          recordToPersist,
          existingByAppointment?.id
        )
      );

      return id;
    },
    updateFinancialStatus: (id: string, status: FinancialStatus) => {
      setPersistedData((current) => ({
        ...current,
        appointments: current.appointments.map((appointment) => {
          const entry = current.financialEntries.find((item) => item.id === id);
          if (!entry?.appointmentId || appointment.id !== entry.appointmentId) return appointment;

          return {
            ...appointment,
            paymentStatus: status,
            paidAmount: status === "Pago" ? appointment.price : status === "Pendente" || status === "Cancelado" ? 0 : appointment.paidAmount,
            paymentDate: status === "Pago" ? appointment.paymentDate || toIsoStamp().slice(0, 10) : appointment.paymentDate
          };
        }),
        financialEntries: current.financialEntries.map((item) => (item.id === id ? { ...item, status } : item))
      }));
    },
    updateFinancialEntry: (
      id: string,
      input: Pick<FinancialEntry, "status" | "paymentMethod" | "paymentDate" | "paidAmount" | "installments">
    ) => {
      setPersistedData((current) => {
        const entry = current.financialEntries.find((item) => item.id === id);
        return {
          ...current,
          appointments: current.appointments.map((appointment) => {
            if (!entry?.appointmentId || appointment.id !== entry.appointmentId) return appointment;

            return {
              ...appointment,
              paymentStatus: input.status,
              paymentMethod: input.paymentMethod,
              paymentDate: input.paymentDate,
              paidAmount: input.status === "Pago" ? appointment.price : input.paidAmount,
              installments: input.paymentMethod === "Cartão de crédito" ? input.installments : undefined
            };
          }),
          financialEntries: current.financialEntries.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...input,
                  paidAmount: input.status === "Pago" ? item.amount : input.paidAmount,
                  balanceAmount: input.status === "Pago" ? 0 : Math.max(item.amount - input.paidAmount, 0),
                  installments: input.paymentMethod === "Cartão de crédito" ? input.installments : undefined
                }
              : item
          )
        };
      });
    }
  };
}
