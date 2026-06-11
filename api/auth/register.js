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
    const name = String(body.name ?? "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return json(res, 400, { error: "Preencha todos os campos obrigatórios." });
    }

    if (!isValidEmail(email)) {
      return json(res, 400, { error: "Informe um e-mail válido." });
    }

    if (password.length < 6) {
      return json(res, 400, { error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return json(res, 409, { error: "Já existe uma conta com este e-mail." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    setSessionCookie(res, createSessionToken(user));
    return json(res, 201, { user: publicUser(user), message: "Cadastro realizado com sucesso." });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível criar a conta. Tente novamente." });
  }
}
