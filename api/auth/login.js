import {
  bcrypt,
  createSessionToken,
  isValidEmail,
  json,
  normalizeEmail,
  prisma,
  publicUser,
  readBody,
  setSessionCookie
} from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Método não permitido." });
  }

  try {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");

    if (!email || !password) {
      return json(res, 400, { error: "Informe e-mail e senha." });
    }

    if (!isValidEmail(email)) {
      return json(res, 400, { error: "E-mail ou senha inválidos." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const isPasswordValid = user?.password ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isPasswordValid) {
      return json(res, 401, { error: "E-mail ou senha inválidos." });
    }

    setSessionCookie(res, createSessionToken(user));
    return json(res, 200, { user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível entrar. Tente novamente." });
  }
}
