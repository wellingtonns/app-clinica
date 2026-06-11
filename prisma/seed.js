import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@softstetic.local" },
    update: {},
    create: {
      name: "Administradora",
      email: "admin@softstetic.local",
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
