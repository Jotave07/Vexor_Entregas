import { NextResponse } from "next/server";
import { z } from "zod";
import { IntegrationEventType, IntegrationProvider, OrderStatus } from "@prisma/client";
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
  metadataJson: z.record(z.any()).optional()
});

const payloadSchema = z.object({
  orders: z.array(importedOrderSchema)
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

  const operations = result.data.orders.map((order) =>
    prisma.order.upsert({
      where: { erpOrderNumber: order.erpOrderNumber },
      update: {
        ...order,
        invoiceDate: order.invoiceDate ? new Date(order.invoiceDate) : undefined,
        plannedDeliveryAt: order.plannedDeliveryAt ? new Date(order.plannedDeliveryAt) : undefined,
        currentStatus: OrderStatus.IMPORTED
      },
      create: {
        ...order,
        invoiceDate: order.invoiceDate ? new Date(order.invoiceDate) : undefined,
        plannedDeliveryAt: order.plannedDeliveryAt ? new Date(order.plannedDeliveryAt) : undefined,
        currentStatus: OrderStatus.IMPORTED
      }
    })
  );

  const imported = await prisma.$transaction(operations);

  await Promise.all(
    imported.map((order) =>
      createIntegrationEvent({
        provider: IntegrationProvider.WINTHOR,
        eventType: IntegrationEventType.ORDER_SYNCED,
        entityType: "order",
        entityId: order.id,
        correlationId: order.erpOrderNumber,
        payloadJson: {
          erpOrderNumber: order.erpOrderNumber,
          invoiceNumber: order.invoiceNumber,
          currentStatus: order.currentStatus
        }
      })
    )
  );

  return NextResponse.json({ imported: imported.length });
}
