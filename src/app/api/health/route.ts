import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlaidEnv, isPlaidConfigured } from "@/lib/plaid";
import { isVapidConfigured } from "@/lib/push";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      plaidConfigured: isPlaidConfigured(),
      plaidEnv: getPlaidEnv(),
      vapidConfigured: isVapidConfigured(),
      googleOAuthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { ok: false, database: "error" },
      { status: 500 }
    );
  }
}
