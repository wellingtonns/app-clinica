import { prisma } from "../../_prisma.js";
import { getSessionToken, verifySessionToken } from "../../auth/_utils.js";

const appointmentSelect = {
  id: true,
  patientId: true,
  professionalId: true,
  procedure: true,
  date: true,
  time: true,
  durationMinutes: true,
  status: true,
  notes: true,
  attendanceStartedAt: true,
  attendanceFinishedAt: true,
  attendanceDurationMinutes: true,
  attendanceProcedureDescription: true,
  attendanceProductsUsed: true,
  attendanceClinicalNotes: true,
  attendancePostProcedureRecommendations: true,
  attendanceNextReturn: true,
  attendanceEvolution: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      cpf: true,
      phone: true,
      email: true
    }
  },
  professional: {
    select: {
      id: true,
      name: true,
      specialty: true,
      role: true
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
  const pathname = new URL(req.url, "http://localhost").pathname;
  const parts = pathname.split("/").filter(Boolean);
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

    const appointmentId = getId(req);
    if (!appointmentId) return json(res, 400, { error: "Agendamento não informado." });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: appointmentSelect
    });

    if (!appointment) return json(res, 404, { error: "Prontuário não encontrado." });

    return json(res, 200, appointment);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível carregar o prontuário." });
  }
}
