import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getCurrentMonthKey } from "./format";
import {
  STARTER_ENVELOPES,
  ensureBudgetMonthForUser,
  recalculateMonthTotals,
} from "./budget-engine";

export async function ensureDemoUserSeeded() {
  const email = "demo@tallywise.app";
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    user = await prisma.user.create({
      data: {
        name: "Maya Lin",
        email,
        passwordHash,
        monthlyIncomeCents: 600000, // $6,000/mo
        hourlyNetPayCents: 3600, // $36/hr
        onboardingCompleted: true,
      },
    });
  }

  const monthKey = getCurrentMonthKey();
  const existingTxCount = await prisma.transaction.count({
    where: { userId: user.id },
  });

  if (existingTxCount > 0) {
    await ensureBudgetMonthForUser(user.id, monthKey);
    return user;
  }

  // Create BudgetMonth & starter envelopes tailored to $6,000 income
  await prisma.budgetMonth.upsert({
    where: { userId_monthKey: { userId: user.id, monthKey } },
    update: { incomeCents: 600000 },
    create: {
      userId: user.id,
      monthKey,
      incomeCents: 600000,
      cardReserveCents: 0,
    },
  });

  const demoEnvelopes = [
    { ...STARTER_ENVELOPES[0], allocatedCents: 68000 },
    { ...STARTER_ENVELOPES[1], allocatedCents: 32000 },
    { ...STARTER_ENVELOPES[2], allocatedCents: 26000 },
    { ...STARTER_ENVELOPES[3], allocatedCents: 34000 },
    { ...STARTER_ENVELOPES[4], allocatedCents: 24000 },
    { ...STARTER_ENVELOPES[5], allocatedCents: 20000 },
    {
      name: "Housing & Fixed Essentials",
      categoryKey: "HOUSING_FIXED",
      allocatedCents: 276000,
      isEssential: true,
      sortOrder: 0,
      colorToken: "slate",
    },
  ];

  const createdEnvelopes = [];
  for (const env of demoEnvelopes) {
    const record = await prisma.budgetEnvelope.create({
      data: {
        userId: user.id,
        monthKey,
        ...env,
      },
    });
    createdEnvelopes.push(record);
  }

  // Pay Yourself First Savings Goals ($1,200/mo allocated to savings!)
  const emergencyGoal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: "4-Month Emergency Vault (4.5% HYSA)",
      targetCents: 1800000,
      currentCents: 1125000,
      monthlyTargetCents: 80000,
      apyBps: 450,
    },
  });

  const travelGoal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: "Autumn Japan Trip (Debt-Free)",
      targetCents: 450000,
      currentCents: 245000,
      monthlyTargetCents: 40000,
      apyBps: 450,
    },
  });

  await prisma.savingsContribution.createMany({
    data: [
      {
        userId: user.id,
        goalId: emergencyGoal.id,
        amountCents: 80000,
        source: "PAY_YOURSELF_FIRST",
        note: "Automatic 1st-of-month Pay Yourself First transfer",
      },
      {
        userId: user.id,
        goalId: travelGoal.id,
        amountCents: 40000,
        source: "PAY_YOURSELF_FIRST",
        note: "Monthly travel fund before discretionary spending",
      },
      {
        userId: user.id,
        goalId: emergencyGoal.id,
        amountCents: 6500,
        source: "SPENDING_PAUSE",
        note: "Skipped impulse sneakers checkout after 48-hr pause",
      },
    ],
  });

  // Simulated Plaid Item & Credit Card
  const simItem = await prisma.plaidItem.create({
    data: {
      userId: user.id,
      itemId: `demo-plaid-item-${user.id}`,
      accessToken: "simulated",
      institutionName: "Chase Freedom & Sapphire",
      status: "SIMULATED",
      lastSyncedAt: new Date(),
    },
  });

  const card = await prisma.creditCardAccount.create({
    data: {
      userId: user.id,
      plaidItemId: simItem.id,
      accountId: `demo-card-4829-${user.id}`,
      name: "Sapphire Preferred",
      officialName: "Chase Sapphire Preferred Credit Card",
      mask: "4829",
      currentBalanceCents: 0,
      creditLimitCents: 1200000,
      aprBps: 2199,
      isSimulated: true,
    },
  });

  const envByKey = new Map(createdEnvelopes.map((e) => [e.categoryKey, e.id]));
  const now = new Date();
  const daysAgo = (d: number) =>
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        Math.max(1, now.getUTCDate() - d),
        15,
        30
      )
    );

  const sampleTxs = [
    {
      merchantName: "Trader Joe's",
      amountCents: 14280,
      categoryKey: "FOOD_AND_DRINK_GROCERIES",
      plaidPrimaryCategory: "FOOD_AND_DRINK",
      paymentChannel: "in store",
      date: daysAgo(9),
      mindfulReflection: "ESSENTIAL",
      coachingNote: "3.9 hrs of work ($281 10-yr value). Core groceries kept inside plan.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Blue Bottle Coffee",
      amountCents: 745,
      categoryKey: "FOOD_AND_DRINK_RESTAURANTS",
      plaidPrimaryCategory: "FOOD_AND_DRINK",
      paymentChannel: "in store",
      date: daysAgo(8),
      mindfulReflection: "PLANNED",
      coachingNote: "12 min of work. Micro-swipes add up — Dining envelope tracks every tap.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Whole Foods Market",
      amountCents: 16840,
      categoryKey: "FOOD_AND_DRINK_GROCERIES",
      plaidPrimaryCategory: "FOOD_AND_DRINK",
      paymentChannel: "in store",
      date: daysAgo(6),
      mindfulReflection: "ESSENTIAL",
      coachingNote: "4.7 hrs of work. Card reserve automatically locked +$168.40.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Spotify & iCloud+",
      amountCents: 2198,
      categoryKey: "RENT_AND_UTILITIES",
      plaidPrimaryCategory: "RENT_AND_UTILITIES",
      paymentChannel: "online",
      date: daysAgo(5),
      mindfulReflection: "ESSENTIAL",
      coachingNote: "Recurring digital subscription matched to Subscriptions & Bills.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Sweetgreen",
      amountCents: 1895,
      categoryKey: "FOOD_AND_DRINK_RESTAURANTS",
      plaidPrimaryCategory: "FOOD_AND_DRINK",
      paymentChannel: "in store",
      date: daysAgo(4),
      mindfulReflection: "PLANNED",
      coachingNote: "32 min of work. Dining & Coffee stays comfortably under limit.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Uniqlo Online",
      amountCents: 11800,
      categoryKey: "GENERAL_MERCHANDISE",
      plaidPrimaryCategory: "GENERAL_MERCHANDISE",
      paymentChannel: "online",
      date: daysAgo(3),
      mindfulReflection: "IMPULSE",
      coachingNote: "3.3 hrs of work ($232 in 10 yrs). Online checkouts hide pain of paying.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Chevron Station",
      amountCents: 5420,
      categoryKey: "TRANSPORTATION",
      plaidPrimaryCategory: "TRANSPORTATION",
      paymentChannel: "in store",
      date: daysAgo(2),
      mindfulReflection: "ESSENTIAL",
      coachingNote: "1.5 hrs of work. Card reserve updated (+$54.20).",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
    },
    {
      merchantName: "Bistro Tartine",
      amountCents: 8650,
      categoryKey: "FOOD_AND_DRINK_RESTAURANTS",
      plaidPrimaryCategory: "FOOD_AND_DRINK",
      paymentChannel: "in store",
      date: daysAgo(1),
      mindfulReflection: null,
      coachingNote: "2.4 hrs of work ($170 10-yr value). Dining & Coffee is nearing 75%.",
      budgetStatusAtPurchase: "NEAR_LIMIT",
    },
  ];

  let totalBalance = 0;
  let lastTxId: string | null = null;
  for (const item of sampleTxs) {
    totalBalance += item.amountCents;
    const createdTx = await prisma.transaction.create({
      data: {
        userId: user.id,
        creditCardAccountId: card.id,
        envelopeId: envByKey.get(item.categoryKey) ?? null,
        merchantName: item.merchantName,
        amountCents: item.amountCents,
        date: item.date,
        pending: false,
        plaidPrimaryCategory: item.plaidPrimaryCategory,
        paymentChannel: item.paymentChannel,
        mindfulReflection: item.mindfulReflection,
        coachingNote: item.coachingNote,
        budgetStatusAtPurchase: item.budgetStatusAtPurchase,
        isSimulated: true,
      },
    });
    lastTxId = createdTx.id;
  }

  await prisma.creditCardAccount.update({
    where: { id: card.id },
    data: { currentBalanceCents: totalBalance },
  });

  await recalculateMonthTotals(user.id, monthKey);

  await prisma.notificationEvent.createMany({
    data: [
      {
        userId: user.id,
        transactionId: lastTxId,
        title: "Watch Limit: $86.50 at Bistro Tartine",
        body: "Dining & Coffee has $207.10 left (35% used). +$86.50 moved to Card Payment Reserve.",
        severity: "NEAR_LIMIT",
        deliveredViaPush: false,
      },
      {
        userId: user.id,
        title: "Savings Win: +$65.00 to Emergency Vault",
        body: "Pausing an impulse sneakers checkout grew your 10-yr projected savings by $128.",
        severity: "SAVINGS_WIN",
        deliveredViaPush: false,
      },
    ],
  });

  await prisma.academyProgress.create({
    data: {
      userId: user.id,
      moduleSlug: "pain-of-paying",
      reflectionNote: "Delivery apps and coffee taps feel completely invisible without alerts.",
    },
  });

  return user;
}
