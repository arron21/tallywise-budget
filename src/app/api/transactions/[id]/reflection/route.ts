import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalculateMonthTotals } from "@/lib/budget-engine";
import { getCurrentMonthKey } from "@/lib/format";
import { HOARD_CATALOG } from "@/lib/hoard-engine";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = session.user.id;
  const body = await req.json();

  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const updateData: {
    mindfulReflection?: string | null;
    envelopeId?: string | null;
    hoardItemType?: string | null;
    hoardItemLabel?: string | null;
    hoardQuantity?: number | null;
  } = {};

  if ("mindfulReflection" in body) {
    const val = body.mindfulReflection ? String(body.mindfulReflection) : null;
    if (val && !["PLANNED", "IMPULSE", "ESSENTIAL"].includes(val)) {
      return NextResponse.json({ error: "Invalid reflection tag." }, { status: 400 });
    }
    updateData.mindfulReflection = val;
  }

  if ("envelopeId" in body && body.envelopeId) {
    const targetEnvelope = await prisma.budgetEnvelope.findFirst({
      where: { id: String(body.envelopeId), userId },
    });
    if (!targetEnvelope) {
      return NextResponse.json({ error: "Target envelope not found." }, { status: 404 });
    }
    updateData.envelopeId = targetEnvelope.id;
  }

  if ("hoardItemType" in body && body.hoardItemType) {
    const itemType = String(body.hoardItemType);
    if (!(itemType in HOARD_CATALOG)) {
      return NextResponse.json({ error: "Invalid hoard item type." }, { status: 400 });
    }
    updateData.hoardItemType = itemType;
    updateData.hoardItemLabel = body.hoardItemLabel
      ? String(body.hoardItemLabel).trim()
      : HOARD_CATALOG[itemType as keyof typeof HOARD_CATALOG].label;
  }

  if ("hoardQuantity" in body && body.hoardQuantity != null) {
    updateData.hoardQuantity = Math.max(1, Math.round(Number(body.hoardQuantity)));
  }

  const updated = await prisma.transaction.update({
    where: { id: existing.id },
    data: updateData,
  });

  if (updateData.envelopeId) {
    await recalculateMonthTotals(userId, getCurrentMonthKey(existing.date));
  }

  return NextResponse.json({ ok: true, transaction: updated });
}
