import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureBudgetMonthForUser } from "@/lib/budget-engine";
import { getCurrentMonthKey } from "@/lib/format";
import { getPlaidEnv, isPlaidConfigured } from "@/lib/plaid";
import { isVapidConfigured } from "@/lib/push";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const monthKey = getCurrentMonthKey();

  await ensureBudgetMonthForUser(userId, monthKey);

  const [
    user,
    budgetMonth,
    envelopes,
    savingsGoals,
    cards,
    plaidItems,
    transactions,
    notifications,
    pushCount,
    academyProgress,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        monthlyIncomeCents: true,
        hourlyNetPayCents: true,
        onboardingCompleted: true,
        avatarStyle: true,
        avatarColor: true,
      },
    }),
    prisma.budgetMonth.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
    }),
    prisma.budgetEnvelope.findMany({
      where: { userId, monthKey },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.creditCardAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.plaidItem.findMany({
      where: { userId },
      select: {
        id: true,
        institutionName: true,
        status: true,
        lastSyncedAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: {
        envelope: {
          select: { id: true, name: true, colorToken: true },
        },
        creditCardAccount: {
          select: { id: true, name: true, mask: true },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 250,
    }),
    prisma.notificationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.pushSubscription.count({ where: { userId } }),
    prisma.academyProgress.findMany({
      where: { userId },
    }),
  ]);

  return NextResponse.json({
    user,
    monthKey,
    budgetMonth,
    envelopes,
    savingsGoals,
    cards,
    plaidItems,
    transactions,
    notifications,
    pushSubscriptionCount: pushCount,
    academyProgress,
    config: {
      plaidConfigured: isPlaidConfigured(),
      plaidEnv: getPlaidEnv(),
      vapidConfigured: isVapidConfigured(),
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
    },
  });
}
