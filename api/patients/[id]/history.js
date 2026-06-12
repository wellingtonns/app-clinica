import { prisma } from "../../_prisma.js";
import { getSessionToken, verifySessionToken } from "../../auth/_utils.js";

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
  updatedAt: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      cpf: true,
      phone: true,
      email: true
    }
  }
};

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

function getId(req) {
  if (typeof req.query?.id === "string") return req.query.id;
  const parts = new URL(req.url, "http://localhost").pathname.split("/").filter(Boolean);
  return parts[parts.length - 2] ?? "";
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) return json(res, 401, { error: "Sessão não encontrada." });

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return json(res, 405, { error: "Método não permitido." });
    }

    const patientId = getId(req);
    if (!patientId) return json(res, 400, { error: "Paciente não informado." });

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      select: medicalRecordSelect,
      orderBy: [{ date: "desc" }, { startedAt: "desc" }]
    });

    return json(res, 200, records);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível carregar o histórico do paciente." });
  }
}
