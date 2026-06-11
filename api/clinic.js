import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.softSteticPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.softSteticPrisma = prisma;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
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
  const [
    patients,
    products,
    professionals,
    anamneses,
    contracts,
    procedures,
    patientFiles,
    appointments,
    financialEntries
  ] = await Promise.all([
    prisma.patient.findMany({ orderBy: { fullName: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.professional.findMany({ orderBy: { name: "asc" } }),
    prisma.anamnesisRecord.findMany({ orderBy: [{ patientId: "asc" }, { version: "asc" }] }),
    prisma.contractRecord.findMany({ orderBy: [{ patientId: "asc" }, { version: "asc" }] }),
    prisma.procedureRecord.findMany({ orderBy: [{ date: "desc" }, { name: "asc" }] }),
    prisma.patientFileRecord.findMany({ orderBy: { id: "asc" } }),
    prisma.appointment.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }),
    prisma.financialEntry.findMany({ orderBy: [{ date: "desc" }, { description: "asc" }] })
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
    financialEntries
  };
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

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany();
    await tx.financialEntry.deleteMany();
    await tx.payment.deleteMany();
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
        history: appointment.history ?? []
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
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return json(res, 200, await getClinicState());
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      await replaceClinicState(body);
      return json(res, 200, await getClinicState());
    }

    res.setHeader("Allow", "GET, PUT");
    return json(res, 405, { error: "Método não permitido." });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível acessar os dados da clínica." });
  }
}
