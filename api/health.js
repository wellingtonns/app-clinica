import { prisma } from "./_prisma.js";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

export default async function handler(_req, res) {
  try {
    const [users, patients, professionals, appointments, products, financialEntries] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.professional.count(),
      prisma.appointment.count(),
      prisma.product.count(),
      prisma.financialEntry.count()
    ]);

    return json(res, 200, {
      ok: true,
      database: "connected",
      counts: {
        users,
        patients,
        professionals,
        appointments,
        products,
        financialEntries
      }
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
