import bcrypt from "bcryptjs";
import { PrismaClient, DriverType, LoadStatus, OrderStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const driverPassword = await bcrypt.hash("driver123", 10);

  const admin = await prisma.user.upsert({
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

  const driver = await prisma.driverProfile.upsert({
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

  const order = await prisma.order.upsert({
    where: { erpOrderNumber: "WIN-10001" },
    update: {},
    create: {
      erpOrderNumber: "WIN-10001",
      invoiceNumber: "NF-9001",
      customerCode: "CLI-001",
      customerName: "Supermercado Horizonte",
      city: "Campinas",
      state: "SP",
      address: "Av. das Industrias, 1000",
      totalValue: 12990.45,
      currentStatus: OrderStatus.ASSIGNED
    }
  });

  const load = await prisma.load.upsert({
    where: { code: "CG-2026-001" },
    update: {},
    create: {
      code: "CG-2026-001",
      title: "Carga Campinas",
      routeDescription: "Campinas e regiao",
      status: LoadStatus.OPEN,
      driverId: driver.id
    }
  });

  await prisma.loadOrder.upsert({
    where: { orderId: order.id },
    update: { loadId: load.id },
    create: {
      loadId: load.id,
      orderId: order.id,
      sequence: 1
    }
  });

  await prisma.statusHistory.create({
    data: {
      orderId: order.id,
      fromStatus: OrderStatus.IMPORTED,
      toStatus: OrderStatus.ASSIGNED,
      source: "SYSTEM",
      changedById: admin.id,
      notes: "Pedido vinculado a carga inicial."
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
