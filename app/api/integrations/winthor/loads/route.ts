import { NextResponse } from "next/server";
import { IntegrationProvider } from "@prisma/client";
import { importLoads } from "@/lib/integration-imports";
import { requireIntegrationToken } from "@/lib/integrations";

export async function POST(request: Request) {
  const authorized = await requireIntegrationToken("winthor");

  if (!authorized) {
    return NextResponse.json({ error: "Token de integracao invalido." }, { status: 401 });
  }

  const body = await request.json();
  const result = await importLoads(body, IntegrationProvider.WINTHOR);

  return NextResponse.json(result.body, { status: result.status });
}
