import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dispatchBudgetNotification, isVapidConfigured } from "@/lib/push";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await dispatchBudgetNotification({
    userId: session.user.id,
    title: "Tallywise Alerts Active",
    body: "You'll get instant budget feedback every time a credit card purchase syncs.",
    severity: "WITHIN_BUDGET",
    url: "/dashboard",
  });

  return NextResponse.json({
    ok: true,
    vapidConfigured: isVapidConfigured(),
    pushSentCount: result.pushSentCount,
    notificationId: result.notificationId,
  });
}
