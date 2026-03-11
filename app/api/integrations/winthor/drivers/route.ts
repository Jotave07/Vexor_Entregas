import { NextResponse } from "next/server";
import { z } from "zod";
import { DriverStatus, DriverType, IntegrationEventType, IntegrationProvider } from "@prisma/client";
import { createIntegrationEvent, requireIntegrationToken } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

const importedDriverSchema = z.object({
  integrationRef: z.string(),
  fullName: z.string().min(3),
  document: z.string().min(11),
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  type: z.nativeEnum(DriverType).default(DriverType.AGGREGATED),
  status: z.nativeEnum(DriverStatus).default(DriverStatus.ACTIVE)
});

const payloadSchema = z.object({
  drivers: z.array(importedDriverSchema)
});

export async function POST(request: Request) {
  const authorized = await requireIntegrationToken("winthor");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integracao invalido." }, { status: 401 });
  }

  const body = await request.json();
  const result = payloadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const syncedDrivers = await prisma.$transaction(
    result.data.drivers.map((driver) =>
      prisma.driverProfile.upsert({
        where: { integrationRef: driver.integrationRef },
        update: {
          fullName: driver.fullName,
          document: driver.document,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehiclePlate: driver.vehiclePlate,
          type: driver.type,
          status: driver.status,
          syncedAt: new Date()
        },
        create: {
          integrationRef: driver.integrationRef,
          fullName: driver.fullName,
          document: driver.document,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehiclePlate: driver.vehiclePlate,
          type: driver.type,
          status: driver.status,
          syncedAt: new Date()
        }
      })
    )
  );

  await Promise.all(
    syncedDrivers.map((driver) =>
      createIntegrationEvent({
        provider: IntegrationProvider.WINTHOR,
        eventType: IntegrationEventType.DRIVER_SYNCED,
        entityType: "driver",
        entityId: driver.id,
        correlationId: driver.integrationRef ?? driver.document,
        payloadJson: {
          integrationRef: driver.integrationRef,
          fullName: driver.fullName,
          document: driver.document,
          status: driver.status
        }
      })
    )
  );

  return NextResponse.json({ synced: syncedDrivers.length });
}
