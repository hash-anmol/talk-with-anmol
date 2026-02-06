import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret";

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export async function createAdminToken(payload: { email: string }) {
  const secret = new TextEncoder().encode(SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2d")
    .sign(secret);
}

export async function verifyAdminToken(token: string) {
  const secret = new TextEncoder().encode(SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload as { email: string };
}
