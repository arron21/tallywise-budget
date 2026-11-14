import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_STYLES = ["explorer", "gamer", "foodie", "cozy"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const avatarStyle = String(body?.avatarStyle || "explorer");
  const avatarColor = String(body?.avatarColor || "#1B4D3E");

  if (!VALID_STYLES.includes(avatarStyle)) {
    return NextResponse.json({ error: "Invalid avatar style." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      avatarStyle,
      avatarColor,
    },
  });

  return NextResponse.json({ ok: true, avatarStyle, avatarColor });
}
