import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminPassword } from "@/app/api/auth/session";

function getExpectedToken(): string {
  const adminPassword = getAdminPassword();
  if (!adminPassword) return "";
  return crypto
    .createHmac("sha256", adminPassword)
    .update("calendar_admin_session")
    .digest("hex");
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const expectedToken = getExpectedToken();

  const authenticated = Boolean(
    expectedToken && session && session === expectedToken,
  );
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = getAdminPassword();
    const inputPwd =
      typeof password === "string"
        ? password.trim().replace(/^["']|["']$/g, "")
        : "";

    if (!adminPassword) {
      return NextResponse.json(
        {
          error:
            "A variável ADMIN_PASSWORD não está configurada no servidor (adicione na Vercel e faça Redeploy).",
        },
        { status: 500 },
      );
    }

    const isMatch =
      inputPwd &&
      (inputPwd === adminPassword ||
        inputPwd === adminPassword.replace(/\\/g, "") ||
        inputPwd.replace(/\\/g, "") === adminPassword ||
        inputPwd.replace(/\\/g, "") === adminPassword.replace(/\\/g, ""));

    if (!isMatch) {
      return NextResponse.json(
        { error: "Senha incorreta. Tente novamente." },
        { status: 401 },
      );
    }

    const token = getExpectedToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
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

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
