CREATE TABLE IF NOT EXISTS "MedicalRecord" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "professionalId" TEXT,
  "date" TEXT NOT NULL,
  "scheduledTime" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Finalizado',
  "procedure" TEXT NOT NULL,
  "startedAt" TEXT NOT NULL DEFAULT '',
  "finishedAt" TEXT NOT NULL DEFAULT '',
  "durationMinutes" INTEGER,
  "clinicalNotes" TEXT NOT NULL DEFAULT '',
  "recommendations" TEXT NOT NULL DEFAULT '',
  "productsUsed" TEXT NOT NULL DEFAULT '',
  "nextReturn" TEXT NOT NULL DEFAULT '',
  "evolution" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,

  CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicalRecord"
  ADD CONSTRAINT "MedicalRecord_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicalRecord"
  ADD CONSTRAINT "MedicalRecord_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "MedicalRecord_patientId_date_idx" ON "MedicalRecord"("patientId", "date");
CREATE INDEX IF NOT EXISTS "MedicalRecord_appointmentId_idx" ON "MedicalRecord"("appointmentId");
CREATE INDEX IF NOT EXISTS "MedicalRecord_professionalId_idx" ON "MedicalRecord"("professionalId");

INSERT INTO "MedicalRecord" (
  "id",
  "patientId",
  "appointmentId",
  "professionalId",
  "date",
  "scheduledTime",
  "status",
  "procedure",
  "startedAt",
  "finishedAt",
  "durationMinutes",
  "clinicalNotes",
  "recommendations",
  "productsUsed",
  "nextReturn",
  "evolution",
  "createdAt",
  "updatedAt"
)
SELECT
  'MR-' || "id",
  "patientId",
  "id",
  "professionalId",
  "date",
  "time",
  "status",
  COALESCE(NULLIF("attendanceProcedureDescription", ''), "procedure"),
  "attendanceStartedAt",
  "attendanceFinishedAt",
  "attendanceDurationMinutes",
  "attendanceClinicalNotes",
  "attendancePostProcedureRecommendations",
  "attendanceProductsUsed",
  "attendanceNextReturn",
  "attendanceEvolution",
  COALESCE(NULLIF("attendanceFinishedAt", ''), NULLIF("attendanceStartedAt", ''), "date"),
  COALESCE(NULLIF("attendanceFinishedAt", ''), NULLIF("attendanceStartedAt", ''), "date")
FROM "Appointment"
WHERE
  (
    "status" IN ('Finalizado', 'Concluído', 'Realizado')
    OR "attendanceClinicalNotes" <> ''
    OR "attendanceProcedureDescription" <> ''
    OR "attendanceStartedAt" <> ''
  )
  AND NOT EXISTS (
    SELECT 1 FROM "MedicalRecord" WHERE "MedicalRecord"."appointmentId" = "Appointment"."id"
  );
