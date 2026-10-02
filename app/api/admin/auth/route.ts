import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function getExpectedToken(): string {
  const adminPassword = process.env.ADMIN_PASSWORD!;
  return crypto
    .createHmac("sha256", adminPassword)
    .update("calendar_admin_session")
    .digest("hex");
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const expectedToken = getExpectedToken();

  const authenticated = Boolean(session && session === expectedToken);
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD!;

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { error: "Senha incorreta. Tente novamente." },
        { status: 401 },
      );
    }

    const token = getExpectedToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao autenticar ${err}` },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
