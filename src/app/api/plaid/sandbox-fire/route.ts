import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";
import { getPlaidClient, getPlaidEnv, isPlaidConfigured } from "@/lib/plaid";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlaidConfigured() || getPlaidEnv() !== "sandbox") {
    return NextResponse.json(
      { error: "Sandbox webhook firing requires Plaid Sandbox mode." },
      { status: 400 }
    );
  }

  const item = await prisma.plaidItem.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Link a Plaid Sandbox card first before firing a sandbox webhook." },
      { status: 400 }
    );
  }

  try {
    const client = getPlaidClient();
    const res = await client.sandbox.fireItemWebhook({
      access_token: decryptToken(item.accessToken),
      webhook_code: "SYNC_UPDATES_AVAILABLE",
    });
    return NextResponse.json({
      ok: true,
      webhookFired: res.webhook_fired,
    });
  } catch (error) {
    console.error("Sandbox fire webhook error:", error);
    return NextResponse.json(
      { error: "Failed to fire Plaid sandbox webhook." },
      { status: 500 }
    );
  }
}
