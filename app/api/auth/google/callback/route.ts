import { NextRequest, NextResponse } from "next/server";
import { getMembersCollection, getWardsCollection } from "@/app/api/connect";
import { signUserSession, getOAuthRedirectUri } from "../../session";
import { SecurityLevel } from "@/app/api/models/member";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  let returnUrl = "/";
  let bookDate = "";

  if (state) {
    try {
      const parsedState = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      if (parsedState.returnUrl) returnUrl = parsedState.returnUrl;
      if (parsedState.bookDate) bookDate = parsedState.bookDate;
    } catch (e) {
      console.error("Erro ao fazer parse do state OAuth:", e);
    }
  }

  if (error || !code) {
    const errorMsg = error || "Código de autorização não recebido";
    return NextResponse.redirect(
      `${origin}${returnUrl}${
        returnUrl.includes("?") ? "&" : "?"
      }oauth_error=${encodeURIComponent(errorMsg)}`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getOAuthRedirectUri(origin);

  try {
    // 1. Troca o código por Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Falha ao obter token");
    }

    // 2. Busca perfil do usuário na Google
    const userinfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const profile = await userinfoResponse.json();
    if (!userinfoResponse.ok || !profile.email) {
      throw new Error("Falha ao obter perfil do usuário");
    }

    // 3. Salva / atualiza na collection members (entidade unificada com RBAC)
    const membersCol = await getMembersCollection();
    const now = new Date();

    // Busca ala padrão se ainda não existir
    let defaultWardId;
    const wardsCol = await getWardsCollection();
    const defaultWard = await wardsCol.findOne({});
    if (defaultWard) {
      defaultWardId = defaultWard._id;
    }

    const updateResult = await membersCol.findOneAndUpdate(
      { email: profile.email },
      {
        $set: {
          name: profile.name || profile.email.split("@")[0],
          picture: profile.picture,
          updatedAt: now,
        },
        $setOnInsert: {
          wardId: defaultWardId,
          secLevel: SecurityLevel.USER,
          role: "user",
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    const memberId = updateResult?._id ? String(updateResult._id) : profile.sub;

    // 4. Cria sessão segura assinada
    const sessionToken = signUserSession({
      id: memberId,
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      picture: profile.picture,
      provider: "google",
    });

    // 5. Redireciona de volta com cookie
    const targetUrl = new URL(`${origin}${returnUrl}`);
    if (bookDate) {
      targetUrl.searchParams.set("bookDate", bookDate);
    }
    targetUrl.searchParams.set("auth_success", "true");

    const response = NextResponse.redirect(targetUrl.toString());

    response.cookies.set("user_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    response.cookies.delete("google_oauth_state");

    return response;
  } catch (err: unknown) {
    console.error("Erro no callback do Google OAuth:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      `${origin}${returnUrl}${
        returnUrl.includes("?") ? "&" : "?"
      }oauth_error=${encodeURIComponent(msg)}`
    );
  }
}
