import { prisma } from "./_prisma.js";
import { getSessionToken, verifySessionToken } from "./auth/_utils.js";

const globalForClinicCache = globalThis;
const clinicStateCacheTtlMs = 60 * 1000;

const clinicStateCache =
  globalForClinicCache.softSteticClinicStateCache ?? {
    data: null,
    expiresAt: 0,
    promise: null
  };

globalForClinicCache.softSteticClinicStateCache = clinicStateCache;

const clinicStateCollections = [
  "patients",
  "products",
  "professionals",
  "anamneses",
  "contracts",
  "procedures",
  "patientFiles",
  "appointments",
  "medicalRecords",
  "financialEntries"
];

function json(res, status, payload, cacheControl = "no-store, max-age=0") {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", cacheControl);
  res.end(JSON.stringify(payload));
}

function empty(res, status) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return;
    }

    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function isCompleteClinicStatePayload(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      clinicStateCollections.every((collection) => Array.isArray(value[collection]))
  );
}

const patientSelect = {
  id: true,
  fullName: true,
  birthDate: true,
  cpf: true,
  phone: true,
  email: true,
  address: true,
  generalObservations: true,
  allergySummary: true,
  restrictionSummary: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const productSelect = {
  id: true,
  name: true,
  category: true,
  sku: true,
  batch: true,
  expiry: true,
  price: true,
  stock: true,
  minimumStock: true,
  unit: true,
  unitCost: true,
  purchaseDate: true,
  supplier: true,
  description: true
};

const professionalSelect = {
  id: true,
  name: true,
  specialty: true,
  role: true,
  commissionRate: true,
  nextShift: true,
  phone: true,
  email: true,
  council: true,
  status: true
};

const appointmentSelect = {
  id: true,
  patientId: true,
  professionalId: true,
  procedure: true,
  date: true,
  time: true,
  originalDate: true,
  originalTime: true,
  rescheduleReason: true,
  isRescheduled: true,
  durationMinutes: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentDate: true,
  paidAmount: true,
  installments: true,
  notes: true,
  price: true,
  history: true,
  attendanceStartedAt: true,
  attendanceFinishedAt: true,
  attendanceDurationMinutes: true,
  attendanceProcedureDescription: true,
  attendanceProductsUsed: true,
  attendanceClinicalNotes: true,
  attendancePostProcedureRecommendations: true,
  attendanceNextReturn: true,
  attendanceEvolution: true
};

const financialEntrySelect = {
  id: true,
  type: true,
  appointmentId: true,
  productId: true,
  patientId: true,
  procedure: true,
  productName: true,
  description: true,
  date: true,
  amount: true,
  paidAmount: true,
  balanceAmount: true,
  status: true,
  paymentMethod: true,
  paymentDate: true,
  installments: true,
  source: true
};

const anamnesisSelect = {
  id: true,
  patientId: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
  healthHistory: true,
  priorDiseases: true,
  surgeries: true,
  treatments: true,
  allergies: true,
  medications: true,
  habits: true,
  mainComplaint: true,
  professionalObservations: true,
  checkboxes: true,
  attachments: true
};

const contractSelect = {
  id: true,
  patientId: true,
  version: true,
  contractType: true,
  signedAt: true,
  observations: true,
  file: true,
  uploadedAt: true
};

const procedureSelect = {
  id: true,
  patientId: true,
  name: true,
  procedureType: true,
  date: true,
  professionalId: true,
  observations: true,
  photos: true
};

const patientFileSelect = {
  id: true,
  patientId: true,
  category: true,
  description: true,
  file: true
};

const medicalRecordSelect = {
  id: true,
  patientId: true,
  appointmentId: true,
  professionalId: true,
  date: true,
  scheduledTime: true,
  status: true,
  procedure: true,
  startedAt: true,
  finishedAt: true,
  durationMinutes: true,
  clinicalNotes: true,
  recommendations: true,
  productsUsed: true,
  nextReturn: true,
  evolution: true,
  createdAt: true,
  updatedAt: true
};

function paymentFromAppointment(appointment) {
  const status = appointment.paymentStatus ?? "Pendente";
  const paidAmount = status === "Pago" ? appointment.price : status === "Parcial" ? appointment.paidAmount ?? 0 : 0;

  return {
    id: `PAY-${appointment.id}`,
    appointmentId: appointment.id,
    status,
    method: appointment.paymentMethod ?? "",
    paymentDate: appointment.paymentDate ?? "",
    amount: appointment.price ?? 0,
    paidAmount,
    balanceAmount: Math.max((appointment.price ?? 0) - paidAmount, 0),
    installments: appointment.installments ?? null
  };
}

function stockMovementFromProduct(product) {
  const quantity = product.stock ?? 0;
  const unitCost = product.unitCost ?? 0;

  return {
    id: `STK-${product.id}`,
    productId: product.id,
    type: "Entrada",
    quantity,
    unitCost,
    totalCost: quantity * unitCost,
    date: product.purchaseDate || new Date().toISOString().slice(0, 10),
    description: `Estoque atual: ${product.name}`
  };
}

async function getClinicState() {
  const now = Date.now();

  if (clinicStateCache.data && clinicStateCache.expiresAt > now) {
    return clinicStateCache.data;
  }

  if (clinicStateCache.promise) {
    return clinicStateCache.promise;
  }

  clinicStateCache.promise = loadClinicStateFromDatabase()
    .then((state) => {
      clinicStateCache.data = state;
      clinicStateCache.expiresAt = Date.now() + clinicStateCacheTtlMs;
      return state;
    })
    .finally(() => {
      clinicStateCache.promise = null;
    });

  return clinicStateCache.promise;
}

async function loadClinicStateFromDatabase() {
  const [
    patients,
    products,
    professionals,
    anamneses,
    contracts,
    procedures,
    patientFiles,
    appointments,
    medicalRecords,
    financialEntries
  ] = await Promise.all([
    prisma.patient.findMany({ select: patientSelect, orderBy: { fullName: "asc" } }),
    prisma.product.findMany({ select: productSelect, orderBy: { name: "asc" } }),
    prisma.professional.findMany({ select: professionalSelect, orderBy: { name: "asc" } }),
    prisma.anamnesisRecord.findMany({ select: anamnesisSelect, orderBy: [{ patientId: "asc" }, { version: "asc" }] }),
    prisma.contractRecord.findMany({ select: contractSelect, orderBy: [{ patientId: "asc" }, { version: "asc" }] }),
    prisma.procedureRecord.findMany({ select: procedureSelect, orderBy: [{ date: "desc" }, { name: "asc" }] }),
    prisma.patientFileRecord.findMany({ select: patientFileSelect, orderBy: { id: "asc" } }),
    prisma.appointment.findMany({ select: appointmentSelect, orderBy: [{ date: "asc" }, { time: "asc" }] }),
    prisma.medicalRecord.findMany({ select: medicalRecordSelect, orderBy: [{ date: "desc" }, { startedAt: "desc" }] }),
    prisma.financialEntry.findMany({ select: financialEntrySelect, orderBy: [{ date: "desc" }, { description: "asc" }] })
  ]);

  return {
    patients,
    products,
    professionals,
    anamneses,
    contracts,
    procedures: procedures.map((procedure) => ({
      ...procedure,
      professionalId: procedure.professionalId ?? ""
    })),
    patientFiles,
    appointments,
    medicalRecords: medicalRecords.map((record) => ({
      ...record,
      appointmentId: record.appointmentId ?? undefined,
      professionalId: record.professionalId ?? undefined
    })),
    financialEntries
  };
}

function updateClinicStateCache(state) {
  clinicStateCache.data = state;
  clinicStateCache.expiresAt = Date.now() + clinicStateCacheTtlMs;
  clinicStateCache.promise = null;
}

function clearClinicStateCache() {
  clinicStateCache.data = null;
  clinicStateCache.expiresAt = 0;
  clinicStateCache.promise = null;
}

async function createMany(tx, model, data) {
  if (!data.length) return;
  await tx[model].createMany({ data });
}

async function replaceClinicState(state) {
  const patients = toArray(state.patients);
  const products = toArray(state.products);
  const professionals = toArray(state.professionals);
  const appointments = toArray(state.appointments);
  const financialEntries = toArray(state.financialEntries);
  const anamneses = toArray(state.anamneses);
  const contracts = toArray(state.contracts);
  const procedures = toArray(state.procedures);
  const patientFiles = toArray(state.patientFiles);
  const medicalRecords = toArray(state.medicalRecords);

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany();
    await tx.financialEntry.deleteMany();
    await tx.payment.deleteMany();
    await tx.medicalRecord.deleteMany();
    await tx.appointment.deleteMany();
    await tx.patientFileRecord.deleteMany();
    await tx.procedureRecord.deleteMany();
    await tx.contractRecord.deleteMany();
    await tx.anamnesisRecord.deleteMany();
    await tx.product.deleteMany();
    await tx.professional.deleteMany();
    await tx.patient.deleteMany();

    await createMany(tx, "patient", patients);
    await createMany(tx, "professional", professionals);
    await createMany(tx, "product", products);
    await createMany(
      tx,
      "appointment",
      appointments.map((appointment) => ({
        ...appointment,
        paymentStatus: appointment.paymentStatus ?? "Pendente",
        paymentMethod: appointment.paymentMethod ?? "",
        paymentDate: appointment.paymentDate ?? "",
        paidAmount: appointment.paidAmount ?? 0,
        installments: appointment.installments ?? null,
        originalDate: appointment.originalDate ?? null,
        originalTime: appointment.originalTime ?? null,
        rescheduleReason: appointment.rescheduleReason ?? null,
        isRescheduled: Boolean(appointment.isRescheduled),
        history: appointment.history ?? [],
        attendanceStartedAt: appointment.attendanceStartedAt ?? "",
        attendanceFinishedAt: appointment.attendanceFinishedAt ?? "",
        attendanceDurationMinutes: appointment.attendanceDurationMinutes ?? null,
        attendanceProcedureDescription: appointment.attendanceProcedureDescription ?? "",
        attendanceProductsUsed: appointment.attendanceProductsUsed ?? "",
        attendanceClinicalNotes: appointment.attendanceClinicalNotes ?? "",
        attendancePostProcedureRecommendations: appointment.attendancePostProcedureRecommendations ?? "",
        attendanceNextReturn: appointment.attendanceNextReturn ?? "",
        attendanceEvolution: appointment.attendanceEvolution ?? ""
      }))
    );
    await createMany(tx, "payment", appointments.map(paymentFromAppointment));
    await createMany(
      tx,
      "financialEntry",
      financialEntries.map((entry) => ({
        ...entry,
        appointmentId: entry.appointmentId ?? null,
        productId: entry.productId ?? null,
        patientId: entry.patientId ?? null,
        procedure: entry.procedure ?? null,
        productName: entry.productName ?? null,
        installments: entry.installments ?? null
      }))
    );
    await createMany(tx, "stockMovement", products.map(stockMovementFromProduct));
    await createMany(
      tx,
      "anamnesisRecord",
      anamneses.map((record) => ({
        ...record,
        checkboxes: record.checkboxes ?? {},
        attachments: record.attachments ?? []
      }))
    );
    await createMany(
      tx,
      "contractRecord",
      contracts.map((record) => ({
        ...record,
        file: record.file ?? {}
      }))
    );
    await createMany(
      tx,
      "procedureRecord",
      procedures.map((record) => ({
        ...record,
        professionalId: record.professionalId || null,
        photos: record.photos ?? []
      }))
    );
    await createMany(
      tx,
      "patientFileRecord",
      patientFiles.map((record) => ({
        ...record,
        file: record.file ?? {}
      }))
    );
    await createMany(
      tx,
      "medicalRecord",
      medicalRecords.map((record) => ({
        id: record.id,
        patientId: record.patientId,
        appointmentId: record.appointmentId ?? null,
        professionalId: record.professionalId ?? null,
        date: record.date,
        scheduledTime: record.scheduledTime ?? "",
        status: record.status ?? "Finalizado",
        procedure: record.procedure ?? "",
        startedAt: record.startedAt ?? "",
        finishedAt: record.finishedAt ?? "",
        durationMinutes: record.durationMinutes ?? null,
        clinicalNotes: record.clinicalNotes ?? "",
        recommendations: record.recommendations ?? "",
        productsUsed: record.productsUsed ?? "",
        nextReturn: record.nextReturn ?? "",
        evolution: record.evolution ?? "",
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }))
    );
  });
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) {
      return json(res, 401, { error: "Sessão não encontrada." });
    }

    if (req.method === "GET") {
      return json(res, 200, await getClinicState(), "private, max-age=15, stale-while-revalidate=60");
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      if (!isCompleteClinicStatePayload(body)) {
        return json(res, 400, { error: "Payload de dados da clínica incompleto." });
      }

      await replaceClinicState(body);
      updateClinicStateCache(body);
      return empty(res, 204);
    }

    res.setHeader("Allow", "GET, PUT");
    return json(res, 405, { error: "Método não permitido." });
  } catch (error) {
    clearClinicStateCache();
    console.error(error);
    return json(res, 500, { error: "Não foi possível acessar os dados da clínica." });
  }
}
