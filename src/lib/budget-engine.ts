import { prisma } from "./prisma";
import { getCurrentMonthKey } from "./format";
import { dispatchBudgetNotification } from "./push";
import { inferHoardItem } from "./hoard-engine";

export const STARTER_ENVELOPES = [
  {
    name: "Groceries",
    categoryKey: "FOOD_AND_DRINK_GROCERIES",
    allocatedCents: 65000,
    isEssential: true,
    sortOrder: 1,
    colorToken: "emerald",
  },
  {
    name: "Dining & Coffee",
    categoryKey: "FOOD_AND_DRINK_RESTAURANTS",
    allocatedCents: 30000,
    isEssential: false,
    sortOrder: 2,
    colorToken: "terracotta",
  },
  {
    name: "Transit & Fuel",
    categoryKey: "TRANSPORTATION",
    allocatedCents: 24000,
    isEssential: true,
    sortOrder: 3,
    colorToken: "slate",
  },
  {
    name: "Shopping & Wants",
    categoryKey: "GENERAL_MERCHANDISE",
    allocatedCents: 35000,
    isEssential: false,
    sortOrder: 4,
    colorToken: "ochre",
  },
  {
    name: "Subscriptions & Bills",
    categoryKey: "RENT_AND_UTILITIES",
    allocatedCents: 22000,
    isEssential: true,
    sortOrder: 5,
    colorToken: "sage",
  },
  {
    name: "Entertainment & Experiences",
    categoryKey: "ENTERTAINMENT",
    allocatedCents: 28000,
    isEssential: false,
    sortOrder: 6,
    colorToken: "olive",
  },
];

export async function ensureBudgetMonthForUser(
  userId: string,
  monthKey = getCurrentMonthKey()
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyIncomeCents: true },
  });
  const incomeCents = user?.monthlyIncomeCents ?? 550000;

  let budgetMonth = await prisma.budgetMonth.findUnique({
    where: { userId_monthKey: { userId, monthKey } },
  });

  if (!budgetMonth) {
    budgetMonth = await prisma.budgetMonth.create({
      data: {
        userId,
        monthKey,
        incomeCents,
        cardReserveCents: 0,
      },
    });
  }

  const existingEnvelopes = await prisma.budgetEnvelope.findMany({
    where: { userId, monthKey },
    orderBy: { sortOrder: "asc" },
  });

  if (existingEnvelopes.length === 0) {
    await prisma.budgetEnvelope.createMany({
      data: STARTER_ENVELOPES.map((env) => ({
        userId,
        monthKey,
        ...env,
      })),
    });
  }

  return budgetMonth;
}

export function matchEnvelopeCategory<
  T extends { id: string; name: string; categoryKey: string }
>(
  envelopes: T[],
  plaidPrimary?: string | null,
  plaidDetailed?: string | null,
  merchantName?: string
): T | null {
  const detailed = (plaidDetailed || "").toUpperCase();
  const primary = (plaidPrimary || "").toUpperCase();
  const merchant = (merchantName || "").toLowerCase();

  let targetKey = "GENERAL_MERCHANDISE";

  if (
    merchant.includes("hot dog") ||
    merchant.includes("hotdog") ||
    merchant.includes("food court") ||
    primary === "FOOD_AND_DRINK" ||
    detailed.includes("COFFEE") ||
    detailed.includes("RESTAURANT") ||
    merchant.includes("coffee") ||
    merchant.includes("starbucks") ||
    merchant.includes("blue bottle") ||
    merchant.includes("philz") ||
    merchant.includes("sweetgreen") ||
    merchant.includes("chipotle") ||
    merchant.includes("doordash") ||
    merchant.includes("uber eats")
  ) {
    if (
      detailed.includes("GROCER") ||
      merchant.includes("trader joe") ||
      merchant.includes("whole foods") ||
      merchant.includes("kroger") ||
      merchant.includes("aldi") ||
      merchant.includes("safeway")
    ) {
      targetKey = "FOOD_AND_DRINK_GROCERIES";
    } else {
      targetKey = "FOOD_AND_DRINK_RESTAURANTS";
    }
  } else if (
    detailed.includes("GROCER") ||
    merchant.includes("trader joe") ||
    merchant.includes("whole foods") ||
    merchant.includes("costco")
  ) {
    targetKey = "FOOD_AND_DRINK_GROCERIES";
  } else if (
    primary === "TRANSPORTATION" ||
    primary === "TRAVEL" ||
    merchant.includes("uber") ||
    merchant.includes("lyft") ||
    merchant.includes("shell") ||
    merchant.includes("chevron") ||
    merchant.includes("metro")
  ) {
    targetKey = "TRANSPORTATION";
  } else if (
    primary === "RENT_AND_UTILITIES" ||
    detailed.includes("SUBSCRIPTION") ||
    merchant.includes("netflix") ||
    merchant.includes("spotify") ||
    merchant.includes("apple.com") ||
    merchant.includes("icloud") ||
    merchant.includes("verizon")
  ) {
    targetKey = "RENT_AND_UTILITIES";
  } else if (
    primary === "ENTERTAINMENT" ||
    merchant.includes("steam") ||
    merchant.includes("nintendo") ||
    merchant.includes("switch") ||
    merchant.includes("cinema") ||
    merchant.includes("amc") ||
    merchant.includes("ticketmaster") ||
    merchant.includes("museum")
  ) {
    targetKey = "ENTERTAINMENT";
  }

  return (
    envelopes.find((e) => e.categoryKey === targetKey) ||
    envelopes.find((e) => e.categoryKey === "GENERAL_MERCHANDISE") ||
    envelopes[0] ||
    null
  );
}

