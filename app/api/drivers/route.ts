import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { DriverStatus, DriverType, Prisma, UserRole } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createDriverSchema = z.object({
  fullName: z.string().min(3),
  document: z.string().min(11),
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  type: z.nativeEnum(DriverType),
  status: z.nativeEnum(DriverStatus).default(DriverStatus.ACTIVE),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.union([z.string().min(6), z.literal("")]).optional()
});

export async function GET() {
  await requireAuth();
  const drivers = await prisma.driverProfile.findMany({ include: { user: true } });
  return NextResponse.json({ data: drivers });
}

export async function POST(request: Request) {
  await requireAuth([UserRole.ADMIN]);

  const body = await request.json();
  const result = createDriverSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const email = result.data.email || undefined;
  const password = result.data.password || undefined;

  if ((email && !password) || (!email && password)) {
    return NextResponse.json(
      { error: "Informe email e senha juntos para criar o acesso do motorista." },
      { status: 400 }
    );
  }

  try {
    const driver = await prisma.driverProfile.create({
      data: {
        fullName: result.data.fullName,
        document: result.data.document,
        phone: result.data.phone,
        vehicleType: result.data.vehicleType,
        vehiclePlate: result.data.vehiclePlate,
        type: result.data.type,
        status: result.data.status,
        user: email && password
          ? {
              create: {
                name: result.data.fullName,
                email,
                passwordHash: await bcrypt.hash(password, 10),
                role: UserRole.DRIVER
              }
            }
          : undefined
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um cadastro com este documento, email ou identificador único." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Não foi possível salvar o motorista." }, { status: 500 });
  }
}
