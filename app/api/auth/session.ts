import crypto from "crypto";

export interface UserSession {
  id?: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google";
  exp: number;
}

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "calendar_auth_secret_key_2026";

export function signUserSession(
  user: Omit<UserSession, "exp">,
  days = 30,
): string {
  const payload: UserSession = {
    ...user,
    exp: Date.now() + days * 24 * 60 * 60 * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyUserSession(token?: string): UserSession | null {
  if (!token || !token.includes(".")) return null;
  const [data, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");

  if (signature !== expectedSignature) return null;

  try {
    const payload: UserSession = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    );
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface CallerAuth {
  userId?: string;
  userEmail?: string;
  userName?: string;
  guestToken?: string;
  isAdmin?: boolean;
}

export function verifyAdminSession(token?: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !token) return false;
  const expectedToken = crypto
    .createHmac("sha256", adminPassword)
    .update("calendar_admin_session")
    .digest("hex");
  return token === expectedToken;
}

export function parseCookieHeader(
  cookieHeader: string | null,
): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    if (name) cookies[name] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

export function getCallerAuth(
  req: Request,
  explicitGuestToken?: string,
): CallerAuth {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);

  const userSessionToken = cookies["user_session"];
  const user = verifyUserSession(userSessionToken);

  const adminSessionToken = cookies["admin_session"];
  const isAdmin = verifyAdminSession(adminSessionToken);

  const guestToken =
    explicitGuestToken ||
    cookies["guest_uuid"] ||
    req.headers.get("x-guest-token") ||
    new URL(req.url).searchParams.get("guestToken") ||
    undefined;

  return {
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name,
    guestToken: guestToken || undefined,
    isAdmin,
  };
}

export function getOAuthRedirectUri(origin: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.startsWith("http")) {
    const isLocalhost =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("0.0.0.0");
    if (isLocalhost) {
      return `${envUrl.replace(/\/$/, "")}/api/auth/google/callback`;
    }
  }
  return `${origin}/api/auth/google/callback`;
}
