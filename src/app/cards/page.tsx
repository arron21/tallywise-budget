import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CardsClient } from "@/components/CardsClient";

export default async function CardsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <CardsClient />;
}
