import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, createSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Dados de acesso invalidos." }, { status: 400 });
  }

  const user = await authenticate(result.data.email, result.data.password);

  if (!user) {
    return NextResponse.json({ error: "Email ou senha invalidos." }, { status: 401 });
  }

  await createSession(user);

  return NextResponse.json({ success: true, role: user.role });
}
