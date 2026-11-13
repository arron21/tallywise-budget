import { PlaidClient, PlaidEnvironment } from "plaid";
import * as jose from "jose";

const globalForPlaid = globalThis as unknown as {
  plaidClient: PlaidClient | undefined;
};

export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function getPlaidEnv(): "sandbox" | "production" {
  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  if (env === "production") return "production";
  return "sandbox";
}

export function getPlaidClient(): PlaidClient {
  if (!isPlaidConfigured()) {
    throw new Error(
      "Plaid credentials (PLAID_CLIENT_ID and PLAID_SECRET) are not configured."
    );
  }
  if (globalForPlaid.plaidClient) {
    return globalForPlaid.plaidClient;
  }

  const envName = getPlaidEnv();
  const environment =
    envName === "production"
      ? PlaidEnvironment.Production
      : PlaidEnvironment.Sandbox;

  const client = new PlaidClient({
    environment,
    clientId: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPlaid.plaidClient = client;
  }
  return client;
}

export async function verifyPlaidWebhookSignature(
  rawBody: string,
  signedJwt: string | null
): Promise<boolean> {
  if (!isPlaidConfigured()) return false;
  if (!signedJwt) {
    return getPlaidEnv() === "sandbox";
  }

  try {
    const protectedHeader = jose.decodeProtectedHeader(signedJwt);
    if (protectedHeader.alg !== "ES256" || !protectedHeader.kid) {
      return false;
    }

    const client = getPlaidClient();
    const keyRes = await client.webhook.getVerificationKey({
      key_id: protectedHeader.kid,
    });
    const jwk = keyRes.key;
    const publicKey = await jose.importJWK(jwk as unknown as jose.JWK, "ES256");

    const { payload } = await jose.jwtVerify(signedJwt, publicKey, {
      maxTokenAge: "5 min",
    });

    const encoder = new TextEncoder();
    const digestBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawBody));
    const expectedHash = Buffer.from(digestBuffer).toString("hex");
    return payload.request_body_sha256 === expectedHash;
  } catch (error) {
    console.error("Plaid webhook JWT verification failed:", error);
    return false;
  }
}
