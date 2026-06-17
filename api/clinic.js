import { prisma } from "./_prisma.js";
import { getSessionToken, verifySessionToken } from "./auth/_utils.js";
import {
  getClinicCache,
  getClinicCacheTtl,
  invalidateClinicCache,
  normalizeClinicScope,
  setClinicCache
} from "./_lib/clinicCache.js";

const globalForClinicCache = globalThis;
const clinicStateCacheTtlMs = 0;

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

function json(res, status, payload, cacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate") {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", cacheControl);
  res.end(JSON.stringify(payload));
}

function errorPayload(message, error, context = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    error: message,
    ...(isProduction
      ? {}
      : {
          debug: {
            ...context,
            code: error?.code,
            message: error?.message,
            meta: error?.meta
          }
        })
  };
}

function empty(res, status) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
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

function clinicScopeCollections(scope) {
  if (scope === "full") {
    return new Set(clinicStateCollections);
  }

  if (scope === "dashboard") {
    return new Set(["patients", "products", "professionals", "anamneses", "appointments", "financialEntries"]);
  }

  if (scope === "patients") {
    return new Set(["patients", "professionals", "anamneses", "contracts", "procedures", "medicalRecords"]);
  }

  if (scope === "patient-detail") {
    return new Set(["patients", "professionals", "anamneses", "contracts", "procedures", "patientFiles", "medicalRecords"]);
  }

  if (scope === "appointments") {
    return new Set(["patients", "professionals", "appointments", "medicalRecords"]);
  }

  if (scope === "finance") {
    return new Set(["patients", "products", "professionals", "appointments", "financialEntries"]);
  }

  if (scope === "products") {
    return new Set(["products"]);
  }

  if (scope === "professionals") {
    return new Set(["professionals"]);
  }

  return new Set(clinicStateCollections);
}

function isCollectionEnabled(collections, name) {
  return collections.has(name);
}

async function timedQuery(label, callback) {
  const startedAt = Date.now();
  try {
    return await callback();
  } finally {
    console.log(`[clinic:get] ${label} ${Date.now() - startedAt}ms`);
  }
}

