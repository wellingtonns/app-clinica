import { put } from "@vercel/blob";
import { getSessionToken, verifySessionToken } from "../auth/_utils.js";

const allowedFolders = new Set(["anamneses", "contracts", "procedures", "patient-files"]);
const maxUploadSizeBytes = 3 * 1024 * 1024;

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

function sanitizePathPart(value, fallback) {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || fallback;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) return null;

  const isBase64 = Boolean(match[2]);
  const rawData = match[3] ?? "";
  const buffer = isBase64 ? Buffer.from(rawData, "base64") : Buffer.from(decodeURIComponent(rawData));

  return {
    mimeType: match[1] || "application/octet-stream",
    buffer
  };
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) return json(res, 401, { error: "Sessão não encontrada." });

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { error: "Método não permitido." });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json(res, 500, { error: "Blob não configurado. Conecte o store e configure BLOB_READ_WRITE_TOKEN." });
    }

    const body = await readBody(req);
    const parsed = parseDataUrl(body.dataUrl);
    const fileName = sanitizePathPart(body.fileName, "arquivo");
    const patientId = sanitizePathPart(body.patientId, "sem-paciente");
    const folder = allowedFolders.has(body.folder) ? body.folder : "patient-files";

    if (!parsed) return json(res, 400, { error: "Arquivo inválido." });
    if (parsed.buffer.byteLength > maxUploadSizeBytes) {
      return json(res, 413, { error: "Arquivo maior que 3 MB. Reduza o tamanho antes de enviar." });
    }

    const contentType = String(body.mimeType || parsed.mimeType || "application/octet-stream");
    const pathname = `patients/${patientId}/${folder}/${Date.now()}-${fileName}`;
    const blob = await put(pathname, parsed.buffer, {
      access: "private",
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 60 * 60 * 24 * 30
    });

    const fileUrl = `/api/blob/file?pathname=${encodeURIComponent(blob.pathname)}`;

    return json(res, 201, {
      id: `blob-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fileName: body.fileName || fileName,
      mimeType: contentType,
      dataUrl: fileUrl,
      uploadedAt: new Date().toISOString(),
      description: String(body.description ?? ""),
      blobPathname: blob.pathname,
      blobUrl: blob.url,
      blobDownloadUrl: `${fileUrl}&download=1`,
      storageProvider: "vercel-blob"
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível enviar o arquivo para o Blob." });
  }
}
