import crypto from "node:crypto";
import { bcrypt, json, prisma, readBody } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Metodo nao permitido." });
  }

  try {
    const body = await readBody(req);
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    if (!token || password.length < 8) {
      return json(res, 400, { error: "Informe um link valido e uma senha com pelo menos 8 caracteres." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return json(res, 400, { error: "Este link e invalido ou expirou. Solicite um novo." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: passwordHash } }),
      prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: new Date() }
      })
    ]);

    return json(res, 200, { message: "Senha redefinida com sucesso. Voce ja pode entrar." });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Nao foi possivel redefinir a senha. Tente novamente." });
  }
}
