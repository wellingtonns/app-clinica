import {
  AnamnesisRecord,
  Appointment,
  ContractRecord,
  FinancialEntry,
  Patient,
  PatientFileRecord,
  PersistedClinicData,
  ProcedureRecord,
  Product,
  Professional
} from "../types";

const samplePdfDataUrl =
  "data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjUwIDkwIFRkCihDb250cmF0byBhc3NpbmFkbykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDExOCAwMDAwMCBuIAowMDAwMDAwMjQ0IDAwMDAwIG4gCjAwMDAwMDAzMzggMDAwMDAgbiAKdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiAvU2l6ZSA2ID4+CnN0YXJ0eHJlZgo0MDgKJSVFT0Y=";
const sampleImageDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMjIwIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIyMCIgZmlsbD0iI2UwZjJmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDglIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMGY3NjZlIj5Gb3RvIGNsaW5pY2E8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM0YjU1NjMiPkFudGVzIC8gRGVwb2lzPC90ZXh0Pjwvc3ZnPg==";

export const initialPatients: Patient[] = [
  {
    id: "PAT-001",
    fullName: "Mariana Costa",
    birthDate: "1991-08-14",
    cpf: "231.445.998-10",
    phone: "(11) 99876-2211",
    email: "mariana.costa@email.com",
    address: "Rua das Acacias, 120 - Sao Paulo/SP",
    generalObservations: "Paciente recorrente, prefere atendimentos no periodo da manha.",
    allergySummary: "Penicilina",
    restrictionSummary: "Evitar procedimentos com recuperacao longa.",
    status: "Ativo",
    createdAt: "2026-02-10T09:00:00",
    updatedAt: "2026-02-26T09:05:00"
  },
  {
    id: "PAT-002",
    fullName: "Renata Alves",
    birthDate: "1987-03-21",
    cpf: "",
    phone: "(11) 99111-0044",
    email: "renata.alves@email.com",
    address: "Alameda Santos, 980 - Sao Paulo/SP",
    generalObservations: "Primeira fase do plano de pele.",
    allergySummary: "Nenhuma relatada",
    restrictionSummary: "Sensibilidade cutanea moderada.",
    status: "Ativo",
    createdAt: "2026-02-18T11:10:00",
    updatedAt: "2026-02-27T14:20:00"
  },
  {
    id: "PAT-003",
    fullName: "Carlos Mendes",
    birthDate: "1983-11-05",
    cpf: "102.776.441-88",
    phone: "(11) 99770-1002",
    email: "carlos.mendes@email.com",
    address: "Av. Brasil, 440 - Campinas/SP",
    generalObservations: "Paciente premium em acompanhamento capilar.",
    allergySummary: "Nao relatada",
    restrictionSummary: "Hipertensao controlada.",
    status: "Ativo",
    createdAt: "2026-02-14T16:00:00",
    updatedAt: "2026-02-25T10:15:00"
  }
];

export const initialProducts: Product[] = [
  {
    id: "PRD-001",
    name: "Toxina botulinica 100U",
    category: "Injetaveis",
    sku: "BTX-100U",
    batch: "BTX-24A",
    expiry: "08/2026",
    price: 890,
    stock: 5,
    minimumStock: 8,
    unit: "frascos",
    unitCost: 890,
    purchaseDate: "2026-02-20",
    supplier: "Pharma Clinic",
    description: "Uso em protocolos faciais premium."
  },
  {
    id: "PRD-002",
    name: "Acido hialuronico 1ml",
    category: "Preenchimento",
    sku: "AH-1ML",
    batch: "AH-771",
    expiry: "11/2026",
    price: 420,
    stock: 18,
    minimumStock: 10,
    unit: "seringas",
    unitCost: 420,
    purchaseDate: "2026-02-20",
    supplier: "Derm Supply",
    description: "Produto de alta rotacao para harmonizacao."
  }
];

export const initialProfessionals: Professional[] = [
  {
    id: "PRO-001",
    name: "Dra. Julia Azevedo",
    specialty: "Dermatologia estetica",
    role: "Administrador",
    commissionRate: "18%",
    nextShift: "Hoje, 14:00-20:00",
    phone: "(11) 99888-2001",
    email: "julia.azevedo@clinicflow.pro",
    council: "CRM 123456-SP",
    status: "Ativo"
  },
  {
    id: "PRO-002",
    name: "Dr. Rafael Prado",
    specialty: "Tricologia",
    role: "Profissional",
    commissionRate: "22%",
    nextShift: "Hoje, 09:00-15:00",
    phone: "(11) 99777-1002",
    email: "rafael.prado@clinicflow.pro",
    council: "CRM 222888-SP",
    status: "Ativo"
  }
];

