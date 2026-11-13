import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPlaidConfigured } from "@/lib/plaid";
import { syncPlaidItem } from "@/lib/sync-engine";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured in environment variables." },
      { status: 400 }
    );
  }

  const items = await prisma.plaidItem.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
  });

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No live Plaid credit card items linked yet." },
      { status: 400 }
    );
  }

  let totalAdded = 0;
  let totalModified = 0;
  let totalRemoved = 0;

  for (const item of items) {
    const stats = await syncPlaidItem(item.id);
    totalAdded += stats.added;
    totalModified += stats.modified;
    totalRemoved += stats.removed;
  }

  return NextResponse.json({
    ok: true,
    added: totalAdded,
    modified: totalModified,
    removed: totalRemoved,
  });
}