export async function recalculateMonthTotals(userId: string, monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const start = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
  const end = new Date(Date.UTC(Number(yearStr), Number(monthStr), 1));

  const envelopes = await prisma.budgetEnvelope.findMany({
    where: { userId, monthKey },
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
      amountCents: { gt: 0 },
    },
  });

  const spentByEnvelope = new Map<string, number>();
  let totalReserveCents = 0;

  for (const tx of transactions) {
    totalReserveCents += tx.amountCents;
    if (tx.envelopeId) {
      spentByEnvelope.set(
        tx.envelopeId,
        (spentByEnvelope.get(tx.envelopeId) ?? 0) + tx.amountCents
      );
    }
  }

  await Promise.all(
    envelopes.map((env) =>
      prisma.budgetEnvelope.update({
        where: { id: env.id },
        data: { spentCents: spentByEnvelope.get(env.id) ?? 0 },
      })
    )
  );

  await prisma.budgetMonth.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    update: { cardReserveCents: totalReserveCents },
    create: {
      userId,
      monthKey,
      incomeCents: 550000,
      cardReserveCents: totalReserveCents,
    },
  });
}

export async function applyPurchaseAndNotify(params: {
  userId: string;
  creditCardAccountId: string;
  plaidTransactionId?: string | null;
  merchantName: string;
  amountCents: number;
  date: Date;
  pending: boolean;
  plaidPrimaryCategory?: string | null;
  plaidDetailedCategory?: string | null;
  paymentChannel?: string;
  isSimulated?: boolean;
  explicitEnvelopeId?: string | null;
  hoardItemType?: string | null;
  hoardItemLabel?: string | null;
  hoardQuantity?: number | null;
  notify?: boolean;
}) {
  const monthKey = getCurrentMonthKey(params.date);
  await ensureBudgetMonthForUser(params.userId, monthKey);

  const envelopes = await prisma.budgetEnvelope.findMany({
    where: { userId: params.userId, monthKey },
    orderBy: { sortOrder: "asc" },
  });

  const matchedEnvelope =
    (params.explicitEnvelopeId
      ? envelopes.find((e) => e.id === params.explicitEnvelopeId)
      : null) ||
    matchEnvelopeCategory(
      envelopes,
      params.plaidPrimaryCategory,
      params.plaidDetailedCategory,
      params.merchantName
    );

  const isPurchase = params.amountCents > 0;

  const hoardInfo = isPurchase
    ? inferHoardItem({
        merchantName: params.merchantName,
        amountCents: params.amountCents,
        plaidPrimaryCategory: params.plaidPrimaryCategory,
        plaidDetailedCategory: params.plaidDetailedCategory,
        explicitType: params.hoardItemType,
        explicitLabel: params.hoardItemLabel,
        explicitQuantity: params.hoardQuantity,
      })
    : { hoardItemType: null, hoardItemLabel: null, hoardQuantity: null };

  const dollars = (params.amountCents / 100).toFixed(2);
  const qtyText =
    hoardInfo.hoardQuantity && hoardInfo.hoardQuantity > 1
      ? `${hoardInfo.hoardQuantity}× ${hoardInfo.hoardItemLabel}`
      : hoardInfo.hoardItemLabel || params.merchantName;

  const coaching = isPurchase
    ? {
        status: "WITHIN_BUDGET" as const,
        title: `Hoard Drop: +${qtyText} ($${dollars})`,
        body: `From ${params.merchantName} — added straight into your visual pile!`,
        coachingNote: `Added ${qtyText} ($${dollars}) to your hoard.`,
      }
    : {
        status: "WITHIN_BUDGET" as const,
        title: `Card Credit: ${params.merchantName}`,
        body: "Credit or refund applied.",
        coachingNote: "Refund recorded.",
      };

  const tx = await prisma.transaction.create({
    data: {
      userId: params.userId,
      creditCardAccountId: params.creditCardAccountId,
      envelopeId: matchedEnvelope?.id ?? null,
      plaidTransactionId: params.plaidTransactionId ?? null,
      merchantName: params.merchantName,
      amountCents: params.amountCents,
      date: params.date,
      pending: params.pending,
      plaidPrimaryCategory: params.plaidPrimaryCategory ?? null,
      plaidDetailedCategory: params.plaidDetailedCategory ?? null,
      paymentChannel: params.paymentChannel || "in store",
      coachingNote: coaching.coachingNote,
      budgetStatusAtPurchase: coaching.status,
      hoardItemType: hoardInfo.hoardItemType,
      hoardItemLabel: hoardInfo.hoardItemLabel,
      hoardQuantity: hoardInfo.hoardQuantity,
      isSimulated: Boolean(params.isSimulated),
    },
  });

  if (isPurchase) {
    await recalculateMonthTotals(params.userId, monthKey);
    await prisma.creditCardAccount.update({
      where: { id: params.creditCardAccountId },
      data: {
        currentBalanceCents: { increment: params.amountCents },
      },
    });
  }

  let pushResult = { notificationId: "", pushSentCount: 0 };
  if (isPurchase && params.notify !== false) {
    pushResult = await dispatchBudgetNotification({
      userId: params.userId,
      transactionId: tx.id,
      title: coaching.title,
      body: coaching.body,
      severity: coaching.status,
      url: "/dashboard",
    });
  }

  return { transaction: tx, coaching, pushResult };
}
