import { NextResponse } from "next/server";
import { compareSync } from "bcryptjs";
import { createAdminToken, getAdminCookieName } from "@/lib/adminSession";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || (!adminPasswordHash && !adminPassword)) {
    return NextResponse.json(
      { error: "Admin credentials not configured" },
      { status: 500 }
    );
  }

  if (email !== adminEmail) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const passwordValid = adminPasswordHash
    ? compareSync(password, adminPasswordHash)
    : password === adminPassword;

  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminToken({ email });
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 2,
  });

  return response;
}
