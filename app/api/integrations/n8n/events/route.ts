import { NextResponse } from "next/server";
import { requireIntegrationToken } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authorized = await requireIntegrationToken("n8n");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integracao invalido." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  const events = await prisma.integrationEvent.findMany({
    where: {
      provider: "N8N",
      processedAt: null
    },
    orderBy: { createdAt: "asc" },
    take: Number.isNaN(limit) ? 20 : Math.min(limit, 100)
  });

  return NextResponse.json({ data: events });
}
