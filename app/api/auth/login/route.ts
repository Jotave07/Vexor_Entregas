import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticate,
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Dados de acesso inválidos." }, { status: 400 });
    }

    const user = await authenticate(result.data.email, result.data.password);

    if (!user) {
      return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({ success: true, role: user.role });

    response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return NextResponse.json({ error: "Não foi possível processar o login." }, { status: 500 });
  }
}