async function getClinicState(options = {}) {
  const now = Date.now();
  const scope = options.scope ?? "all";

  if (scope !== "all" && scope !== "full") {
    return loadClinicStateFromDatabase(options);
  }

  if (clinicStateCache.data && clinicStateCache.expiresAt > now) {
    return clinicStateCache.data;
  }

  if (clinicStateCache.promise) {
    return clinicStateCache.promise;
  }

  clinicStateCache.promise = loadClinicStateFromDatabase(options)
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

async function loadClinicStateFromDatabase(options = {}) {
  const scope = options.scope ?? "all";
  const patientId = options.patientId ?? "";
  const collections = clinicScopeCollections(scope);
  const totalStartedAt = Date.now();
  console.log(`[clinic:get] total start scope=${scope}`);

  const patientWhere = scope === "patient-detail" && patientId ? { id: patientId } : undefined;
  const byPatientWhere = scope === "patient-detail" && patientId ? { patientId } : undefined;

  const result = await Promise.allSettled([
    isCollectionEnabled(collections, "patients")
      ? timedQuery("patients", () => prisma.patient.findMany({ where: patientWhere, select: patientSelect, orderBy: { fullName: "asc" } }))
      : Promise.resolve([]),
    isCollectionEnabled(collections, "products")
      ? timedQuery("products", () => prisma.product.findMany({ select: productSelect, orderBy: { name: "asc" } }))
      : Promise.resolve([]),
    isCollectionEnabled(collections, "professionals")
      ? timedQuery("professionals", () => prisma.professional.findMany({ select: professionalSelect, orderBy: { name: "asc" } }))
      : Promise.resolve([]),
    isCollectionEnabled(collections, "anamneses")
      ? timedQuery("anamneses", () =>
          prisma.anamnesisRecord.findMany({
            where: byPatientWhere,
            select: anamnesisSelect,
            orderBy: [{ patientId: "asc" }, { version: "asc" }]
          })
        )
      : Promise.resolve([]),
    isCollectionEnabled(collections, "contracts")
      ? timedQuery("contracts", () =>
          prisma.contractRecord.findMany({
            where: byPatientWhere,
            select: contractSelect,
            orderBy: [{ patientId: "asc" }, { version: "asc" }]
          })
        )
      : Promise.resolve([]),
    isCollectionEnabled(collections, "procedures")
      ? timedQuery("procedures", () =>
          prisma.procedureRecord.findMany({
            where: byPatientWhere,
            select: procedureSelect,
            orderBy: [{ date: "desc" }, { name: "asc" }]
          })
        )
      : Promise.resolve([]),
    isCollectionEnabled(collections, "patientFiles")
      ? timedQuery("patientFiles", () => prisma.patientFileRecord.findMany({ where: byPatientWhere, select: patientFileSelect, orderBy: { id: "asc" } }))
      : Promise.resolve([]),
    isCollectionEnabled(collections, "appointments")
      ? timedQuery("appointments", () => prisma.appointment.findMany({ select: appointmentSelect, orderBy: [{ date: "asc" }, { time: "asc" }] }))
      : Promise.resolve([]),
    isCollectionEnabled(collections, "medicalRecords")
      ? timedQuery("medicalRecords", () =>
          prisma.medicalRecord.findMany({
            where: byPatientWhere,
            select: medicalRecordSelect,
            orderBy: [{ date: "desc" }, { startedAt: "desc" }]
          })
        )
      : Promise.resolve([]),
    isCollectionEnabled(collections, "financialEntries")
      ? timedQuery("financialEntries", () => prisma.financialEntry.findMany({ select: financialEntrySelect, orderBy: [{ date: "desc" }, { description: "asc" }] }))
      : Promise.resolve([])
  ]);

  const collectionNames = [
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
  ] = result.map((item, index) => {
    if (item.status === "fulfilled") return item.value;

    console.error(`Falha ao carregar ${collectionNames[index]} do banco`, item.reason);
    return [];
  });

  const mappingStartedAt = Date.now();
  const state = {
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
  console.log(`[clinic:get] mapping ${Date.now() - mappingStartedAt}ms`);
  console.log(`[clinic:get] total ${Date.now() - totalStartedAt}ms scope=${scope}`);
  return state;
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

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toNullableInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function sanitizePatient(patient) {
  return {
    id: String(patient.id),
    fullName: String(patient.fullName ?? ""),
    birthDate: String(patient.birthDate ?? ""),
    cpf: String(patient.cpf ?? ""),
    phone: String(patient.phone ?? ""),
    email: String(patient.email ?? ""),
    address: String(patient.address ?? ""),
    generalObservations: String(patient.generalObservations ?? ""),
    allergySummary: String(patient.allergySummary ?? ""),
    restrictionSummary: String(patient.restrictionSummary ?? ""),
    status: String(patient.status ?? "Ativo"),
    createdAt: String(patient.createdAt ?? new Date().toISOString()),
    updatedAt: String(patient.updatedAt ?? new Date().toISOString())
  };
}

function sanitizeProfessional(professional) {
  return {
    id: String(professional.id),
    name: String(professional.name ?? ""),
    specialty: String(professional.specialty ?? ""),
    role: String(professional.role ?? "Profissional"),
    commissionRate: String(professional.commissionRate ?? ""),
    nextShift: String(professional.nextShift ?? ""),
    phone: String(professional.phone ?? ""),
    email: String(professional.email ?? ""),
    council: String(professional.council ?? ""),
    status: String(professional.status ?? "Ativo")
  };
}

function sanitizeProduct(product) {
  return {
    id: String(product.id),
    name: String(product.name ?? ""),
    category: String(product.category ?? ""),
    sku: String(product.sku ?? ""),
    batch: String(product.batch ?? ""),
    expiry: String(product.expiry ?? ""),
    price: toNumber(product.price),
    stock: toNumber(product.stock),
    minimumStock: toNumber(product.minimumStock),
    unit: String(product.unit ?? ""),
    unitCost: toNumber(product.unitCost),
    purchaseDate: String(product.purchaseDate ?? ""),
    supplier: String(product.supplier ?? ""),
    description: String(product.description ?? "")
  };
}

function sanitizeAppointment(appointment) {
  return {
    id: String(appointment.id),
    patientId: String(appointment.patientId),
    professionalId: String(appointment.professionalId),
    procedure: String(appointment.procedure ?? ""),
    date: String(appointment.date ?? ""),
    time: String(appointment.time ?? ""),
    originalDate: appointment.originalDate ?? null,
    originalTime: appointment.originalTime ?? null,
    rescheduleReason: appointment.rescheduleReason ?? null,
    isRescheduled: Boolean(appointment.isRescheduled),
    durationMinutes: toNumber(appointment.durationMinutes, 60),
    status: String(appointment.status ?? "Agendado"),
    paymentStatus: String(appointment.paymentStatus ?? "Pendente"),
    paymentMethod: String(appointment.paymentMethod ?? ""),
    paymentDate: String(appointment.paymentDate ?? ""),
    paidAmount: toNumber(appointment.paidAmount),
    installments: toNullableInt(appointment.installments),
    notes: String(appointment.notes ?? ""),
    price: toNumber(appointment.price),
    history: Array.isArray(appointment.history) ? appointment.history : [],
    attendanceStartedAt: String(appointment.attendanceStartedAt ?? ""),
    attendanceFinishedAt: String(appointment.attendanceFinishedAt ?? ""),
    attendanceDurationMinutes: toNullableInt(appointment.attendanceDurationMinutes),
    attendanceProcedureDescription: String(appointment.attendanceProcedureDescription ?? ""),
    attendanceProductsUsed: String(appointment.attendanceProductsUsed ?? ""),
    attendanceClinicalNotes: String(appointment.attendanceClinicalNotes ?? ""),
    attendancePostProcedureRecommendations: String(appointment.attendancePostProcedureRecommendations ?? ""),
    attendanceNextReturn: String(appointment.attendanceNextReturn ?? ""),
    attendanceEvolution: String(appointment.attendanceEvolution ?? "")
  };
}

function sanitizeFinancialEntry(entry) {
  return {
    id: String(entry.id),
    type: String(entry.type ?? "Receita"),
    appointmentId: entry.appointmentId ?? null,
    productId: entry.productId ?? null,
    patientId: entry.patientId ?? null,
    procedure: entry.procedure ?? null,
    productName: entry.productName ?? null,
    description: String(entry.description ?? ""),
    date: String(entry.date ?? ""),
    amount: toNumber(entry.amount),
    paidAmount: toNumber(entry.paidAmount),
    balanceAmount: toNumber(entry.balanceAmount),
    status: String(entry.status ?? "Pendente"),
    paymentMethod: String(entry.paymentMethod ?? ""),
    paymentDate: String(entry.paymentDate ?? ""),
    installments: toNullableInt(entry.installments),
    source: String(entry.source ?? "Lançamento manual")
  };
}

function sanitizeAnamnesis(record) {
  return {
    id: String(record.id),
    patientId: String(record.patientId),
    version: toNumber(record.version, 1),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
    updatedBy: String(record.updatedBy ?? ""),
    healthHistory: String(record.healthHistory ?? ""),
    priorDiseases: String(record.priorDiseases ?? ""),
    surgeries: String(record.surgeries ?? ""),
    treatments: String(record.treatments ?? ""),
    allergies: String(record.allergies ?? ""),
    medications: String(record.medications ?? ""),
    habits: String(record.habits ?? ""),
    mainComplaint: String(record.mainComplaint ?? ""),
    professionalObservations: String(record.professionalObservations ?? ""),
    checkboxes: record.checkboxes ?? {},
    attachments: Array.isArray(record.attachments) ? record.attachments : []
  };
}

function sanitizeContract(record) {
  return {
    id: String(record.id),
    patientId: String(record.patientId),
    version: toNumber(record.version, 1),
    contractType: String(record.contractType ?? ""),
    signedAt: String(record.signedAt ?? ""),
    observations: String(record.observations ?? ""),
    file: record.file ?? {},
    uploadedAt: String(record.uploadedAt ?? new Date().toISOString())
  };
}

function sanitizeProcedure(record) {
  return {
    id: String(record.id),
    patientId: String(record.patientId),
    name: String(record.name ?? ""),
    procedureType: String(record.procedureType ?? ""),
    date: String(record.date ?? ""),
    professionalId: record.professionalId || null,
    observations: String(record.observations ?? ""),
    photos: Array.isArray(record.photos) ? record.photos : []
  };
}

function sanitizePatientFile(record) {
  return {
    id: String(record.id),
    patientId: String(record.patientId),
    category: String(record.category ?? "Geral"),
    description: String(record.description ?? ""),
    file: record.file ?? {}
  };
}

function sanitizeMedicalRecord(record) {
  return {
    id: String(record.id),
    patientId: String(record.patientId),
    appointmentId: record.appointmentId ?? null,
    professionalId: record.professionalId ?? null,
    date: String(record.date ?? ""),
    scheduledTime: String(record.scheduledTime ?? ""),
    status: String(record.status ?? "Finalizado"),
    procedure: String(record.procedure ?? ""),
    startedAt: String(record.startedAt ?? ""),
    finishedAt: String(record.finishedAt ?? ""),
    durationMinutes: toNullableInt(record.durationMinutes),
    clinicalNotes: String(record.clinicalNotes ?? ""),
    recommendations: String(record.recommendations ?? ""),
    productsUsed: String(record.productsUsed ?? ""),
    nextReturn: String(record.nextReturn ?? ""),
    evolution: String(record.evolution ?? ""),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString())
  };
}

function getQuery(req, key) {
  if (typeof req.query?.[key] === "string") return req.query[key];
  const params = new URL(req.url, "http://localhost").searchParams;
  return params.get(key) ?? "";
}

function resolveClinicId(session) {
  return String(session?.clinicId ?? session?.clinic_id ?? session?.sub ?? "default");
}

function getRequestCacheScope(req) {
  const scope = normalizeClinicScope(getQuery(req, "scope") || "full");
  const patientId = getQuery(req, "id");
  return scope === "patient-detail" && patientId ? `patient-detail:${patientId}` : scope;
}

async function getClinicStateWithRedis(req, clinicId) {
  const scope = normalizeClinicScope(getQuery(req, "scope") || "full");
  const patientId = getQuery(req, "id");
  const cacheScope = getRequestCacheScope(req);
  const totalStartedAt = Date.now();
  console.log(`[clinic:get] total start scope=${cacheScope} clinicId=${clinicId}`);

  const redisStartedAt = Date.now();
  const cached = await getClinicCache(clinicId, cacheScope);
  console.log(`[clinic:get] redis ${Date.now() - redisStartedAt}ms scope=${cacheScope} clinicId=${clinicId} hit=${Boolean(cached)}`);

  if (cached) {
    console.log(`[clinic:get] total ${Date.now() - totalStartedAt}ms scope=${cacheScope} clinicId=${clinicId} source=redis`);
    return cached;
  }

  const databaseStartedAt = Date.now();
  const state = await getClinicState({ scope, patientId });
  console.log(`[clinic:get] database ${Date.now() - databaseStartedAt}ms scope=${cacheScope} clinicId=${clinicId}`);

  const redisSetStartedAt = Date.now();
  await setClinicCache(clinicId, cacheScope, state, getClinicCacheTtl(cacheScope));
  console.log(`[clinic:get] redis:set ${Date.now() - redisSetStartedAt}ms scope=${cacheScope} clinicId=${clinicId}`);
  console.log(`[clinic:get] total ${Date.now() - totalStartedAt}ms scope=${cacheScope} clinicId=${clinicId} source=database`);

  return state;
}

const resourceConfig = {
  patients: { model: "patient", sanitize: sanitizePatient },
  products: { model: "product", sanitize: sanitizeProduct },
  professionals: { model: "professional", sanitize: sanitizeProfessional },
  appointments: { model: "appointment", sanitize: sanitizeAppointment },
  anamneses: { model: "anamnesisRecord", sanitize: sanitizeAnamnesis },
  contracts: { model: "contractRecord", sanitize: sanitizeContract },
  procedures: { model: "procedureRecord", sanitize: sanitizeProcedure },
  patientFiles: { model: "patientFileRecord", sanitize: sanitizePatientFile },
  medicalRecords: { model: "medicalRecord", sanitize: sanitizeMedicalRecord },
  financialEntries: { model: "financialEntry", sanitize: sanitizeFinancialEntry }
};

function prismaErrorStatus(error) {
  if (error?.code === "P2025") return 404;
  if (error?.code === "P2003") return 409;
  return 500;
}

function prismaErrorMessage(error) {
  if (error?.code === "P2025") return "Registro não encontrado.";
  if (error?.code === "P2003") return "Este registro possui vínculos e não pode ser excluído.";
  return "Não foi possível persistir o registro.";
}

async function mutateResource(req, res, clinicId) {
  const resource = getQuery(req, "resource");
  const id = getQuery(req, "id");
  const config = resourceConfig[resource];

  if (!config) {
    return json(res, 400, { error: "Recurso inválido." });
  }

  try {
    if (req.method === "POST") {
      const body = await readBody(req);
      const created = await prisma[config.model].create({ data: config.sanitize(body) });
      clearClinicStateCache();
      await invalidateClinicCache(clinicId, resource, created);
      return json(res, 201, created);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const body = await readBody(req);
      const recordId = id || body.id;
      if (!recordId) return json(res, 400, { error: "Id não informado." });

      const data = config.sanitize({ ...body, id: recordId });
      delete data.id;

      const updated = await prisma[config.model].update({
        where: { id: String(recordId) },
        data
      });
      clearClinicStateCache();
      await invalidateClinicCache(clinicId, resource, updated);
      return json(res, 200, updated);
    }

    if (req.method === "DELETE") {
      if (!id) return json(res, 400, { error: "Id não informado." });

      const deleted = await prisma[config.model].delete({ where: { id: String(id) } });
      clearClinicStateCache();
      await invalidateClinicCache(clinicId, resource, deleted);
      return json(res, 200, { ok: true, id });
    }

    res.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE");
    return json(res, 405, { error: "Método não permitido." });
  } catch (error) {
    const status = prismaErrorStatus(error);
    console.error(`[clinic:${resource}:${req.method.toLowerCase()}] Failed to mutate resource`, {
      resource,
      id,
      error
    });
    return json(
      res,
      status,
      errorPayload(prismaErrorMessage(error), error, {
        endpoint: "/api/clinic",
        method: req.method,
        resource,
        id
      })
    );
  }
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

    const sanitizedPatients = patients.map(sanitizePatient);
    const sanitizedProfessionals = professionals.map(sanitizeProfessional);
    const sanitizedProducts = products.map(sanitizeProduct);
    const sanitizedAppointments = appointments.map(sanitizeAppointment);
    const sanitizedFinancialEntries = financialEntries.map(sanitizeFinancialEntry);

    await createMany(tx, "patient", sanitizedPatients);
    await createMany(tx, "professional", sanitizedProfessionals);
    await createMany(tx, "product", sanitizedProducts);
    await createMany(tx, "appointment", sanitizedAppointments);
    await createMany(tx, "payment", sanitizedAppointments.map(paymentFromAppointment));
    await createMany(tx, "financialEntry", sanitizedFinancialEntries);
    await createMany(tx, "stockMovement", sanitizedProducts.map(stockMovementFromProduct));
    await createMany(tx, "anamnesisRecord", anamneses.map(sanitizeAnamnesis));
    await createMany(tx, "contractRecord", contracts.map(sanitizeContract));
    await createMany(tx, "procedureRecord", procedures.map(sanitizeProcedure));
    await createMany(tx, "patientFileRecord", patientFiles.map(sanitizePatientFile));
    await createMany(tx, "medicalRecord", medicalRecords.map(sanitizeMedicalRecord));
  });
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) {
      return json(res, 401, { error: "Sessão não encontrada." });
    }

    const clinicId = resolveClinicId(session);

    if (getQuery(req, "resource")) {
      return mutateResource(req, res, clinicId);
    }

    if (req.method === "GET") {
      return json(res, 200, await getClinicStateWithRedis(req, clinicId));
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      if (!isCompleteClinicStatePayload(body)) {
        return json(res, 400, { error: "Payload de dados da clínica incompleto." });
      }

      try {
        await replaceClinicState(body);
      } catch (error) {
        console.error("[clinic:replace] Failed to persist clinic state", {
          collections: Object.fromEntries(clinicStateCollections.map((collection) => [collection, toArray(body[collection]).length])),
          error
        });
        return json(res, 500, errorPayload("Não foi possível salvar os dados da clínica.", error, { endpoint: "/api/clinic", method: "PUT" }));
      }

      clearClinicStateCache();
      await invalidateClinicCache(clinicId, "all");
      return empty(res, 204);
    }

    res.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE");
    return json(res, 405, { error: "Método não permitido." });
  } catch (error) {
    clearClinicStateCache();
    console.error("[clinic] Failed to process request", { method: req.method, error });
    return json(res, 500, errorPayload("Não foi possível acessar os dados da clínica.", error, { endpoint: "/api/clinic", method: req.method }));
  }
}
