import { prisma } from "../../_prisma.js";
import { getSessionToken, verifySessionToken } from "../../auth/_utils.js";

const finalizedStatuses = ["Finalizado", "Concluído", "Realizado"];

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

function hasMedicalRecord(appointment) {
  return Boolean(
    appointment.attendanceClinicalNotes ||
      appointment.attendanceProcedureDescription ||
      appointment.attendanceStartedAt ||
      finalizedStatuses.includes(appointment.status)
  );
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

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      select: appointmentSelect,
      orderBy: [{ date: "desc" }, { time: "desc" }]
    });

    return json(res, 200, appointments.filter(hasMedicalRecord));
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível carregar o histórico de atendimentos." });
  }
}
