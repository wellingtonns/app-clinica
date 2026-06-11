import { useEffect, useState } from "react";
import { initialClinicData } from "../data/mockData";
import {
  AnamnesisRecord,
  Appointment,
  AppointmentStatus,
  ContractRecord,
  FinancialEntry,
  FinancialStatus,
  Patient,
  PatientFileRecord,
  PersistedClinicData,
  ProcedureRecord,
  Product,
  Professional
} from "../types";

type PatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;
type ProductInput = Omit<Product, "id">;
type ProfessionalInput = Omit<Professional, "id">;
type AnamnesisInput = Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">;
type ContractInput = Omit<ContractRecord, "id" | "version" | "uploadedAt">;
type ProcedureInput = Omit<ProcedureRecord, "id">;
type PatientFileInput = Omit<PatientFileRecord, "id">;
type AppointmentInput = Omit<Appointment, "id">;

const STORAGE_KEY = "clinicflow-pro:v5";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function toIsoStamp() {
  return new Date().toISOString();
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
    photos: Array.isArray(raw.photos)
      ? raw.photos.map((photo) => ({
          ...photo,
          area: photo.area ?? "Geral"
        }))
      : []
  };
}

function normalizeAppointmentStatus(rawStatus: unknown): AppointmentStatus {
  if (
    rawStatus === "Confirmado" ||
    rawStatus === "Desmarcado" ||
    rawStatus === "Realizado" ||
    rawStatus === "Cancelado"
  ) {
    return rawStatus;
  }

  return "Agendado";
}

function normalizeAppointment(raw: Partial<Appointment>): Appointment {
  const legacyStatus = raw.status as string | undefined;
  const isLegacyRescheduled = legacyStatus === "Remarcado";

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
    notes: raw.notes ?? "",
    price: raw.price ?? 0,
    history: Array.isArray(raw.history) ? raw.history : []
  };
}

function parseStoredState(): PersistedClinicData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialClinicData;

    const parsed = JSON.parse(raw) as Partial<PersistedClinicData>;
    return {
      patients: Array.isArray(parsed.patients)
        ? parsed.patients.map((patient) => normalizePatient(patient as Partial<Patient> & { name?: string }))
        : initialClinicData.patients,
      products: Array.isArray(parsed.products) ? parsed.products : initialClinicData.products,
      professionals: Array.isArray(parsed.professionals) ? parsed.professionals : initialClinicData.professionals,
      anamneses: Array.isArray(parsed.anamneses) ? parsed.anamneses : initialClinicData.anamneses,
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : initialClinicData.contracts,
      procedures: Array.isArray(parsed.procedures)
        ? parsed.procedures.map((procedure) => normalizeProcedure(procedure as ProcedureRecord))
        : initialClinicData.procedures.map((procedure) => normalizeProcedure(procedure)),
      patientFiles: Array.isArray(parsed.patientFiles) ? parsed.patientFiles : initialClinicData.patientFiles,
      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments.map((appointment) => normalizeAppointment(appointment as Partial<Appointment>))
        : initialClinicData.appointments.map((appointment) => normalizeAppointment(appointment)),
      financialEntries: Array.isArray(parsed.financialEntries)
        ? parsed.financialEntries
        : initialClinicData.financialEntries
    };
  } catch {
    return initialClinicData;
  }
}

function syncFinancialEntries(
  appointments: Appointment[],
  currentEntries: FinancialEntry[],
  patients: Patient[]
): FinancialEntry[] {
  const patientIds = new Set(patients.map((item) => item.id));
  const normalizedEntries = currentEntries.filter(
    (entry) => patientIds.has(entry.patientId) && appointments.some((appointment) => appointment.id === entry.appointmentId)
  );

  return appointments.reduce<FinancialEntry[]>((accumulator, appointment) => {
    if (appointment.status !== "Realizado") {
      return accumulator.filter((entry) => entry.appointmentId !== appointment.id);
    }

    const existingEntry = accumulator.find((entry) => entry.appointmentId === appointment.id);
    const nextEntry: FinancialEntry = {
      id: existingEntry?.id ?? createId("FIN"),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      procedure: appointment.procedure,
      date: appointment.date,
      amount: appointment.price,
      status: existingEntry?.status ?? "Pendente",
      source: "Procedimento realizado"
    };

    if (existingEntry) {
      return accumulator.map((entry) => (entry.appointmentId === appointment.id ? nextEntry : entry));
    }

    return [...accumulator, nextEntry];
  }, normalizedEntries);
}

