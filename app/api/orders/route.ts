import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAuth();

  const orders = await prisma.order.findMany({
    include: {
      loads: {
        include: {
          load: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ data: orders });
}
