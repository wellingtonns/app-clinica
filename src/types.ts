export type RoleName = "Administrador" | "Recepcao" | "Profissional";
export type AppointmentStatus = "Agendado" | "Realizado" | "Cancelado";
export type FinancialStatus = "Pago" | "Pendente";
export type PatientStatus = "Ativo" | "Inativo";
export type PhotoCategory = "Antes" | "Depois" | "Durante" | "Evolucao";
export type BodyArea = "Geral" | "Rosto" | "Costas" | "Barriga" | "Gluteos" | "Pernas" | "Bracos";
export type FileCategory = "Geral" | "Anamnese" | "Exame" | "Documento";

export interface MetricCard {
  title: string;
  value: string;
  delta: string;
  tone: "primary" | "success" | "warning" | "danger";
}

export interface RevenuePoint {
  month: string;
  revenue: number;
}

export interface StoredAsset {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
  description: string;
}

export interface Patient {
  id: string;
  fullName: string;
  birthDate: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  generalObservations: string;
  allergySummary: string;
  restrictionSummary: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  batch: string;
  expiry: string;
  price: number;
  stock: number;
  minimumStock: number;
  unit: string;
  supplier: string;
  description: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  role: RoleName;
  commissionRate: string;
  nextShift: string;
  phone: string;
  email: string;
  council: string;
  status: "Ativo" | "Ferias" | "Inativo";
}

export interface AnamnesisCheckboxes {
  hasPriorDiseases: boolean;
  hasSurgeries: boolean;
  isUnderTreatment: boolean;
  hasAllergies: boolean;
  usesMedication: boolean;
  smokes: boolean;
  drinksAlcohol: boolean;
}

export interface AnamnesisRecord {
  id: string;
  patientId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  healthHistory: string;
  priorDiseases: string;
  surgeries: string;
  treatments: string;
  allergies: string;
  medications: string;
  habits: string;
  mainComplaint: string;
  professionalObservations: string;
  checkboxes: AnamnesisCheckboxes;
  attachments: StoredAsset[];
}

export interface ContractRecord {
  id: string;
  patientId: string;
  version: number;
  contractType: string;
  signedAt: string;
  observations: string;
  file: StoredAsset;
  uploadedAt: string;
}

export interface ProcedurePhoto extends StoredAsset {
  category: PhotoCategory;
  capturedAt: string;
  area: BodyArea;
}

export interface ProcedureRecord {
  id: string;
  patientId: string;
  name: string;
  procedureType: string;
  date: string;
  professionalId: string;
  observations: string;
  photos: ProcedurePhoto[];
}

export interface PatientFileRecord {
  id: string;
  patientId: string;
  category: FileCategory;
  description: string;
  file: StoredAsset;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  procedure: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes: string;
  price: number;
}

export interface FinancialEntry {
  id: string;
  appointmentId: string;
  patientId: string;
  procedure: string;
  date: string;
  amount: number;
  status: FinancialStatus;
  source: string;
}

export interface PersistedClinicData {
  patients: Patient[];
  products: Product[];
  professionals: Professional[];
  anamneses: AnamnesisRecord[];
  contracts: ContractRecord[];
  procedures: ProcedureRecord[];
  patientFiles: PatientFileRecord[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
}
