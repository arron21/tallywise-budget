import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const endpoint = String(body?.endpoint || "");
    const p256dh = String(body?.keys?.p256dh || "");
    const authSecret = String(body?.keys?.auth || "");

    if (!endpoint || !p256dh || !authSecret) {
      return NextResponse.json(
        { error: "Invalid Web Push subscription payload." },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh,
        auth: authSecret,
        userAgent: req.headers.get("user-agent") || null,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: authSecret,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const endpoint = String(body?.endpoint || "");
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id, endpoint },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to remove push subscription." },
      { status: 500 }
    );
  }
}
