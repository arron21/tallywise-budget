import { prisma } from "./prisma";
import { decryptToken } from "./crypto";
import { getPlaidClient } from "./plaid";
import { applyPurchaseAndNotify, recalculateMonthTotals } from "./budget-engine";
import { getCurrentMonthKey } from "./format";

export async function syncPlaidItem(plaidItemId: string) {
  const item = await prisma.plaidItem.findUnique({
    where: { id: plaidItemId },
    include: { accounts: true },
  });
  if (!item || item.status === "SIMULATED") {
    return { added: 0, modified: 0, removed: 0 };
  }

  const client = getPlaidClient();
  const accessToken = decryptToken(item.accessToken);
  let cursor = item.cursor ?? undefined;
  let hasMore = true;

  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;

  const accountMap = new Map(item.accounts.map((a) => [a.accountId, a.id]));

  while (hasMore) {
    const data = await client.transactions.sync({
      access_token: accessToken,
      cursor,
      count: 100,
    });

    for (const tx of data.added) {
      const creditCardAccountId = accountMap.get(tx.account_id);
      if (!creditCardAccountId) continue;

      const existing = await prisma.transaction.findUnique({
        where: { plaidTransactionId: tx.transaction_id },
      });
      if (existing) continue;

      const amountCents = Math.round(tx.amount * 100);
      await applyPurchaseAndNotify({
        userId: item.userId,
        creditCardAccountId,
        plaidTransactionId: tx.transaction_id,
        merchantName: tx.merchant_name || tx.name,
        amountCents,
        date: new Date(tx.datetime || `${tx.date}T12:00:00Z`),
        pending: tx.pending,
        plaidPrimaryCategory: tx.personal_finance_category?.primary ?? null,
        plaidDetailedCategory: tx.personal_finance_category?.detailed ?? null,
        paymentChannel: tx.payment_channel || "in store",
        isSimulated: false,
        notify: amountCents > 0,
      });
      addedCount += 1;
    }

    for (const tx of data.modified) {
      const existing = await prisma.transaction.findUnique({
        where: { plaidTransactionId: tx.transaction_id },
      });
      if (!existing) continue;

      await prisma.transaction.update({
        where: { id: existing.id },
        data: {
          merchantName: tx.merchant_name || tx.name,
          amountCents: Math.round(tx.amount * 100),
          pending: tx.pending,
          date: new Date(tx.datetime || `${tx.date}T12:00:00Z`),
        },
      });
      modifiedCount += 1;
    }

    for (const removed of data.removed) {
      if (!removed.transaction_id) continue;
      await prisma.transaction
        .delete({ where: { plaidTransactionId: removed.transaction_id } })
        .catch(() => {});
      removedCount += 1;
    }

    cursor = data.next_cursor;
    hasMore = data.has_more;
  }

  await prisma.plaidItem.update({
    where: { id: item.id },
    data: {
      cursor,
      lastSyncedAt: new Date(),
    },
  });

  if (modifiedCount > 0 || removedCount > 0) {
    await recalculateMonthTotals(item.userId, getCurrentMonthKey());
  }

  return { added: addedCount, modified: modifiedCount, removed: removedCount };
}

export async function processSimulatedSwipe(params: {
  userId: string;
  merchantName: string;
  amountCents: number;
  categoryPrimary?: string;
  paymentChannel?: string;
  envelopeId?: string | null;
  hoardItemType?: string | null;
  hoardItemLabel?: string | null;
  hoardQuantity?: number | null;
}) {
  let card = await prisma.creditCardAccount.findFirst({
    where: { userId: params.userId },
    orderBy: { createdAt: "asc" },
  });

  if (!card) {
    const simItem = await prisma.plaidItem.create({
      data: {
        userId: params.userId,
        itemId: `sim-item-${params.userId}`,
        accessToken: "simulated",
        institutionName: "Sapphire Mindful Card (Demo)",
        status: "SIMULATED",
        lastSyncedAt: new Date(),
      },
    });
    card = await prisma.creditCardAccount.create({
      data: {
        userId: params.userId,
        plaidItemId: simItem.id,
        accountId: `sim-acct-${params.userId}`,
        name: "Everyday Cashback Visa",
        mask: "4829",
        currentBalanceCents: 0,
        creditLimitCents: 800000,
        aprBps: 2199,
        isSimulated: true,
      },
    });
  }

  return applyPurchaseAndNotify({
    userId: params.userId,
    creditCardAccountId: card.id,
    merchantName: params.merchantName,
    amountCents: params.amountCents,
    date: new Date(),
    pending: false,
    plaidPrimaryCategory: params.categoryPrimary ?? null,
    paymentChannel: params.paymentChannel || "in store",
    isSimulated: true,
    explicitEnvelopeId: params.envelopeId ?? null,
    hoardItemType: params.hoardItemType ?? null,
    hoardItemLabel: params.hoardItemLabel ?? null,
    hoardQuantity: params.hoardQuantity ?? null,
    notify: true,
  });
}
