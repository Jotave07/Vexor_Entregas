import bcrypt from "bcryptjs";
import { PrismaClient, DriverType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const driverPassword = await bcrypt.hash("driver123", 10);

  await prisma.user.upsert({
    where: { email: "admin@vexor.com.br" },
    update: {},
    create: {
      name: "Administrador VEXOR",
      email: "admin@vexor.com.br",
      passwordHash: adminPassword,
      role: UserRole.ADMIN
    }
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "motorista@vexor.com.br" },
    update: {},
    create: {
      name: "Carlos Motorista",
      email: "motorista@vexor.com.br",
      passwordHash: driverPassword,
      role: UserRole.DRIVER
    }
  });

  await prisma.driverProfile.upsert({
    where: { document: "12345678900" },
    update: {},
    create: {
      userId: driverUser.id,
      fullName: "Carlos Motorista",
      document: "12345678900",
      phone: "(11) 98888-7777",
      vehicleType: "Truck",
      vehiclePlate: "ABC1D23",
      type: DriverType.AGGREGATED
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
