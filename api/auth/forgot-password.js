import crypto from "node:crypto";
import { isValidEmail, json, normalizeEmail, prisma, readBody } from "./_utils.js";

const genericMessage = "Se existir uma conta com este e-mail, enviaremos as instrucoes para redefinir a senha.";

function appUrl() {
  if (!process.env.APP_URL) throw new Error("APP_URL nao configurado.");
  return process.env.APP_URL.replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

async function sendResetEmail({ email, name, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY ou EMAIL_FROM nao configurado.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Redefinicao de senha - SteticSoft",
      html: `<p>Ola, ${escapeHtml(name)}.</p><p>Recebemos uma solicitacao para redefinir sua senha.</p><p><a href="${escapeHtml(resetUrl)}">Redefinir minha senha</a></p><p>Este link expira em 30 minutos. Se voce nao fez esta solicitacao, ignore este e-mail.</p>`
    })
  });

  if (!response.ok) throw new Error(`Falha no envio do e-mail: ${response.status}`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Metodo nao permitido." });
  }

  try {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) return json(res, 200, { message: genericMessage });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
    if (!user) return json(res, 200, { message: genericMessage });

    const recentToken = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60_000) } },
      select: { id: true }
    });
    if (recentToken) return json(res, 200, { message: genericMessage });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetRecord = await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60_000) }
    });

    try {
      await sendResetEmail({
        email: user.email,
        name: user.name,
        resetUrl: `${appUrl()}/redefinir-senha?token=${encodeURIComponent(token)}`
      });
    } catch (error) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      console.error(error);
      return json(res, 200, { message: genericMessage });
    }

    return json(res, 200, { message: genericMessage });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Nao foi possivel enviar o e-mail agora. Tente novamente." });
  }
}
