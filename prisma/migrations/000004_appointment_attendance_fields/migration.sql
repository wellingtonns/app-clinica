ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceStartedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceFinishedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceDurationMinutes" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceProcedureDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceProductsUsed" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceClinicalNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendancePostProcedureRecommendations" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceNextReturn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attendanceEvolution" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "Appointment_patientId_date_idx" ON "Appointment"("patientId", "date");
CREATE INDEX IF NOT EXISTS "Appointment_status_date_idx" ON "Appointment"("status", "date");
