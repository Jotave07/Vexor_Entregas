import "server-only";

import { headers } from "next/headers";
import { IntegrationEventType, IntegrationProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TokenTarget = "n8n" | "winthor";

function envTokenName(target: TokenTarget) {
  return target === "n8n" ? "N8N_SHARED_SECRET" : "WINTHOR_SHARED_SECRET";
}

export async function requireIntegrationToken(target: TokenTarget) {
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  const apiKeyHeader = requestHeaders.get("x-api-key");
  const expectedToken = process.env[envTokenName(target)];

  if (!expectedToken) {
    return target === "n8n";
  }

  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const providedToken = bearerToken || apiKeyHeader;

  return providedToken === expectedToken;
}

type CreateIntegrationEventInput = {
  provider: IntegrationProvider;
  eventType: IntegrationEventType;
  entityType: string;
  entityId: string;
  correlationId?: string;
  payloadJson: unknown;
};

export async function createIntegrationEvent(input: CreateIntegrationEventInput) {
  return prisma.integrationEvent.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      correlationId: input.correlationId,
      payloadJson: input.payloadJson as object
    }
  });
}
