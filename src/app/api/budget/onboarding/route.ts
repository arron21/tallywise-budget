import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthKey } from "@/lib/format";
import { recalculateMonthTotals } from "@/lib/budget-engine";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const monthlyIncomeCents = Math.max(
    0,
    Math.round(Number(body?.monthlyIncomeCents ?? 550000))
  );
  const hourlyNetPayCents = Math.max(
    100,
    Math.round(Number(body?.hourlyNetPayCents ?? 3200))
  );
  const monthlySavingsCents = Math.max(
    0,
    Math.round(Number(body?.monthlySavingsCents ?? 60000))
  );
  const savingsGoalName = String(
    body?.savingsGoalName || "Emergency Vault (Pay Yourself First)"
  ).trim();
  const envelopesInput: Array<{
    id?: string;
    name: string;
    categoryKey?: string;
    allocatedCents: number;
    isEssential?: boolean;
  }> = Array.isArray(body?.envelopes) ? body.envelopes : [];

  const monthKey = getCurrentMonthKey();

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyIncomeCents,
      hourlyNetPayCents,
      onboardingCompleted: true,
    },
  });

  await prisma.budgetMonth.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    update: { incomeCents: monthlyIncomeCents },
    create: {
      userId,
      monthKey,
      incomeCents: monthlyIncomeCents,
      cardReserveCents: 0,
    },
  });

  const existingGoal = await prisma.savingsGoal.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existingGoal) {
    await prisma.savingsGoal.update({
      where: { id: existingGoal.id },
      data: {
        name: savingsGoalName,
        monthlyTargetCents: monthlySavingsCents,
      },
    });
  } else {
    await prisma.savingsGoal.create({
      data: {
        userId,
        name: savingsGoalName,
        targetCents: Math.max(monthlySavingsCents * 12, 500000),
        currentCents: 0,
        monthlyTargetCents: monthlySavingsCents,
        apyBps: 450,
      },
    });
  }

  if (envelopesInput.length > 0) {
    for (const env of envelopesInput) {
      if (env.id) {
        await prisma.budgetEnvelope.updateMany({
          where: { id: env.id, userId },
          data: {
            name: env.name,
            allocatedCents: Math.max(0, Math.round(env.allocatedCents)),
          },
        });
      }
    }
  }

  await recalculateMonthTotals(userId, monthKey);
  return NextResponse.json({ ok: true });
}
