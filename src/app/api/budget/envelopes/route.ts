import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthKey } from "@/lib/format";
import { ensureBudgetMonthForUser } from "@/lib/budget-engine";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const action = String(body?.action || "");
  const monthKey = getCurrentMonthKey();

  await ensureBudgetMonthForUser(userId, monthKey);

  if (action === "update_income") {
    const incomeCents = Math.max(0, Math.round(Number(body?.incomeCents || 0)));
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyIncomeCents: incomeCents },
    });
    await prisma.budgetMonth.update({
      where: { userId_monthKey: { userId, monthKey } },
      data: { incomeCents },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "create") {
    const name = String(body?.name || "").trim();
    const allocatedCents = Math.max(0, Math.round(Number(body?.allocatedCents || 0)));
    const isEssential = Boolean(body?.isEssential);
    const colorToken = String(body?.colorToken || "sage");

    if (!name) {
      return NextResponse.json({ error: "Envelope name is required." }, { status: 400 });
    }

    const count = await prisma.budgetEnvelope.count({
      where: { userId, monthKey },
    });

    const created = await prisma.budgetEnvelope.create({
      data: {
        userId,
        monthKey,
        name,
        categoryKey: "CUSTOM",
        allocatedCents,
        isEssential,
        sortOrder: count + 1,
        colorToken,
      },
    });
    return NextResponse.json({ ok: true, envelope: created }, { status: 201 });
  }

  if (action === "update") {
    const envelopeId = String(body?.envelopeId || "");
    const allocatedCents = Math.max(0, Math.round(Number(body?.allocatedCents || 0)));
    const name = body?.name ? String(body.name).trim() : undefined;

    await prisma.budgetEnvelope.updateMany({
      where: { id: envelopeId, userId },
      data: {
        allocatedCents,
        ...(name ? { name } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "rebalance") {
    const fromEnvelopeId = String(body?.fromEnvelopeId || "");
    const toEnvelopeId = String(body?.toEnvelopeId || "");
    const amountCents = Math.max(1, Math.round(Number(body?.amountCents || 0)));

    if (!fromEnvelopeId || !toEnvelopeId || fromEnvelopeId === toEnvelopeId) {
      return NextResponse.json(
        { error: "Select two distinct envelopes to move funds." },
        { status: 400 }
      );
    }

    const [fromEnv, toEnv] = await Promise.all([
      prisma.budgetEnvelope.findFirst({ where: { id: fromEnvelopeId, userId } }),
      prisma.budgetEnvelope.findFirst({ where: { id: toEnvelopeId, userId } }),
    ]);

    if (!fromEnv || !toEnv) {
      return NextResponse.json({ error: "Envelope not found." }, { status: 404 });
    }

    if (fromEnv.allocatedCents < amountCents) {
      return NextResponse.json(
        { error: "Source envelope does not have enough allocated funds." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.budgetEnvelope.update({
        where: { id: fromEnv.id },
        data: { allocatedCents: { decrement: amountCents } },
      }),
      prisma.budgetEnvelope.update({
        where: { id: toEnv.id },
        data: { allocatedCents: { increment: amountCents } },
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
