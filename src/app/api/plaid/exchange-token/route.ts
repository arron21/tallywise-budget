import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlaidClient, isPlaidConfigured } from "@/lib/plaid";
import { encryptToken } from "@/lib/crypto";
import { syncPlaidItem } from "@/lib/sync-engine";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid credentials are not configured." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const publicToken = String(body?.public_token || "");
    const institutionId = body?.institution?.institution_id
      ? String(body.institution.institution_id)
      : null;
    const institutionName = String(
      body?.institution?.name || "Connected Card Issuer"
    );

    if (!publicToken) {
      return NextResponse.json(
        { error: "Missing Plaid public_token." },
        { status: 400 }
      );
    }

    const client = getPlaidClient();
    const exchangeRes = await client.item.exchangePublicToken({
      public_token: publicToken,
    });

    const accessToken = exchangeRes.access_token;
    const itemId = exchangeRes.item_id;

    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId: session.user.id,
        itemId,
        accessToken: encryptToken(accessToken),
        institutionId,
        institutionName,
        status: "ACTIVE",
      },
    });

    const accountsRes = await client.accounts.get({
      access_token: accessToken,
    });

    const creditAccounts = accountsRes.accounts.filter(
      (acct) => acct.type === "credit" || accountsRes.accounts.length === 1
    );

    for (const acct of creditAccounts) {
      await prisma.creditCardAccount.upsert({
        where: { accountId: acct.account_id },
        update: {
          name: acct.name,
          officialName: acct.official_name ?? null,
          mask: acct.mask ?? null,
          currentBalanceCents: Math.round((acct.balances.current ?? 0) * 100),
          creditLimitCents:
            acct.balances.limit != null
              ? Math.round(acct.balances.limit * 100)
              : null,
        },
        create: {
          userId: session.user.id,
          plaidItemId: plaidItem.id,
          accountId: acct.account_id,
          name: acct.name,
          officialName: acct.official_name ?? null,
          mask: acct.mask ?? null,
          currentBalanceCents: Math.round((acct.balances.current ?? 0) * 100),
          creditLimitCents:
            acct.balances.limit != null
              ? Math.round(acct.balances.limit * 100)
              : null,
          isSimulated: false,
        },
      });
    }

    const syncStats = await syncPlaidItem(plaidItem.id);

    return NextResponse.json({
      ok: true,
      plaidItemId: plaidItem.id,
      accountsLinked: creditAccounts.length,
      syncStats,
    });
  } catch (error) {
    console.error("Plaid exchange-token error:", error);
    return NextResponse.json(
      { error: "Failed to link credit card with Plaid." },
      { status: 500 }
    );
  }
}