export function useClinicData() {
  const [data, setData] = useState<PersistedClinicData>(() => {
    const parsed = parseStoredState();
    return {
      ...parsed,
      financialEntries: syncFinancialEntries(parsed.appointments, parsed.financialEntries, parsed.patients)
    };
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setPersistedData = (updater: (current: PersistedClinicData) => PersistedClinicData) => {
    setData((current) => {
      const next = updater(current);
      return {
        ...next,
        financialEntries: syncFinancialEntries(next.appointments, next.financialEntries, next.patients)
      };
    });
  };

  return {
    patients: data.patients,
    products: data.products,
    professionals: data.professionals,
    anamneses: data.anamneses,
    contracts: data.contracts,
    procedures: data.procedures,
    patientFiles: data.patientFiles,
    appointments: data.appointments,
    financialEntries: data.financialEntries,
    createPatient: (input: PatientInput) => {
      const id = createId("PAT");
      const now = toIsoStamp();
      setPersistedData((current) => ({
        ...current,
        patients: [...current.patients, { ...input, id, createdAt: now, updatedAt: now }]
      }));
      return id;
    },
    updatePatient: (id: string, input: PatientInput) => {
      setPersistedData((current) => ({
        ...current,
        patients: current.patients.map((item) =>
          item.id === id ? { ...input, id, createdAt: item.createdAt, updatedAt: toIsoStamp() } : item
        )
      }));
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
        financialEntries: current.financialEntries.filter((item) => item.patientId !== id)
      }));
    },
    createProduct: (input: ProductInput) => {
      setPersistedData((current) => ({
        ...current,
        products: [...current.products, { ...input, id: createId("PRD") }]
      }));
    },
    updateProduct: (id: string, input: ProductInput) => {
      setPersistedData((current) => ({
        ...current,
        products: current.products.map((item) => (item.id === id ? { ...input, id } : item))
      }));
    },
    deleteProduct: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== id)
      }));
    },
    createProfessional: (input: ProfessionalInput) => {
      setPersistedData((current) => ({
        ...current,
        professionals: [...current.professionals, { ...input, id: createId("PRO") }]
      }));
    },
    updateProfessional: (id: string, input: ProfessionalInput) => {
      setPersistedData((current) => ({
        ...current,
        professionals: current.professionals.map((item) => (item.id === id ? { ...input, id } : item))
      }));
    },
    deleteProfessional: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        professionals: current.professionals.filter((item) => item.id !== id),
        appointments: current.appointments.filter((item) => item.professionalId !== id),
        procedures: current.procedures.map((item) =>
          item.professionalId === id ? { ...item, professionalId: "" } : item
        )
      }));
    },
    createAnamnesis: (input: AnamnesisInput) => {
      setPersistedData((current) => {
        const versions = current.anamneses.filter((item) => item.patientId === input.patientId);
        return {
          ...current,
          anamneses: [
            ...current.anamneses,
            {
              ...input,
              id: createId("ANA"),
              version: versions.length + 1,
              createdAt: toIsoStamp(),
              updatedAt: toIsoStamp()
            }
          ]
        };
      });
    },
    updateAnamnesis: (id: string, input: AnamnesisInput) => {
      setPersistedData((current) => ({
        ...current,
        anamneses: current.anamneses.map((item) =>
          item.id === id ? { ...item, ...input, updatedAt: toIsoStamp() } : item
        )
      }));
    },
    deleteAnamnesis: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        anamneses: current.anamneses.filter((item) => item.id !== id)
      }));
    },
    createContract: (input: ContractInput) => {
      setPersistedData((current) => {
        const versions = current.contracts.filter((item) => item.patientId === input.patientId);
        return {
          ...current,
          contracts: [
            ...current.contracts,
            {
              ...input,
              id: createId("CON"),
              version: versions.length + 1,
              uploadedAt: toIsoStamp()
            }
          ]
        };
      });
    },
    updateContract: (id: string, input: ContractInput) => {
      setPersistedData((current) => ({
        ...current,
        contracts: current.contracts.map((item) =>
          item.id === id ? { ...item, ...input, uploadedAt: toIsoStamp() } : item
        )
      }));
    },
    deleteContract: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        contracts: current.contracts.filter((item) => item.id !== id)
      }));
    },
    createProcedure: (input: ProcedureInput) => {
      setPersistedData((current) => ({
        ...current,
        procedures: [...current.procedures, { ...input, id: createId("PRC") }]
      }));
    },
    updateProcedure: (id: string, input: ProcedureInput) => {
      setPersistedData((current) => ({
        ...current,
        procedures: current.procedures.map((item) => (item.id === id ? { ...input, id } : item))
      }));
    },
    deleteProcedure: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        procedures: current.procedures.filter((item) => item.id !== id)
      }));
    },
    createPatientFile: (input: PatientFileInput) => {
      setPersistedData((current) => ({
        ...current,
        patientFiles: [...current.patientFiles, { ...input, id: createId("PFILE") }]
      }));
    },
    updatePatientFile: (id: string, input: PatientFileInput) => {
      setPersistedData((current) => ({
        ...current,
        patientFiles: current.patientFiles.map((item) => (item.id === id ? { ...input, id } : item))
      }));
    },
    deletePatientFile: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        patientFiles: current.patientFiles.filter((item) => item.id !== id)
      }));
    },
    createAppointment: (input: AppointmentInput) => {
      setPersistedData((current) => ({
        ...current,
        appointments: [...current.appointments, { ...input, id: createId("APT") }]
      }));
    },
    updateAppointment: (id: string, input: AppointmentInput) => {
      setPersistedData((current) => ({
        ...current,
        appointments: current.appointments.map((item) => (item.id === id ? { ...input, id } : item))
      }));
    },
    deleteAppointment: (id: string) => {
      setPersistedData((current) => ({
        ...current,
        appointments: current.appointments.filter((item) => item.id !== id),
        financialEntries: current.financialEntries.filter((item) => item.appointmentId !== id)
      }));
    },
    updateFinancialStatus: (id: string, status: FinancialStatus) => {
      setPersistedData((current) => ({
        ...current,
        financialEntries: current.financialEntries.map((item) => (item.id === id ? { ...item, status } : item))
      }));
    }
  };
}
