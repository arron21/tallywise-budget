import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dispatchBudgetNotification } from "@/lib/push";
import { formatCents } from "@/lib/format";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const action = String(body?.action || "contribute");

  if (action === "create_goal") {
    const name = String(body?.name || "").trim();
    const targetCents = Math.max(100, Math.round(Number(body?.targetCents || 100000)));
    const monthlyTargetCents = Math.max(
      0,
      Math.round(Number(body?.monthlyTargetCents || 20000))
    );
    const apyBps = Math.max(0, Math.round(Number(body?.apyBps ?? 450)));

    if (!name) {
      return NextResponse.json({ error: "Goal name is required." }, { status: 400 });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetCents,
        monthlyTargetCents,
        apyBps,
      },
    });
    return NextResponse.json({ ok: true, goal }, { status: 201 });
  }

  if (action === "contribute") {
    const goalId = String(body?.goalId || "");
    const amountCents = Math.max(100, Math.round(Number(body?.amountCents || 0)));
    const source = String(body?.source || "MANUAL");
    const note = String(body?.note || "").trim() || null;

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.savingsContribution.create({
        data: {
          userId,
          goalId: goal.id,
          amountCents,
          source,
          note,
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goal.id },
        data: { currentCents: { increment: amountCents } },
      }),
    ]);

    const tenYrValue = Math.round(amountCents * Math.pow(1.07, 10));
    await dispatchBudgetNotification({
      userId,
      title: `Savings Win: +${formatCents(amountCents)} to ${goal.name}`,
      body: `Great pause! That single deposit grows to ${formatCents(tenYrValue)} in 10 years at 7%.`,
      severity: "SAVINGS_WIN",
      url: "/dashboard",
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown savings action." }, { status: 400 });
}
