// Snapshots `plan.usage.monthly` (/api/v1/me) and `topupBalanceCredits`
// (/api/v1/credits/balance); diffs them per run for credit attribution.

export interface CreditSnapshot {
  planUsed: number;
  topupBalance: number;
}

export interface CreditDiff {
  charged: number; // total drained: planΔ + topupΔ (clamped ≥ 0)
  fromPlan: number;
  fromTopup: number;
}

export interface CreditClient {
  read(): Promise<CreditSnapshot | null>;
}

export function createCreditClient(opts: { baseUrl: string; apiKey: string }): CreditClient {
  const headers = { Authorization: `Bearer ${opts.apiKey}` };
  return {
    async read() {
      try {
        const [meRes, balRes] = await Promise.all([
          fetch(`${opts.baseUrl}/api/v1/me`, { headers }),
          fetch(`${opts.baseUrl}/api/v1/credits/balance`, { headers }),
        ]);
        if (!meRes.ok) return null;
        const me = (await meRes.json()) as { plan?: { usage?: { monthly?: number } } };
        const planUsed = me.plan?.usage?.monthly ?? 0;
        // Top-up balance is optional — orgs without x402 top-ups still resolve
        // fine via /api/v1/me alone, so a 4xx here is non-fatal.
        let topupBalance = 0;
        if (balRes.ok) {
          const bal = (await balRes.json()) as { topupBalanceCredits?: number };
          topupBalance = bal.topupBalanceCredits ?? 0;
        }
        return { planUsed, topupBalance };
      } catch {
        return null;
      }
    },
  };
}

// Plan-credit counters reset at month boundaries — clamp negative deltas.
export function diffSnapshots(before: CreditSnapshot | null, after: CreditSnapshot | null): CreditDiff | null {
  if (!before || !after) return null;
  const fromPlan = Math.max(0, after.planUsed - before.planUsed);
  const fromTopup = Math.max(0, before.topupBalance - after.topupBalance);
  return { charged: fromPlan + fromTopup, fromPlan, fromTopup };
}
