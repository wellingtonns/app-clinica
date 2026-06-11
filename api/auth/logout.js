import { clearSessionCookie, json } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Método não permitido." });
  }

  clearSessionCookie(res);
  return json(res, 200, { message: "Sessão encerrada com sucesso." });
}
