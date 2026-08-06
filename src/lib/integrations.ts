/**
 * Client for /v1/integrations/* backend endpoints.
 *
 * Kept separate from the main ApiClient: these calls are JWT-authenticated,
 * one-shot, and never routed through demo mode. All response-field parsing
 * lives here so a backend field rename is a one-line fix.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SpendProvider = "openai" | "anthropic";

export const SPEND_PROVIDERS: Record<
  SpendProvider,
  {
    label: string;
    keyPrefix: string;
    keyName: string;
    consoleUrl: string;
    consoleLabel: string;
  }
> = {
  openai: {
    label: "OpenAI",
    keyPrefix: "sk-admin-",
    keyName: "OpenAI Admin key",
    consoleUrl: "https://platform.openai.com/settings/organization/admin-keys",
    consoleLabel: "platform.openai.com → Organization → Admin keys",
  },
  anthropic: {
    label: "Anthropic",
    keyPrefix: "sk-ant-admin-",
    keyName: "Anthropic Admin key",
    consoleUrl: "https://console.anthropic.com/settings/admin-keys",
    consoleLabel: "console.anthropic.com → Settings → Admin keys",
  },
};

export interface SpendCostDay {
  date: string;
  amountUsd: number;
}

export interface SpendCostsResult {
  totalUsd: number;
  days: SpendCostDay[];
}

/** Thin parsing layer — tolerate minor field-name drift in one place. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSpendCosts(data: any): SpendCostsResult {
  const rawDays: unknown[] = data?.days ?? data?.daily ?? [];
  const days: SpendCostDay[] = (Array.isArray(rawDays) ? rawDays : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => ({
      date: d?.date ?? d?.day ?? "",
      amountUsd: Number(d?.amount_usd ?? d?.amountUsd ?? d?.amount ?? 0),
    }),
  );
  const total = data?.total_usd ?? data?.totalUsd ?? data?.total;
  return {
    totalUsd:
      total != null
        ? Number(total)
        : days.reduce((sum, d) => sum + d.amountUsd, 0),
    days,
  };
}

/**
 * Fetch the account's recent spend for a provider via the backend proxy. The
 * admin key is passed through and never stored. Backend errors surface their
 * human-readable `detail` message verbatim.
 */
export async function fetchProviderCosts(
  provider: SpendProvider,
  adminKey: string,
  days = 30,
): Promise<SpendCostsResult> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  if (!token) {
    throw new Error("You need to be signed in to import your spend.");
  }

  const response = await fetch(`${API_URL}/v1/integrations/${provider}/costs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ api_key: adminKey, days }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Could not fetch your ${SPEND_PROVIDERS[provider].label} spend. Please try again.`,
    );
  }

  return parseSpendCosts(data);
}

/** Back-compat alias for the original OpenAI-only entry point. */
export function fetchOpenAICosts(openaiAdminKey: string, days = 30) {
  return fetchProviderCosts("openai", openaiAdminKey, days);
}
