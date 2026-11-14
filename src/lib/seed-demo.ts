import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getCurrentMonthKey } from "./format";
import {
  STARTER_ENVELOPES,
  ensureBudgetMonthForUser,
  recalculateMonthTotals,
} from "./budget-engine";
import { inferHoardItem } from "./hoard-engine";

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
        monthlyIncomeCents: 600000,
        hourlyNetPayCents: 3600,
        onboardingCompleted: true,
        avatarStyle: "explorer",
        avatarColor: "#1B4D3E",
      },
    });
  }

  const monthKey = getCurrentMonthKey();
  const existingHotdog = await prisma.transaction.findFirst({
    where: { userId: user.id, hoardItemType: "costco_hotdog" },
  });

  if (existingHotdog) {
    await ensureBudgetMonthForUser(user.id, monthKey);
    return user;
  }

  // Ensure BudgetMonth & Envelopes
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

  let existingEnvelopes = await prisma.budgetEnvelope.findMany({
    where: { userId: user.id, monthKey },
  });

  if (existingEnvelopes.length === 0) {
    const demoEnvelopes = [
      { ...STARTER_ENVELOPES[0], allocatedCents: 68000 },
      { ...STARTER_ENVELOPES[1], allocatedCents: 32000 },
      { ...STARTER_ENVELOPES[2], allocatedCents: 26000 },
      { ...STARTER_ENVELOPES[3], allocatedCents: 34000 },
      { ...STARTER_ENVELOPES[4], allocatedCents: 24000 },
      { ...STARTER_ENVELOPES[5], allocatedCents: 30000 },
      {
        name: "Housing & Fixed Essentials",
        categoryKey: "HOUSING_FIXED",
        allocatedCents: 266000,
        isEssential: true,
        sortOrder: 0,
        colorToken: "slate",
      },
    ];
    for (const env of demoEnvelopes) {
      await prisma.budgetEnvelope.create({
        data: { userId: user.id, monthKey, ...env },
      });
    }
    existingEnvelopes = await prisma.budgetEnvelope.findMany({
      where: { userId: user.id, monthKey },
    });
  }

  const existingGoals = await prisma.savingsGoal.count({
    where: { userId: user.id },
  });
  if (existingGoals === 0) {
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
  }

  let card = await prisma.creditCardAccount.findFirst({
    where: { userId: user.id },
  });
  if (!card) {
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

    card = await prisma.creditCardAccount.create({
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
  }

  const envByKey = new Map(existingEnvelopes.map((e) => [e.categoryKey, e.id]));
  const now = new Date();
  const daysAgo = (d: number) => {
    const dt = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    return dt;
  };
  const thisMonthDay = (dayOffset: number) =>
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        Math.max(1, now.getUTCDate() - dayOffset),
        15,
        30
      )
    );

  // Check if current-month baseline transactions exist
  const currentMonthCount = await prisma.transaction.count({
    where: { userId: user.id },
  });

  const hoardTxs: Array<{
    merchantName: string;
    amountCents: number;
    categoryKey: string;
    plaidPrimaryCategory: string;
    paymentChannel: string;
    date: Date;
    mindfulReflection: string | null;
    coachingNote: string;
    budgetStatusAtPurchase: string;
    hoardItemType?: string;
    hoardItemLabel?: string;
    hoardQuantity?: number;
  }> = [
    // YTD iconic hoard items (earlier in the year so monthly envelopes stay realistic!)
    {
      merchantName: "Costco Food Court (YTD Hot Dogs)",
      amountCents: 22500,
      categoryKey: "FOOD_AND_DRINK_RESTAURANTS",
      plaidPrimaryCategory: "FOOD_AND_DRINK",
      paymentChannel: "in store",
      date: daysAgo(75),
      mindfulReflection: "PLANNED",
      coachingNote: "150 Costco $1.50 hot dogs across the year — best dollar-per-bite value in your hoard!",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
      hoardItemType: "costco_hotdog",
      hoardItemLabel: "Costco Hot Dog",
      hoardQuantity: 150,
    },
    {
      merchantName: "Nintendo Store / Best Buy (Switch 2)",
      amountCents: 44999,
      categoryKey: "ENTERTAINMENT",
      plaidPrimaryCategory: "ENTERTAINMENT",
      paymentChannel: "in store",
      date: daysAgo(55),
      mindfulReflection: "PLANNED",
      coachingNote: "12.5 hrs of work. Saved up inside Entertainment before swiping so it added $0 debt.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
      hoardItemType: "switch_2",
      hoardItemLabel: "Nintendo Switch 2",
      hoardQuantity: 1,
    },
    {
      merchantName: "Steam Store — Summer & Indie Bundle",
      amountCents: 24000,
      categoryKey: "ENTERTAINMENT",
      plaidPrimaryCategory: "ENTERTAINMENT",
      paymentChannel: "online",
      date: daysAgo(45),
      mindfulReflection: "PLANNED",
      coachingNote: "6.7 hrs of work across 5 Steam titles. Added to your Steam artwork shelf.",
      budgetStatusAtPurchase: "WITHIN_BUDGET",
      hoardItemType: "steam_game",
      hoardItemLabel: "Steam Game",
      hoardQuantity: 5,
    },
    {
      merchantName: "Steam Store — Autumn RPG & Racing",
      amountCents: 16000,
      categoryKey: "ENTERTAINMENT",
      plaidPrimaryCategory: "ENTERTAINMENT",
      paymentChannel: "online",
      date: thisMonthDay(7),
      mindfulReflection: "IMPULSE",
      coachingNote: "4.4 hrs of work ($315 in 10 yrs). Total Steam library spend this year hit $400!",
      budgetStatusAtPurchase: "NEAR_LIMIT",
      hoardItemType: "steam_game",
      hoardItemLabel: "Steam Game",
      hoardQuantity: 3,
    },
  ];

  if (currentMonthCount === 0) {
    hoardTxs.push(
      {
        merchantName: "Trader Joe's",
        amountCents: 14280,
        categoryKey: "FOOD_AND_DRINK_GROCERIES",
        plaidPrimaryCategory: "FOOD_AND_DRINK",
        paymentChannel: "in store",
        date: thisMonthDay(9),
        mindfulReflection: "ESSENTIAL",
        coachingNote: "3.9 hrs of work ($281 10-yr value). Core groceries kept inside plan.",
        budgetStatusAtPurchase: "WITHIN_BUDGET",
      },
      {
        merchantName: "Blue Bottle Coffee",
        amountCents: 1950,
        categoryKey: "FOOD_AND_DRINK_RESTAURANTS",
        plaidPrimaryCategory: "FOOD_AND_DRINK",
        paymentChannel: "in store",
        date: thisMonthDay(8),
        mindfulReflection: "PLANNED",
        coachingNote: "3 artisan coffees this week. Micro-swipes show up as coffee towers in your hoard.",
        budgetStatusAtPurchase: "WITHIN_BUDGET",
        hoardItemType: "coffee",
        hoardItemLabel: "Artisan Coffee",
        hoardQuantity: 3,
      },
      {
        merchantName: "Whole Foods Market",
        amountCents: 16840,
        categoryKey: "FOOD_AND_DRINK_GROCERIES",
        plaidPrimaryCategory: "FOOD_AND_DRINK",
        paymentChannel: "in store",
        date: thisMonthDay(6),
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
        date: thisMonthDay(5),
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
        date: thisMonthDay(4),
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
        date: thisMonthDay(3),
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
        date: thisMonthDay(2),
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
        date: thisMonthDay(1),
        mindfulReflection: null,
        coachingNote: "2.4 hrs of work ($170 10-yr value). Dining & Coffee is nearing 75%.",
        budgetStatusAtPurchase: "NEAR_LIMIT",
      }
    );
  }

  let addedBalance = 0;
  let lastTxId: string | null = null;
  for (const item of hoardTxs) {
    addedBalance += item.amountCents;
    const inferred = inferHoardItem({
      merchantName: item.merchantName,
      amountCents: item.amountCents,
      plaidPrimaryCategory: item.plaidPrimaryCategory,
      explicitType: item.hoardItemType,
      explicitLabel: item.hoardItemLabel,
      explicitQuantity: item.hoardQuantity,
    });
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
        hoardItemType: inferred.hoardItemType,
        hoardItemLabel: inferred.hoardItemLabel,
        hoardQuantity: inferred.hoardQuantity,
        isSimulated: true,
      },
    });
    lastTxId = createdTx.id;
  }

  await prisma.creditCardAccount.update({
    where: { id: card.id },
    data: { currentBalanceCents: { increment: addedBalance } },
  });

  await recalculateMonthTotals(user.id, monthKey);

  const notifCount = await prisma.notificationEvent.count({
    where: { userId: user.id },
  });
  if (notifCount === 0) {
    await prisma.notificationEvent.createMany({
      data: [
        {
          userId: user.id,
          transactionId: lastTxId,
          title: "Watch Limit: $86.50 at Bistro Tartine",
          body: "Dining & Coffee has $195.05 left. +$86.50 moved to Card Payment Reserve.",
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
  }

  await prisma.academyProgress.upsert({
    where: {
      userId_moduleSlug: { userId: user.id, moduleSlug: "pain-of-paying" },
    },
    update: {},
    create: {
      userId: user.id,
      moduleSlug: "pain-of-paying",
      reflectionNote:
        "Seeing 150 Costco hot dogs and $400 of Steam games piled under my avatar makes spending unforgettable!",
    },
  });

  return user;
}
