import { prisma } from "../_prisma.js";
import { getSessionToken, verifySessionToken } from "../auth/_utils.js";

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
  return parts[parts.length - 1] ?? "";
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) return json(res, 401, { error: "Sessão não encontrada." });

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return json(res, 405, { error: "Método não permitido." });
    }

    const id = getId(req);
    if (!id) return json(res, 400, { error: "Prontuário não informado." });

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      select: medicalRecordSelect
    });

    if (!record) return json(res, 404, { error: "Prontuário não encontrado." });

    return json(res, 200, record);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível carregar o prontuário." });
  }
}
