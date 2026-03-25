/**
 * Usage tracking and tier management for realestate-mcp.
 *
 * Free tier:  50 requests/month
 * Pro tier:   unlimited ($19/month)
 *
 * This is a scaffold — in production you would back this with a database
 * (e.g. Redis, Postgres) and integrate with Stripe for billing.
 */

export type Tier = "free" | "pro";

export interface UsageRecord {
  apiKey: string;
  tier: Tier;
  requestsThisMonth: number;
  monthKey: string; // "2026-03"
  createdAt: string;
}

const FREE_TIER_LIMIT = 50;

/** In-memory store — replace with persistent storage in production. */
const store = new Map<string, UsageRecord>();

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getOrCreate(apiKey: string): UsageRecord {
  const month = currentMonthKey();
  let record = store.get(apiKey);
  if (!record || record.monthKey !== month) {
    record = {
      apiKey,
      tier: record?.tier ?? "free",
      requestsThisMonth: 0,
      monthKey: month,
      createdAt: record?.createdAt ?? new Date().toISOString(),
    };
    store.set(apiKey, record);
  }
  return record;
}

export function setTier(apiKey: string, tier: Tier): void {
  const record = getOrCreate(apiKey);
  record.tier = tier;
}

/**
 * Check whether a request is allowed and increment the counter.
 * Returns `{ allowed: true }` or `{ allowed: false, reason: string }`.
 */
export function trackRequest(apiKey: string | undefined): {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  tier: Tier;
} {
  const key = apiKey ?? "anonymous";
  const record = getOrCreate(key);

  if (record.tier === "pro") {
    record.requestsThisMonth++;
    return { allowed: true, tier: "pro" };
  }

  if (record.requestsThisMonth >= FREE_TIER_LIMIT) {
    return {
      allowed: false,
      reason: `Free tier limit reached (${FREE_TIER_LIMIT}/month). Upgrade to Pro for unlimited access at $19/month.`,
      remaining: 0,
      tier: "free",
    };
  }

  record.requestsThisMonth++;
  return {
    allowed: true,
    remaining: FREE_TIER_LIMIT - record.requestsThisMonth,
    tier: "free",
  };
}

/** Get current usage stats for an API key. */
export function getUsage(apiKey: string | undefined): {
  tier: Tier;
  requestsThisMonth: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
} {
  const key = apiKey ?? "anonymous";
  const record = getOrCreate(key);
  const limit = record.tier === "pro" ? ("unlimited" as const) : FREE_TIER_LIMIT;
  const remaining =
    record.tier === "pro"
      ? ("unlimited" as const)
      : Math.max(0, FREE_TIER_LIMIT - record.requestsThisMonth);
  return {
    tier: record.tier,
    requestsThisMonth: record.requestsThisMonth,
    limit,
    remaining,
  };
}

/** Reset the in-memory store (for testing). */
export function resetUsageStore(): void {
  store.clear();
}
