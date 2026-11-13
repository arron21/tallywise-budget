import * as webpush from "web-push";
import { prisma } from "./prisma";

let vapidConfigured = false;

export function isVapidConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

function ensureVapid(): boolean {
  if (!isVapidConfigured()) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:alerts@tallywise.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    vapidConfigured = true;
  }
  return true;
}

export interface PushDispatchInput {
  userId: string;
  transactionId?: string | null;
  title: string;
  body: string;
  severity: "WITHIN_BUDGET" | "NEAR_LIMIT" | "OVER_BUDGET" | "SAVINGS_WIN";
  url?: string;
}

export async function dispatchBudgetNotification(
  input: PushDispatchInput
): Promise<{ notificationId: string; pushSentCount: number }> {
  const canSendPush = ensureVapid();
  let pushSentCount = 0;

  if (canSendPush) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: input.userId },
    });

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      severity: input.severity,
      transactionId: input.transactionId ?? null,
      url: input.url || "/dashboard",
      tag: input.transactionId
        ? `tx-${input.transactionId}`
        : `tallywise-${Date.now()}`,
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          pushSentCount += 1;
        } catch (err: unknown) {
          const statusCode =
            typeof err === "object" && err !== null && "statusCode" in err
              ? Number((err as { statusCode?: number }).statusCode)
              : 0;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          } else {
            console.error("Web Push dispatch error:", err);
          }
        }
      })
    );
  }

  const event = await prisma.notificationEvent.create({
    data: {
      userId: input.userId,
      transactionId: input.transactionId ?? null,
      title: input.title,
      body: input.body,
      severity: input.severity,
      deliveredViaPush: pushSentCount > 0,
    },
  });

  return { notificationId: event.id, pushSentCount };
}
