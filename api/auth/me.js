import { getSessionToken, json, prisma, publicUser, verifySessionToken } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Método não permitido." });
  }

  try {
    const payload = verifySessionToken(getSessionToken(req));
    if (!payload?.sub) return json(res, 401, { error: "Sessão não encontrada." });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) return json(res, 401, { error: "Sessão inválida." });

    return json(res, 200, { user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Não foi possível verificar a sessão." });
  }
}
