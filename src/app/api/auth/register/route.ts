import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureBudgetMonthForUser } from "@/lib/budget-engine";
import { getCurrentMonthKey } from "@/lib/format";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(body?.password || "");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        passwordHash,
        monthlyIncomeCents: 550000,
        hourlyNetPayCents: 3200,
        onboardingCompleted: false,
      },
    });

    await ensureBudgetMonthForUser(user.id, getCurrentMonthKey());

    await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: "Emergency Cushion (Pay Yourself First)",
        targetCents: 1000000,
        currentCents: 0,
        monthlyTargetCents: 60000,
        apyBps: 450,
      },
    });

    return NextResponse.json(
      { ok: true, userId: user.id, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 }
    );
  }
}
