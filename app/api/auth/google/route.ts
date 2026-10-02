import { NextRequest, NextResponse } from "next/server";
import { getOAuthRedirectUri } from "../session";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/";
  const bookDate = req.nextUrl.searchParams.get("bookDate") || "";

  const origin = req.nextUrl.origin;

  if (!clientId || clientId.trim() === "") {
    return NextResponse.redirect(
      `${origin}${returnUrl}${
        returnUrl.includes("?") ? "&" : "?"
      }oauth_error=${encodeURIComponent(
        "Chaves do Google OAuth (GOOGLE_CLIENT_ID) não configuradas no .env."
      )}`
    );
  }

  const redirectUri = getOAuthRedirectUri(origin);
  const stateObj = {
    returnUrl,
    bookDate,
    nonce: Math.random().toString(36).substring(7),
  };
  const stateStr = Buffer.from(JSON.stringify(stateObj)).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid profile email");
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", stateStr);

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set("google_oauth_state", stateStr, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutos
  });

  return response;
}
