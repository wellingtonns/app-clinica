import { prisma } from "./_prisma.js";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

export default async function handler(_req, res) {
  try {
    const checks = await Promise.allSettled([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.professional.count(),
      prisma.appointment.count(),
      prisma.product.count(),
      prisma.financialEntry.count(),
      prisma.anamnesisRecord.count(),
      prisma.contractRecord.count(),
      prisma.procedureRecord.count(),
      prisma.patientFileRecord.count(),
      prisma.medicalRecord.count()
    ]);
    const names = [
      "users",
      "patients",
      "professionals",
      "appointments",
      "products",
      "financialEntries",
      "anamneses",
      "contracts",
      "procedures",
      "patientFiles",
      "medicalRecords"
    ];
    const counts = Object.fromEntries(
      checks.map((check, index) => [names[index], check.status === "fulfilled" ? check.value : null])
    );
    const errors = Object.fromEntries(
      checks
        .map((check, index) => [names[index], check.status === "rejected" ? String(check.reason?.message ?? check.reason) : null])
        .filter(([, error]) => error)
    );

    return json(res, 200, {
      ok: Object.keys(errors).length === 0,
      database: "connected",
      counts,
      errors
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      ok: false,
      database: "error",
      message: "Não foi possível conectar ao banco."
    });
  }
}
