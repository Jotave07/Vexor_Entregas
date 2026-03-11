import { NextResponse } from "next/server";
import { requireIntegrationToken } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const authorized = await requireIntegrationToken("n8n");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integracao invalido." }, { status: 401 });
  }

  const payload = await request.json();

  const history = await prisma.statusHistory.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      order: true
    }
  });

  return NextResponse.json({
    receivedAt: new Date().toISOString(),
    payload,
    latestStatuses: history
  });
}
