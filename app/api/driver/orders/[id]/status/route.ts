import { NextResponse } from "next/server";
import { IntegrationEventType, IntegrationProvider, OccurrenceType, OrderStatus, ProofType, UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { createIntegrationEvent } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

const driverAllowedStatuses: OrderStatus[] = ["ON_ROUTE", "DELIVERED", "FAILED", "RETURNED"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth([UserRole.DRIVER]);

  if (session.role !== UserRole.DRIVER || !session.driverProfileId) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const status = formData.get("status")?.toString() as OrderStatus | undefined;
  const notes = formData.get("notes")?.toString();
  const occurrenceType = formData.get("occurrenceType")?.toString() as OccurrenceType | undefined;
  const proof = formData.get("proof");

  if (!status || !driverAllowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      loads: {
        some: {
          load: {
            driverId: session.driverProfileId
          }
        }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido nao encontrado para este motorista." }, { status: 404 });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { currentStatus: status }
  });

  const history = await prisma.statusHistory.create({
    data: {
      orderId: order.id,
      fromStatus: order.currentStatus,
      toStatus: status,
      source: "DRIVER",
      notes
    }
  });

  await createIntegrationEvent({
    provider: IntegrationProvider.N8N,
    eventType: IntegrationEventType.ORDER_STATUS_CHANGED,
    entityType: "order",
    entityId: order.id,
    correlationId: order.erpOrderNumber,
    payloadJson: {
      orderId: order.id,
      erpOrderNumber: order.erpOrderNumber,
      fromStatus: order.currentStatus,
      toStatus: updatedOrder.currentStatus,
      notes,
      source: history.source,
      driverProfileId: session.driverProfileId
    }
  });

  if (occurrenceType) {
    const occurrence = await prisma.deliveryOccurrence.create({
      data: {
        orderId: order.id,
        driverId: session.driverProfileId,
        type: occurrenceType,
        description: notes || "Ocorrencia registrada pelo motorista."
      }
    });

    await createIntegrationEvent({
      provider: IntegrationProvider.N8N,
      eventType: IntegrationEventType.DELIVERY_OCCURRENCE,
      entityType: "occurrence",
      entityId: occurrence.id,
      correlationId: order.erpOrderNumber,
      payloadJson: {
        orderId: order.id,
        erpOrderNumber: order.erpOrderNumber,
        type: occurrence.type,
        description: occurrence.description,
        driverProfileId: session.driverProfileId
      }
    });
  }

  if (proof && proof instanceof File && proof.size > 0) {
    const createdProof = await prisma.deliveryProof.create({
      data: {
        orderId: order.id,
        driverId: session.driverProfileId,
        type: ProofType.PHOTO,
        fileName: proof.name,
        fileUrl: `/uploads/${proof.name}`,
        mimeType: proof.type
      }
    });

    await createIntegrationEvent({
      provider: IntegrationProvider.N8N,
      eventType: IntegrationEventType.DELIVERY_PROOF,
      entityType: "proof",
      entityId: createdProof.id,
      correlationId: order.erpOrderNumber,
      payloadJson: {
        orderId: order.id,
        erpOrderNumber: order.erpOrderNumber,
        fileName: createdProof.fileName,
        fileUrl: createdProof.fileUrl,
        type: createdProof.type
      }
    });
  }

  return NextResponse.redirect(new URL("/driver", request.url));
}
