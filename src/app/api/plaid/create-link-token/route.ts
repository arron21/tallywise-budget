import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlaidClient, isPlaidConfigured } from "@/lib/plaid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlaidConfigured()) {
    return NextResponse.json(
      {
        error:
          "Plaid API keys are not configured yet. Add PLAID_CLIENT_ID and PLAID_SECRET to environment variables, or use the Live Purchase Simulator.",
      },
      { status: 400 }
    );
  }

  try {
    const client = getPlaidClient();
    const origin =
      req.headers.get("origin") ||
      process.env.AUTH_URL ||
      "https://tallywise.vercel.app";
    const webhookUrl =
      process.env.PLAID_WEBHOOK_URL || `${origin}/api/plaid/webhook`;

    const response = await client.link.createToken({
      user: { client_user_id: session.user.id },
      client_name: "Tallywise Budget",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
      webhook: webhookUrl.startsWith("https://") ? webhookUrl : undefined,
      account_filters: {
        credit: {
          account_subtypes: ["credit card"],
        },
      },
    });

    return NextResponse.json({
      link_token: response.link_token,
      expiration: response.expiration,
    });
  } catch (error) {
    console.error("Plaid createToken failed:", error);
    return NextResponse.json(
      { error: "Unable to create Plaid Link token." },
      { status: 500 }
    );
  }
}
