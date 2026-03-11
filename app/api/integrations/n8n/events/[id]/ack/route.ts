import { NextResponse } from "next/server";
import { requireIntegrationToken } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorized = await requireIntegrationToken("n8n");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integracao invalido." }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.integrationEvent.update({
    where: { id },
    data: {
      processedAt: new Date(),
      failedAt: null
    }
  });

  return NextResponse.json({ data: event });
}
