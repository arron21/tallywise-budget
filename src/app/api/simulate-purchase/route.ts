import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processSimulatedSwipe } from "@/lib/sync-engine";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const merchantName = String(body?.merchantName || "Blue Bottle Coffee").trim();
    const amountCents = Math.max(
      50,
      Math.round(Number(body?.amountCents || 1450))
    );
    const categoryPrimary = body?.categoryPrimary
      ? String(body.categoryPrimary)
      : undefined;
    const paymentChannel = String(body?.paymentChannel || "in store");
    const envelopeId = body?.envelopeId ? String(body.envelopeId) : null;

    const result = await processSimulatedSwipe({
      userId: session.user.id,
      merchantName,
      amountCents,
      categoryPrimary,
      paymentChannel,
      envelopeId,
    });

    return NextResponse.json({
      ok: true,
      transaction: result.transaction,
      coaching: result.coaching,
      pushResult: result.pushResult,
    });
  } catch (error) {
    console.error("Simulate purchase error:", error);
    return NextResponse.json(
      { error: "Failed to simulate credit card purchase." },
      { status: 500 }
    );
  }
}
