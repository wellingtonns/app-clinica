import { prisma } from "../../_prisma.js";
import { getSessionToken, verifySessionToken } from "../../auth/_utils.js";
import { invalidateClinicCache } from "../../_lib/clinicCache.js";

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

function getId(req) {
  if (typeof req.query?.id === "string") return req.query.id;
  const parts = new URL(req.url, "http://localhost").pathname.split("/").filter(Boolean);
  return parts[parts.length - 2] ?? "";
}

function resolveClinicId(session) {
  return String(session?.clinicId ?? session?.clinic_id ?? session?.sub ?? "default");
}

function calculateDurationMinutes(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();
  if (Number.isNaN(started) || Number.isNaN(finished) || finished < started) return null;
  return Math.max(1, Math.round((finished - started) / 60000));
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) return json(res, 401, { error: "Sessão não encontrada." });

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { error: "Método não permitido." });
    }

    const appointmentId = getId(req);
    if (!appointmentId) return json(res, 400, { error: "Agendamento não informado." });

    const body = await readBody(req);
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    if (!appointment) return json(res, 404, { error: "Agendamento não encontrado." });

    const startedAt = body.startedAt || appointment.attendanceStartedAt || new Date().toISOString();
    const finishedAt = body.finishedAt || appointment.attendanceFinishedAt || new Date().toISOString();
    const durationMinutes = body.durationMinutes ?? calculateDurationMinutes(startedAt, finishedAt);
    const procedure = String(body.procedure ?? appointment.procedure ?? "").trim();
    const clinicalNotes = String(body.clinicalNotes ?? "").trim();

    if (!procedure || !clinicalNotes) {
      return json(res, 400, { error: "Informe procedimento e observações para finalizar o atendimento." });
    }

    const now = new Date().toISOString();
    const recordData = {
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      professionalId: appointment.professionalId || null,
      date: appointment.date,
      scheduledTime: appointment.time,
      status: "Finalizado",
      procedure,
      startedAt,
      finishedAt,
      durationMinutes,
      clinicalNotes,
      recommendations: String(body.recommendations ?? "").trim(),
      productsUsed: String(body.productsUsed ?? "").trim(),
      nextReturn: String(body.nextReturn ?? "").trim(),
      evolution: String(body.evolution ?? clinicalNotes).trim(),
      updatedAt: now
    };

    const result = await prisma.$transaction(async (tx) => {
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "Finalizado",
          attendanceStartedAt: startedAt,
          attendanceFinishedAt: finishedAt,
          attendanceDurationMinutes: durationMinutes,
          attendanceProcedureDescription: procedure,
          attendanceClinicalNotes: clinicalNotes,
          attendancePostProcedureRecommendations: recordData.recommendations,
          attendanceProductsUsed: recordData.productsUsed,
          attendanceNextReturn: recordData.nextReturn,
          attendanceEvolution: recordData.evolution
        }
      });

      const existingRecord = await tx.medicalRecord.findFirst({
        where: { appointmentId: appointment.id }
      });

      const medicalRecord = existingRecord
        ? await tx.medicalRecord.update({
            where: { id: existingRecord.id },
            data: recordData
          })
        : await tx.medicalRecord.create({
            data: {
              ...recordData,
              id: `MR-${appointment.id}`,
              createdAt: now
            }
          });

      return { appointment: updatedAppointment, medicalRecord };
    });

    await invalidateClinicCache(resolveClinicId(session), "medicalRecords", {
      patientId: result.medicalRecord.patientId
    });
    await invalidateClinicCache(resolveClinicId(session), "appointments", {
      patientId: result.medicalRecord.patientId
    });

    return json(res, 200, result);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível finalizar o atendimento." });
  }
}
