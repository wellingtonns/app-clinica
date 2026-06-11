-- Add indexes for the read patterns used by the Vite app and API routes.
-- These indexes do not change or remove existing data.

CREATE INDEX IF NOT EXISTS "Patient_fullName_idx" ON "Patient"("fullName");
CREATE INDEX IF NOT EXISTS "Patient_status_idx" ON "Patient"("status");
CREATE INDEX IF NOT EXISTS "Patient_updatedAt_idx" ON "Patient"("updatedAt");

CREATE INDEX IF NOT EXISTS "Professional_name_idx" ON "Professional"("name");
CREATE INDEX IF NOT EXISTS "Professional_specialty_idx" ON "Professional"("specialty");
CREATE INDEX IF NOT EXISTS "Professional_status_idx" ON "Professional"("status");

CREATE INDEX IF NOT EXISTS "FinancialEntry_date_description_idx" ON "FinancialEntry"("date", "description");
CREATE INDEX IF NOT EXISTS "FinancialEntry_status_date_idx" ON "FinancialEntry"("status", "date");
CREATE INDEX IF NOT EXISTS "FinancialEntry_paymentMethod_idx" ON "FinancialEntry"("paymentMethod");
CREATE INDEX IF NOT EXISTS "FinancialEntry_patientId_idx" ON "FinancialEntry"("patientId");

CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "Product"("name");
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "Product_purchaseDate_idx" ON "Product"("purchaseDate");

CREATE INDEX IF NOT EXISTS "StockMovement_productId_date_idx" ON "StockMovement"("productId", "date");

CREATE INDEX IF NOT EXISTS "AnamnesisRecord_patientId_version_idx" ON "AnamnesisRecord"("patientId", "version");
CREATE INDEX IF NOT EXISTS "ContractRecord_patientId_version_idx" ON "ContractRecord"("patientId", "version");

CREATE INDEX IF NOT EXISTS "ProcedureRecord_date_name_idx" ON "ProcedureRecord"("date", "name");
CREATE INDEX IF NOT EXISTS "ProcedureRecord_patientId_date_idx" ON "ProcedureRecord"("patientId", "date");
CREATE INDEX IF NOT EXISTS "ProcedureRecord_professionalId_date_idx" ON "ProcedureRecord"("professionalId", "date");

CREATE INDEX IF NOT EXISTS "PatientFileRecord_patientId_idx" ON "PatientFileRecord"("patientId");
CREATE INDEX IF NOT EXISTS "PatientFileRecord_category_idx" ON "PatientFileRecord"("category");
