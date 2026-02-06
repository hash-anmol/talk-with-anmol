import { NextResponse } from "next/server";
import { compareSync } from "bcryptjs";
import { createAdminToken, getAdminCookieName } from "@/lib/adminSession";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "@/../convex/_generated/api";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 500 });
  }

  // 1. Fetch credentials from Convex DB
  const dbCreds = await client.query(api.settings.getAdminCredentials);
  let adminEmail = dbCreds?.email;
  let adminPasswordHash = dbCreds?.passwordHash;

  // 2. Migration/Fallback: If DB is empty, check Env
  const normalizeEnv = (value?: string) =>
    value?.trim().replace(/^['"]|['"]$/g, "");

  const envEmail = normalizeEnv(process.env.ADMIN_EMAIL);
  const envHash = normalizeEnv(process.env.ADMIN_PASSWORD_HASH);
  const envPass = normalizeEnv(process.env.ADMIN_PASSWORD);

  if (!adminEmail && envEmail) {
    adminEmail = envEmail;
    adminPasswordHash = envHash || undefined;
    
    // Auto-migrate to DB if env credentials exist
    await client.mutation(api.settings.setAdminCredentials, {
      email: envEmail,
      passwordHash: envHash || envPass || "", // Use hash if exists, otherwise pass
    });
  }

  if (!adminEmail || (!adminPasswordHash && !envPass)) {
    return NextResponse.json(
      { error: "Admin credentials not configured" },
      { status: 500 }
    );
  }

  // 3. Validate credentials
  if (!email || email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  let passwordValid = false;
  if (adminPasswordHash) {
    try {
      // Check if it's a bcrypt hash
      if (adminPasswordHash.startsWith("$2a$") || adminPasswordHash.startsWith("$2b$")) {
        passwordValid = compareSync(password, adminPasswordHash);
      } else {
        // Fallback for plain text stored in DB
        passwordValid = password === adminPasswordHash;
      }
    } catch {
      passwordValid = false;
    }
  }

  // Final fallback to env plain password if DB hash check failed
  if (!passwordValid && envPass) {
    passwordValid = password === envPass;
  }

  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 4. Success - Create token and set cookie
  const token = await createAdminToken({ email });
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/talkwithanmoladmin",
    maxAge: 60 * 60 * 24 * 2,
  });

  return response;
}
