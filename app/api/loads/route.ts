import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAuth();

  const loads = await prisma.load.findMany({
    include: {
      driver: true,
      orders: {
        include: { order: true }
      }
    }
  });

  return NextResponse.json({ data: loads });
}

export async function POST() {
  await requireAuth([UserRole.ADMIN]);

  return NextResponse.json(
    {
      error: "A criação manual de carga foi desativada. As cargas devem chegar prontas do Winthor via n8n."
    },
    { status: 403 }
  );
}
