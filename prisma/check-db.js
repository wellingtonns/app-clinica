import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, patients, professionals, appointments, products, financialEntries] = await Promise.all([
    prisma.user.count(),
    prisma.patient.count(),
    prisma.professional.count(),
    prisma.appointment.count(),
    prisma.product.count(),
    prisma.financialEntry.count()
  ]);

  console.log(
    JSON.stringify(
      {
        users,
        patients,
        professionals,
        appointments,
        products,
        financialEntries
      },
      null,
      2
    )
  );
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
