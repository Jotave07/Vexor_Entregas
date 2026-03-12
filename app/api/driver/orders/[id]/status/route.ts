import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { IntegrationEventType, IntegrationProvider, OccurrenceType, OrderStatus, ProofType, UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { createIntegrationEvent } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

const driverAllowedStatuses: OrderStatus[] = [
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "ENTREGA_PARCIAL",
  "CLIENTE_AUSENTE",
  "RECUSADO",
  "DEVOLUCAO",
  "OCORRENCIA"
];

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
  const receiverName = formData.get("receiverName")?.toString();
  const receiverDocument = formData.get("receiverDocument")?.toString();
  const proof = formData.get("proof");

  if (!status || !driverAllowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
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
    },
    include: {
      loads: true
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado para este motorista." }, { status: 404 });
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
        description: notes || "Ocorrência registrada pelo motorista."
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
    const bytes = Buffer.from(await proof.arrayBuffer());
    const extension = path.extname(proof.name) || (proof.type === "application/pdf" ? ".pdf" : ".jpg");
    const safeFileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "proofs");

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, safeFileName), bytes);

    const createdProof = await prisma.deliveryProof.create({
      data: {
        orderId: order.id,
        driverId: session.driverProfileId,
        type: proof.type === "application/pdf" ? ProofType.RECEIPT : ProofType.PHOTO,
        fileName: proof.name,
        fileUrl: `/uploads/proofs/${safeFileName}`,
        mimeType: proof.type,
        receiverName,
        receiverDocument,
        deliveredAt: new Date(),
        notes
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
        type: createdProof.type,
        receiverName: createdProof.receiverName,
        receiverDocument: createdProof.receiverDocument,
        deliveredAt: createdProof.deliveredAt
      }
    });
  }

  const redirectLoadId = order.loads[0]?.loadId;
  return NextResponse.redirect(new URL(redirectLoadId ? `/driver/loads/${redirectLoadId}` : "/driver", request.url));
}
