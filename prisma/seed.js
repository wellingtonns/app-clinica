import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD ?? "");

  if (!adminEmail || !adminPassword) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de executar o seed.");
  }

  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  }

  const password = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password },
    create: {
      name: "Administradora",
      email: adminEmail,
      password,
      role: "Administrador"
    }
  });

  if (process.env.SEED_SAMPLE_DATA !== "true") return;

  await prisma.professional.upsert({
    where: { id: "PRO-SEED-ANDRESSA" },
    update: {},
    create: {
      id: "PRO-SEED-ANDRESSA",
      name: "Dra Andressa",
      specialty: "Estetica facial",
      role: "Profissional",
      commissionRate: "30%",
      nextShift: "Segunda a sexta",
      phone: "",
      email: "",
      council: "",
      status: "Ativo"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
