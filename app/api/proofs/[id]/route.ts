import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const proof = await prisma.deliveryProof.findUnique({
    where: { id }
  });

  if (!proof) {
    return new NextResponse("Comprovante nao encontrado.", { status: 404 });
  }

  const fileName = path.basename(proof.fileUrl);
  const filePath = path.join(process.cwd(), "public", "uploads", "proofs", fileName);

  try {
    const bytes = await readFile(filePath);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": proof.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(proof.fileName)}"`,
        "Cache-Control": "private, max-age=0, must-revalidate"
      }
    });
  } catch {
    return new NextResponse("Arquivo indisponivel no servidor atual.", { status: 404 });
  }
}
