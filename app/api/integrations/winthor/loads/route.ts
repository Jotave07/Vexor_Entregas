import { NextResponse } from "next/server";
import { z } from "zod";
import { IntegrationEventType, IntegrationProvider, LoadStatus, OrderStatus, Prisma } from "@prisma/client";
import { createIntegrationEvent, requireIntegrationToken } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

const importedOrderSchema = z.object({
  erpOrderNumber: z.string(),
  invoiceNumber: z.string().optional(),
  customerCode: z.string().optional(),
  customerName: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  totalValue: z.number().optional(),
  invoiceDate: z.string().optional(),
  plannedDeliveryAt: z.string().optional(),
  currentStatus: z.nativeEnum(OrderStatus).optional(),
  metadataJson: z.record(z.any()).optional()
});

const importedLoadSchema = z.object({
  integrationRef: z.string(),
  code: z.string(),
  title: z.string(),
  routeDescription: z.string().optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().optional(),
  status: z.nativeEnum(LoadStatus).default(LoadStatus.OPEN),
  driverIntegrationRef: z.string().optional(),
  orders: z.array(importedOrderSchema).min(1)
});

const payloadSchema = z.object({
  loads: z.array(importedLoadSchema)
});

export async function POST(request: Request) {
  const authorized = await requireIntegrationToken("winthor");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integração inválido." }, { status: 401 });
  }

  const body = await request.json();
  const result = payloadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  try {
    const syncedLoads = await prisma.$transaction(async (tx) => {
      const processedLoads = [];

      for (const loadPayload of result.data.loads) {
        const driver = loadPayload.driverIntegrationRef
          ? await tx.driverProfile.findUnique({
              where: { integrationRef: loadPayload.driverIntegrationRef },
              select: { id: true }
            })
          : null;

        const existingLoad = await tx.load.findUnique({
          where: { integrationRef: loadPayload.integrationRef },
          select: { id: true }
        });

        const orders = [];

        for (const orderPayload of loadPayload.orders) {
          const order = await tx.order.upsert({
            where: { erpOrderNumber: orderPayload.erpOrderNumber },
            update: {
              invoiceNumber: orderPayload.invoiceNumber,
              customerCode: orderPayload.customerCode,
              customerName: orderPayload.customerName,
              city: orderPayload.city,
              state: orderPayload.state,
              address: orderPayload.address,
              totalValue: orderPayload.totalValue,
              invoiceDate: orderPayload.invoiceDate ? new Date(orderPayload.invoiceDate) : undefined,
              plannedDeliveryAt: orderPayload.plannedDeliveryAt ? new Date(orderPayload.plannedDeliveryAt) : undefined,
              currentStatus: orderPayload.currentStatus ?? OrderStatus.ASSIGNED,
              metadataJson: orderPayload.metadataJson
            },
            create: {
              erpOrderNumber: orderPayload.erpOrderNumber,
              invoiceNumber: orderPayload.invoiceNumber,
              customerCode: orderPayload.customerCode,
              customerName: orderPayload.customerName,
              city: orderPayload.city,
              state: orderPayload.state,
              address: orderPayload.address,
              totalValue: orderPayload.totalValue,
              invoiceDate: orderPayload.invoiceDate ? new Date(orderPayload.invoiceDate) : undefined,
              plannedDeliveryAt: orderPayload.plannedDeliveryAt ? new Date(orderPayload.plannedDeliveryAt) : undefined,
              currentStatus: orderPayload.currentStatus ?? OrderStatus.ASSIGNED,
              metadataJson: orderPayload.metadataJson
            }
          });

          orders.push(order);
        }

        let loadId = existingLoad?.id;

        if (!loadId) {
          const createdLoad = await tx.load.create({
            data: {
              integrationRef: loadPayload.integrationRef,
              code: loadPayload.code,
              title: loadPayload.title,
              routeDescription: loadPayload.routeDescription,
              notes: loadPayload.notes,
              scheduledDate: loadPayload.scheduledDate ? new Date(loadPayload.scheduledDate) : undefined,
              status: loadPayload.status,
              driverId: driver?.id
            },
            select: { id: true }
          });

          loadId = createdLoad.id;
        } else {
          await tx.load.update({
            where: { id: loadId },
            data: {
              code: loadPayload.code,
              title: loadPayload.title,
              routeDescription: loadPayload.routeDescription,
              notes: loadPayload.notes,
              scheduledDate: loadPayload.scheduledDate ? new Date(loadPayload.scheduledDate) : undefined,
              status: loadPayload.status,
              driverId: driver?.id
            }
          });

          await tx.loadOrder.deleteMany({
            where: { loadId }
          });
        }

        await tx.loadOrder.createMany({
          data: orders.map((order, index) => ({
            loadId,
            orderId: order.id,
            sequence: index + 1
          }))
        });

        const syncedLoad = await tx.load.findUniqueOrThrow({
          where: { id: loadId }
        });

        processedLoads.push(syncedLoad);
      }

      return processedLoads;
    });

    await Promise.all(
      syncedLoads.map((load) =>
        createIntegrationEvent({
          provider: IntegrationProvider.WINTHOR,
          eventType: IntegrationEventType.LOAD_CREATED,
          entityType: "load",
          entityId: load.id,
          correlationId: load.integrationRef ?? load.code,
          payloadJson: {
            integrationRef: load.integrationRef,
            code: load.code,
            status: load.status
          }
        })
      )
    );

    return NextResponse.json({ imported: syncedLoads.length });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Não foi possível sincronizar as cargas importadas." }, { status: 409 });
    }

    console.error("Erro ao sincronizar cargas do Winthor:", error);
    return NextResponse.json({ error: "Não foi possível processar a carga importada." }, { status: 500 });
  }
}