export const initialAnamneses: AnamnesisRecord[] = [
  {
    id: "ANA-001",
    patientId: "PAT-001",
    version: 1,
    createdAt: "2026-02-10T14:20:00",
    updatedAt: "2026-02-10T14:20:00",
    updatedBy: "Dra. Julia Azevedo",
    healthHistory: "Paciente sem intercorrencias recentes e acompanhamento clinico regular.",
    priorDiseases: "Alergia medicamentosa pregressa.",
    surgeries: "Nao relata cirurgias recentes.",
    treatments: "Skincare e acompanhamentos semestrais.",
    allergies: "Penicilina",
    medications: "Anticoncepcional oral",
    habits: "Sono regular, atividade fisica 5x na semana.",
    mainComplaint: "Linhas frontais e suavizacao da expressao.",
    professionalObservations: "Bom entendimento do plano, retorno em 15 dias.",
    checkboxes: {
      hasPriorDiseases: true,
      hasSurgeries: false,
      isUnderTreatment: true,
      hasAllergies: true,
      usesMedication: true,
      smokes: false,
      drinksAlcohol: true
    },
    attachments: [
      {
        id: "ASF-001",
        fileName: "exame-laboratorial.pdf",
        mimeType: "application/pdf",
        dataUrl: samplePdfDataUrl,
        uploadedAt: "2026-02-10T14:10:00",
        description: "Exame anexado na primeira consulta."
      }
    ]
  },
  {
    id: "ANA-002",
    patientId: "PAT-001",
    version: 2,
    createdAt: "2026-02-26T09:05:00",
    updatedAt: "2026-02-26T09:05:00",
    updatedBy: "Dra. Julia Azevedo",
    healthHistory: "Mantem quadro estavel e sem novas restricoes clinicas.",
    priorDiseases: "Sem novas doencas pregressas.",
    surgeries: "Nao relata.",
    treatments: "Preparacao pre procedimento facial.",
    allergies: "Penicilina",
    medications: "Anticoncepcional oral",
    habits: "Rotina alimentar equilibrada e sono controlado.",
    mainComplaint: "Rugas dinamicas e qualidade da pele.",
    professionalObservations: "Atualizacao pre procedimento com orientacao revisada.",
    checkboxes: {
      hasPriorDiseases: false,
      hasSurgeries: false,
      isUnderTreatment: true,
      hasAllergies: true,
      usesMedication: true,
      smokes: false,
      drinksAlcohol: true
    },
    attachments: []
  }
];

export const initialContracts: ContractRecord[] = [
  {
    id: "CON-001",
    patientId: "PAT-001",
    version: 1,
    contractType: "Termo de consentimento facial",
    signedAt: "2026-02-26",
    observations: "Contrato escaneado apos assinatura presencial.",
    uploadedAt: "2026-02-26T10:00:00",
    file: {
      id: "FCON-001",
      fileName: "contrato-mariana-v1.pdf",
      mimeType: "application/pdf",
      dataUrl: samplePdfDataUrl,
      uploadedAt: "2026-02-26T10:00:00",
      description: "Contrato assinado v1"
    }
  }
];

export const initialProcedures: ProcedureRecord[] = [
  {
    id: "PRC-001",
    patientId: "PAT-001",
    name: "Botox full face",
    procedureType: "Estetico",
    date: "2026-02-28",
    professionalId: "PRO-001",
    observations: "Aplicacao realizada sem intercorrencias.",
    photos: [
      {
        id: "PHO-001",
        fileName: "antes-mariana.svg",
        mimeType: "image/svg+xml",
        dataUrl: sampleImageDataUrl,
        uploadedAt: "2026-02-28T08:40:00",
        description: "Registro antes do procedimento.",
        category: "Antes",
        capturedAt: "2026-02-28",
        area: "Rosto"
      },
      {
        id: "PHO-002",
        fileName: "depois-mariana.svg",
        mimeType: "image/svg+xml",
        dataUrl: sampleImageDataUrl,
        uploadedAt: "2026-02-28T09:40:00",
        description: "Registro apos o procedimento.",
        category: "Depois",
        capturedAt: "2026-02-28",
        area: "Rosto"
      }
    ]
  }
];

export const initialPatientFiles: PatientFileRecord[] = [
  {
    id: "PFILE-001",
    patientId: "PAT-001",
    category: "Documento",
    description: "Documento de identidade anexado no cadastro.",
    file: {
      id: "PF-001",
      fileName: "documento-mariana.pdf",
      mimeType: "application/pdf",
      dataUrl: samplePdfDataUrl,
      uploadedAt: "2026-02-10T13:30:00",
      description: "Documento pessoal"
    }
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: "APT-001",
    patientId: "PAT-001",
    professionalId: "PRO-001",
    procedure: "Botox full face",
    date: "2026-02-28",
    time: "09:00",
    durationMinutes: 60,
    status: "Realizado",
    paymentStatus: "Pago",
    paymentMethod: "Cartao",
    paymentDate: "2026-02-28",
    paidAmount: 4800,
    installments: 1,
    notes: "Procedimento concluido sem intercorrencias.",
    price: 4800
  },
  {
    id: "APT-002",
    patientId: "PAT-002",
    professionalId: "PRO-001",
    procedure: "Limpeza de pele premium",
    date: "2026-02-28",
    time: "10:30",
    durationMinutes: 50,
    status: "Agendado",
    paymentStatus: "Pendente",
    paymentMethod: "",
    paymentDate: "",
    paidAmount: 0,
    installments: undefined,
    notes: "Confirmado por WhatsApp.",
    price: 420
  }
];

export const initialFinancialEntries: FinancialEntry[] = [
  {
    id: "FIN-001",
    type: "Receita",
    appointmentId: "APT-001",
    patientId: "PAT-001",
    procedure: "Botox full face",
    description: "Procedimento realizado",
    date: "2026-02-28",
    amount: 4800,
    paidAmount: 4800,
    balanceAmount: 0,
    status: "Pago",
    paymentMethod: "Cartao",
    paymentDate: "2026-02-28",
    installments: 1,
    source: "Procedimento realizado"
  }
];

export const initialClinicData: PersistedClinicData = {
  patients: initialPatients,
  products: initialProducts,
  professionals: initialProfessionals,
  anamneses: initialAnamneses,
  contracts: initialContracts,
  procedures: initialProcedures,
  patientFiles: initialPatientFiles,
  appointments: initialAppointments,
  financialEntries: initialFinancialEntries
};
