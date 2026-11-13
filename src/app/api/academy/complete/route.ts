import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RESEARCH_MODULES } from "@/lib/research";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const moduleSlug = String(body?.moduleSlug || "");
  const reflectionNote = body?.reflectionNote
    ? String(body.reflectionNote).trim()
    : null;

  const exists = RESEARCH_MODULES.some((m) => m.slug === moduleSlug);
  if (!exists) {
    return NextResponse.json({ error: "Unknown academy module." }, { status: 400 });
  }

  const record = await prisma.academyProgress.upsert({
    where: {
      userId_moduleSlug: {
        userId: session.user.id,
        moduleSlug,
      },
    },
    update: {
      reflectionNote,
      completedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      moduleSlug,
      reflectionNote,
    },
  });

  return NextResponse.json({ ok: true, progress: record });
}
