import { NextResponse } from "next/server";
import { IntegrationProvider } from "@prisma/client";
import { importDrivers } from "@/lib/integration-imports";
import { requireIntegrationToken } from "@/lib/integrations";

export async function POST(request: Request) {
  const authorized = await requireIntegrationToken("n8n");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integracao invalido." }, { status: 401 });
  }

  const body = await request.json();
  const result = await importDrivers(body, IntegrationProvider.N8N);

  return NextResponse.json(result.body, { status: result.status });
}
