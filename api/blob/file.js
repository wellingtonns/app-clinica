import { get } from "@vercel/blob";
import { Readable } from "node:stream";
import { getSessionToken, verifySessionToken } from "../auth/_utils.js";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

function getQuery(req, key) {
  if (typeof req.query?.[key] === "string") return req.query[key];
  const params = new URL(req.url, "http://localhost").searchParams;
  return params.get(key) ?? "";
}

function pipeBody(body, res) {
  if (!body) {
    res.end();
    return;
  }

  if (typeof body.pipe === "function") {
    body.pipe(res);
    return;
  }

  if (typeof body.getReader === "function") {
    Readable.fromWeb(body).pipe(res);
    return;
  }

  res.end(body);
}

export default async function handler(req, res) {
  try {
    const session = verifySessionToken(getSessionToken(req));
    if (!session?.sub) return json(res, 401, { error: "Sessão não encontrada." });

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return json(res, 405, { error: "Método não permitido." });
    }

    const pathname = getQuery(req, "pathname");
    if (!pathname || !pathname.startsWith("patients/")) {
      return json(res, 400, { error: "Arquivo não informado." });
    }

    const blob = await get(pathname, { access: "private" });
    if (!blob) return json(res, 404, { error: "Arquivo não encontrado." });

    const contentType = blob.contentType || "application/octet-stream";
    const disposition = getQuery(req, "download")
      ? `attachment; filename="${encodeURIComponent(pathname.split("/").pop() || "arquivo")}"`
      : "inline";

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", disposition);
    res.setHeader("Cache-Control", "private, max-age=300");
    if (blob.etag) res.setHeader("ETag", blob.etag);
    if (blob.size) res.setHeader("Content-Length", String(blob.size));

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    pipeBody(blob.body, res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível carregar o arquivo." });
  }
}
