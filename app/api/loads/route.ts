import { NextResponse } from "next/server";
import { z } from "zod";
import { LoadStatus, Prisma, UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createLoadSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  routeDescription: z.string().optional(),
  notes: z.string().optional(),
  driverId: z.string().optional(),
  scheduledDate: z.string().optional(),
  status: z.nativeEnum(LoadStatus).default(LoadStatus.DRAFT),
  orderIds: z.array(z.string()).default([])
});

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

export async function POST(request: Request) {
  await requireAuth([UserRole.ADMIN]);

  const body = await request.json();
  const result = createLoadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { orderIds, scheduledDate, ...payload } = result.data;

  try {
    const load = await prisma.load.create({
      data: {
        ...payload,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        orders: {
          create: orderIds.map((orderId, index) => ({
            orderId,
            sequence: index + 1
          }))
        }
      },
      include: {
        orders: true
      }
    });

    return NextResponse.json({ data: load }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ja existe uma carga com este codigo ou um pedido selecionado ja pertence a outra carga." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Nao foi possivel salvar a carga." }, { status: 500 });
  }
}
