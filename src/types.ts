export type RoleName = "Administrador" | "Recepção" | "Profissional";
export type AppointmentStatus = "Agendado" | "Confirmado" | "Desmarcado" | "Realizado" | "Cancelado";
export type FinancialStatus = "Pago" | "Pendente" | "Parcial" | "Cancelado";
export type FinancialEntryType = "Receita" | "Despesa";
export type PatientStatus = "Ativo" | "Inativo";
export type PhotoCategory = "Antes" | "Depois" | "Durante" | "Evolução";
export type BodyArea = "Geral" | "Rosto" | "Costas" | "Barriga" | "Glúteos" | "Pernas" | "Braços";
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
  unitCost: number;
  purchaseDate: string;
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
  status: "Ativo" | "Férias" | "Inativo";
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
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
  isRescheduled?: boolean;
  durationMinutes: number;
  status: AppointmentStatus;
  paymentStatus?: FinancialStatus;
  paymentMethod?: string;
  paymentDate?: string;
  paidAmount?: number;
  installments?: number;
  notes: string;
  price: number;
  history?: AppointmentHistoryEntry[];
}

export interface AppointmentHistoryEntry {
  id: string;
  changedBy: string;
  changedAt: string;
  previousStatus: AppointmentStatus;
  nextStatus: AppointmentStatus;
  previousDate: string;
  previousTime: string;
  nextDate: string;
  nextTime: string;
  reason?: string;
}

export interface FinancialEntry {
  id: string;
  type: FinancialEntryType;
  appointmentId?: string;
  productId?: string;
  patientId?: string;
  procedure?: string;
  productName?: string;
  description: string;
  date: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: FinancialStatus;
  paymentMethod: string;
  paymentDate: string;
  installments?: number;
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
