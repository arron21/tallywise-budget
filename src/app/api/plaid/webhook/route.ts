import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPlaidWebhookSignature } from "@/lib/plaid";
import { syncPlaidItem } from "@/lib/sync-engine";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signedJwt = req.headers.get("plaid-verification");

  const valid = await verifyPlaidWebhookSignature(rawBody, signedJwt);
  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as {
      webhook_type?: string;
      webhook_code?: string;
      item_id?: string;
    };

    const webhookType = payload.webhook_type;
    const webhookCode = payload.webhook_code;
    const itemId = payload.item_id;

    if (!itemId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const plaidItem = await prisma.plaidItem.findUnique({
      where: { itemId },
    });

    if (!plaidItem) {
      return NextResponse.json({ ok: true, unknownItem: true });
    }

    if (
      webhookType === "TRANSACTIONS" &&
      [
        "SYNC_UPDATES_AVAILABLE",
        "DEFAULT_UPDATE",
        "INITIAL_UPDATE",
        "HISTORICAL_UPDATE",
      ].includes(webhookCode || "")
    ) {
      const stats = await syncPlaidItem(plaidItem.id);
      return NextResponse.json({ ok: true, stats });
    }

    if (webhookType === "ITEM" && webhookCode === "ERROR") {
      await prisma.plaidItem.update({
        where: { id: plaidItem.id },
        data: { status: "NEEDS_REAUTH" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Plaid webhook handling error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
