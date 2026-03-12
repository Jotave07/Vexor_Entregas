import { NextResponse } from "next/server";
import { z } from "zod";
import { IntegrationEventType, IntegrationProvider, OrderStatus } from "@prisma/client";
import { createIntegrationEvent, requireIntegrationToken } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

const importedOrderSchema = z.object({
  erpOrderNumber: z.string(),
  integrationRef: z.string().optional(),
  invoiceNumber: z.string().optional(),
  customerCode: z.string().optional(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  customerWhatsapp: z.string().optional(),
  allowWhatsapp: z.boolean().optional(),
  allowSms: z.boolean().optional(),
  recipientName: z.string().optional(),
  recipientDocument: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  totalValue: z.number().optional(),
  invoiceDate: z.string().optional(),
  plannedDeliveryAt: z.string().optional(),
  isBilled: z.boolean().optional(),
  isOpen: z.boolean().optional(),
  winthorStatus: z.string().optional(),
  assignedDriverDocument: z.string().optional(),
  assignedDriverName: z.string().optional(),
  assignedAt: z.string().optional(),
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

  const imported = await prisma.$transaction(async (tx) => {
    const orders = [];

    for (const order of result.data.orders) {
      const customer = order.customerCode || order.customerName
        ? await tx.customer.upsert({
            where: {
              customerCode: order.customerCode ?? `cliente-${order.erpOrderNumber}`
            },
            update: {
              name: order.customerName,
              phone: order.customerPhone,
              whatsapp: order.customerWhatsapp,
              allowWhatsapp: order.allowWhatsapp ?? false,
              allowSms: order.allowSms ?? false
            },
            create: {
              customerCode: order.customerCode ?? `cliente-${order.erpOrderNumber}`,
              name: order.customerName,
              phone: order.customerPhone,
              whatsapp: order.customerWhatsapp,
              allowWhatsapp: order.allowWhatsapp ?? false,
              allowSms: order.allowSms ?? false
            }
          })
        : null;

      const savedOrder = await tx.order.upsert({
        where: { erpOrderNumber: order.erpOrderNumber },
        update: {
          integrationRef: order.integrationRef,
          invoiceNumber: order.invoiceNumber,
          customerId: customer?.id,
          customerCode: order.customerCode,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerWhatsapp: order.customerWhatsapp,
          allowWhatsapp: order.allowWhatsapp ?? false,
          allowSms: order.allowSms ?? false,
          recipientName: order.recipientName,
          recipientDocument: order.recipientDocument,
          city: order.city,
          state: order.state,
          address: order.address,
          totalValue: order.totalValue,
          invoiceDate: order.invoiceDate ? new Date(order.invoiceDate) : undefined,
          plannedDeliveryAt: order.plannedDeliveryAt ? new Date(order.plannedDeliveryAt) : undefined,
          currentStatus: OrderStatus.FATURADO,
          isBilled: order.isBilled ?? true,
          isOpen: order.isOpen ?? true,
          winthorStatus: order.winthorStatus,
          assignedDriverDocument: order.assignedDriverDocument,
          assignedDriverName: order.assignedDriverName,
          assignedAt: order.assignedAt ? new Date(order.assignedAt) : undefined,
          metadataJson: order.metadataJson
        },
        create: {
          erpOrderNumber: order.erpOrderNumber,
          integrationRef: order.integrationRef,
          invoiceNumber: order.invoiceNumber,
          customerId: customer?.id,
          customerCode: order.customerCode,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerWhatsapp: order.customerWhatsapp,
          allowWhatsapp: order.allowWhatsapp ?? false,
          allowSms: order.allowSms ?? false,
          recipientName: order.recipientName,
          recipientDocument: order.recipientDocument,
          city: order.city,
          state: order.state,
          address: order.address,
          totalValue: order.totalValue,
          invoiceDate: order.invoiceDate ? new Date(order.invoiceDate) : undefined,
          plannedDeliveryAt: order.plannedDeliveryAt ? new Date(order.plannedDeliveryAt) : undefined,
          currentStatus: OrderStatus.FATURADO,
          isBilled: order.isBilled ?? true,
          isOpen: order.isOpen ?? true,
          winthorStatus: order.winthorStatus,
          assignedDriverDocument: order.assignedDriverDocument,
          assignedDriverName: order.assignedDriverName,
          assignedAt: order.assignedAt ? new Date(order.assignedAt) : undefined,
          metadataJson: order.metadataJson
        }
      });

      orders.push(savedOrder);
    }

    return orders;
  });

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
