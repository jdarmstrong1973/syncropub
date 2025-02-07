// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.platform.createMany({
    data: [
      { name: 'Medium' },
      { name: 'LinkedIn' },
      { name: 'Substack' },
      { name: 'Zirkels' },
      { name: 'Bulb' },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });