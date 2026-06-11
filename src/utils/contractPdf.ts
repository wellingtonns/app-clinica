import { AnamnesisRecord, Patient, ProcedureRecord, StoredAsset } from "../types";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatDate(value: string) {
  if (!value) return "Não informado";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function buildContractLines(patient: Patient, anamnesis?: AnamnesisRecord, procedure?: ProcedureRecord) {
  const city = patient.address.split(",")[0]?.trim() || "Cidade";

  return [
    "Contrato de Atendimento e Consentimento",
    "",
    `Paciente: ${patient.fullName || "Não informado"}`,
    `Documento: ${patient.cpf || "Não informado"}`,
    `Telefone: ${patient.phone || "Não informado"}`,
    `E-mail: ${patient.email || "Não informado"}`,
    `Endereço: ${patient.address || "Não informado"}`,
    "",
    `Procedimento/servico: ${procedure?.name || procedure?.procedureType || "A definir"}`,
    `Data de referência: ${formatDate(procedure?.date || new Date().toISOString().slice(0, 10))}`,
    `Objetivo do paciente: ${anamnesis?.mainComplaint || "Não informado"}`,
    "",
    "Normas e regras:",
    "1. O paciente declara que as informações fornecidas são verdadeiras.",
    "2. O paciente esta ciente das orientacoes e cuidados antes e apos o atendimento.",
    "3. O comparecimento e a continuidade do tratamento dependem da avaliacao profissional.",
    "4. Em caso de intercorrências, o paciente deve comunicar a clínica imediatamente.",
    "",
    `Observações clínicas: ${anamnesis?.professionalObservations || "Sem observações adicionais."}`,
    "",
    `Local e data: ${city}, ${formatDate(new Date().toISOString().slice(0, 10))}`,
    "",
    "Assinatura do paciente: __________________________________________",
    "",
    "Assinatura do profissional: ______________________________________"
  ];
}

function buildPdfDataUri(lines: string[]) {
  const pageHeight = 842;
  const firstY = 790;
  const lineHeight = 20;
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 790 Td"
  ];

  let previousY = firstY;

  lines.forEach((line, index) => {
    const currentY = firstY - index * lineHeight;
    const delta = index === 0 ? 0 : previousY - currentY;
    if (index > 0) content.push(`0 -${delta} Td`);
    content.push(`(${escapePdfText(line)}) Tj`);
    previousY = currentY;
  });

  content.push("ET");

  const stream = content.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(pdf)))}`;
}

export function createGeneratedContractAsset(
  patient: Patient,
  anamnesis?: AnamnesisRecord,
  procedure?: ProcedureRecord
): StoredAsset {
  const generatedAt = new Date().toISOString();
  return {
    id: `generated-contract-${Date.now()}`,
    fileName: `contrato-${patient.fullName.toLowerCase().replace(/\s+/g, "-") || "paciente"}.pdf`,
    mimeType: "application/pdf",
    dataUrl: buildPdfDataUri(buildContractLines(patient, anamnesis, procedure)),
    uploadedAt: generatedAt,
    description: "Contrato gerado automaticamente"
  };
}
