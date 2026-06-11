-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Administrador',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL DEFAULT '',
    "cpf" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "generalObservations" TEXT NOT NULL DEFAULT '',
    "allergySummary" TEXT NOT NULL DEFAULT '',
    "restrictionSummary" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'Profissional',
    "commissionRate" TEXT NOT NULL DEFAULT '',
    "nextShift" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "council" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Ativo',

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "procedure" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "originalDate" TEXT,
    "originalTime" TEXT,
    "rescheduleReason" TEXT,
    "isRescheduled" BOOLEAN NOT NULL DEFAULT false,
    "durationMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pendente',
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paymentDate" TEXT NOT NULL DEFAULT '',
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installments" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "history" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT '',
    "paymentDate" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installments" INTEGER,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "appointmentId" TEXT,
    "productId" TEXT,
    "patientId" TEXT,
    "procedure" TEXT,
    "productName" TEXT,
    "description" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "installments" INTEGER,
    "source" TEXT NOT NULL,

    CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "batch" TEXT NOT NULL DEFAULT '',
    "expiry" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '',
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseDate" TEXT NOT NULL DEFAULT '',
    "supplier" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnamnesisRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "healthHistory" TEXT NOT NULL DEFAULT '',
    "priorDiseases" TEXT NOT NULL DEFAULT '',
    "surgeries" TEXT NOT NULL DEFAULT '',
    "treatments" TEXT NOT NULL DEFAULT '',
    "allergies" TEXT NOT NULL DEFAULT '',
    "medications" TEXT NOT NULL DEFAULT '',
    "habits" TEXT NOT NULL DEFAULT '',
    "mainComplaint" TEXT NOT NULL DEFAULT '',
    "professionalObservations" TEXT NOT NULL DEFAULT '',
    "checkboxes" JSONB NOT NULL DEFAULT '{}',
    "attachments" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "AnamnesisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT '',
    "signedAt" TEXT NOT NULL DEFAULT '',
    "observations" TEXT NOT NULL DEFAULT '',
    "file" JSONB NOT NULL,
    "uploadedAt" TEXT NOT NULL,

    CONSTRAINT "ContractRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "professionalId" TEXT,
    "observations" TEXT NOT NULL DEFAULT '',
    "photos" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ProcedureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientFileRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "file" JSONB NOT NULL,

    CONSTRAINT "PatientFileRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Appointment_date_time_idx" ON "Appointment"("date", "time");

-- CreateIndex
CREATE INDEX "Appointment_professionalId_date_idx" ON "Appointment"("professionalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_appointmentId_key" ON "Payment"("appointmentId");

-- CreateIndex
CREATE INDEX "FinancialEntry_type_date_idx" ON "FinancialEntry"("type", "date");

-- CreateIndex
CREATE INDEX "FinancialEntry_appointmentId_idx" ON "FinancialEntry"("appointmentId");

-- CreateIndex
CREATE INDEX "FinancialEntry_productId_idx" ON "FinancialEntry"("productId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnamnesisRecord" ADD CONSTRAINT "AnamnesisRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRecord" ADD CONSTRAINT "ContractRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientFileRecord" ADD CONSTRAINT "PatientFileRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

