import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import http from "node:http";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(__dirname, "dist");
const apiDir = resolve(__dirname, "api");
const port = Number(process.env.PORT || process.env.APP_PORT || 8080);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const apiRoutes = [
  { pattern: /^\/api\/health\/?$/, file: "health.js" },
  { pattern: /^\/api\/clinic\/?$/, file: "clinic.js" },
  { pattern: /^\/api\/auth\/login\/?$/, file: "auth/login.js" },
  { pattern: /^\/api\/auth\/logout\/?$/, file: "auth/logout.js" },
  { pattern: /^\/api\/auth\/me\/?$/, file: "auth/me.js" },
  { pattern: /^\/api\/auth\/register\/?$/, file: "auth/register.js" },
  { pattern: /^\/api\/patients\/([^/]+)\/history\/?$/, file: "patients/[id]/history.js", param: "id" },
  {
    pattern: /^\/api\/patients\/([^/]+)\/attendance-history\/?$/,
    file: "patients/[id]/attendance-history.js",
    param: "id"
  },
  {
    pattern: /^\/api\/appointments\/([^/]+)\/medical-record\/?$/,
    file: "appointments/[id]/medical-record.js",
    param: "id"
  },
  { pattern: /^\/api\/appointments\/([^/]+)\/finalize\/?$/, file: "appointments/[id]/finalize.js", param: "id" },
  { pattern: /^\/api\/medical-records\/([^/]+)\/?$/, file: "medical-records/[id].js", param: "id" }
];

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

function resolveStaticPath(pathname) {
  const requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const safePath = normalize(requestedPath);
  if (safePath.startsWith("..") || safePath.includes("../") || safePath.includes("..\\")) return null;

  const absolutePath = resolve(join(distDir, safePath));

  if (!absolutePath.startsWith(distDir)) return null;
  if (existsSync(absolutePath) && statSync(absolutePath).isFile()) return absolutePath;

  return join(distDir, "index.html");
}

async function handleApi(req, res, pathname) {
  const route = apiRoutes.find((candidate) => candidate.pattern.test(pathname));
  if (!route) {
    sendJson(res, 404, { error: "Rota não encontrada." });
    return;
  }

  const match = pathname.match(route.pattern);
  req.query = route.param && match?.[1] ? { [route.param]: decodeURIComponent(match[1]) } : {};

  try {
    const moduleUrl = pathToFileURL(join(apiDir, route.file)).href;
    const handler = (await import(moduleUrl)).default;
    await handler(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendJson(res, 500, { error: "Não foi possível processar a requisição." });
    else res.end();
  }
}

function handleStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    res.statusCode = 403;
    res.end();
    return;
  }

  res.setHeader("Content-Type", mimeTypes[extname(filePath)] ?? "application/octet-stream");
  if (filePath.endsWith("index.html")) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }

  if (req.method === "HEAD") {
    res.statusCode = 200;
    res.end();
    return;
  }

  createReadStream(filePath)
    .on("error", () => sendJson(res, 404, { error: "Arquivo não encontrado." }))
    .pipe(res);
}

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (pathname.startsWith("/api/")) {
      void handleApi(req, res, pathname);
      return;
    }

    handleStatic(req, res, pathname);
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Stetic Soft ouvindo na porta ${port}`);
  });
