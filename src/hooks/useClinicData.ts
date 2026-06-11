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
    rawStatus === "Cancelado"
  ) {
    return rawStatus;
  }

  return "Agendado";
}

function normalizeAppointment(raw: Partial<Appointment>): Appointment {
  const legacyStatus = raw.status as string | undefined;
  const isLegacyRescheduled = legacyStatus === "Remarcado";
  const paymentMethod = raw.paymentMethod === "Cartao" ? "Cartao de credito" : raw.paymentMethod ?? "";

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
    paymentStatus: raw.paymentStatus ?? (raw.status === "Realizado" ? "Pendente" : "Pendente"),
    paymentMethod,
    paymentDate: raw.paymentDate ?? "",
    paidAmount: raw.paidAmount ?? 0,
    installments: raw.installments,
    notes: raw.notes ?? "",
    price: raw.price ?? 0,
    history: Array.isArray(raw.history) ? raw.history : []
  };
}

function normalizeFinancialEntry(raw: Partial<FinancialEntry>): FinancialEntry {
  const amount = raw.amount ?? 0;
  const paidAmount = raw.paidAmount ?? (raw.status === "Pago" ? amount : 0);
  const paymentMethod = raw.paymentMethod === "Cartao" ? "Cartao de credito" : raw.paymentMethod ?? "";

  return {
    id: raw.id ?? createId("FIN"),
    type: raw.type ?? "Receita",
    appointmentId: raw.appointmentId,
    productId: raw.productId,
    patientId: raw.patientId,
    procedure: raw.procedure,
    productName: raw.productName,
    description: raw.description ?? raw.procedure ?? raw.productName ?? "Lancamento financeiro",
    date: raw.date ?? raw.paymentDate ?? "",
    amount,
    paidAmount,
    balanceAmount: raw.balanceAmount ?? Math.max(amount - paidAmount, 0),
    status: raw.status ?? "Pendente",
    paymentMethod,
    paymentDate: raw.paymentDate ?? "",
    installments: raw.installments,
    source: raw.source ?? "Lancamento manual"
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
      products: Array.isArray(parsed.products)
        ? parsed.products.map((product) => normalizeProduct(product as Partial<Product>))
        : initialClinicData.products.map((product) => normalizeProduct(product)),
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
        ? parsed.financialEntries.map((entry) => normalizeFinancialEntry(entry as Partial<FinancialEntry>))
        : initialClinicData.financialEntries.map((entry) => normalizeFinancialEntry(entry))
    };
  } catch {
    return initialClinicData;
  }
}

function syncFinancialEntries(
  appointments: Appointment[],
  currentEntries: FinancialEntry[],
  patients: Patient[],
  products: Product[]
): FinancialEntry[] {
  const patientIds = new Set(patients.map((item) => item.id));
  const productIds = new Set(products.map((item) => item.id));
  const normalizedEntries = currentEntries.filter(
    (entry) =>
      (entry.type === "Receita" &&
        entry.patientId &&
        patientIds.has(entry.patientId) &&
        entry.appointmentId &&
        appointments.some((appointment) => appointment.id === entry.appointmentId)) ||
      (entry.type === "Despesa" && entry.productId && productIds.has(entry.productId))
  );

  const revenueEntries = appointments.reduce<FinancialEntry[]>((accumulator, appointment) => {
    if (appointment.status === "Cancelado" || appointment.status === "Desmarcado") {
      return accumulator.filter((entry) => entry.appointmentId !== appointment.id || entry.type !== "Receita");
    }

    const existingEntry = accumulator.find((entry) => entry.type === "Receita" && entry.appointmentId === appointment.id);
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
    const existingEntry = accumulator.find((entry) => entry.type === "Despesa" && entry.productId === product.id);
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

export function useClinicData() {
  const [data, setData] = useState<PersistedClinicData>(() => {
    const parsed = parseStoredState();
    return {
      ...parsed,
      financialEntries: syncFinancialEntries(parsed.appointments, parsed.financialEntries, parsed.patients, parsed.products)
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
        financialEntries: syncFinancialEntries(next.appointments, next.financialEntries, next.patients, next.products)
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
              installments: input.paymentMethod === "Cartao de credito" ? input.installments : undefined
            };
          }),
          financialEntries: current.financialEntries.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...input,
                  paidAmount: input.status === "Pago" ? item.amount : input.paidAmount,
                  balanceAmount: input.status === "Pago" ? 0 : Math.max(item.amount - input.paidAmount, 0),
                  installments: input.paymentMethod === "Cartao de credito" ? input.installments : undefined
                }
              : item
          )
        };
      });
    }
  };
}
