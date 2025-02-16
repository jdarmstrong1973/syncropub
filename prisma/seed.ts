import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Notice we use lowercase 'platform' here
  await prisma.platform.createMany({
    data: [
      { name: 'Medium' },
      { name: 'LinkedIn' },
      // Add other platforms...
    ],
    skipDuplicates: true, // This ensures we don't error on duplicate platforms
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })