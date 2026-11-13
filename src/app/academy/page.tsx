import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AcademyClient } from "@/components/AcademyClient";

export default async function AcademyPage() {
  const session = await auth();
  let progress: Array<{ moduleSlug: string; reflectionNote: string | null }> = [];
  let hourlyDollars = 32;

  if (session?.user?.id) {
    const [rows, user] = await Promise.all([
      prisma.academyProgress.findMany({
        where: { userId: session.user.id },
        select: { moduleSlug: true, reflectionNote: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hourlyNetPayCents: true },
      }),
    ]);
    progress = rows;
    if (user?.hourlyNetPayCents) {
      hourlyDollars = Math.round(user.hourlyNetPayCents / 100);
    }
  }

  return (
    <AcademyClient
      isLoggedIn={Boolean(session?.user?.id)}
      initialProgress={progress}
      defaultHourlyDollars={hourlyDollars}
    />
  );
}
