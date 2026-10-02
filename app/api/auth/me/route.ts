import { NextRequest, NextResponse } from "next/server";
import { verifyUserSession } from "../session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("user_session")?.value;
  const user = verifyUserSession(token);

  return NextResponse.json({ user });
}
