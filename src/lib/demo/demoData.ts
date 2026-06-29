/**
 * Demo mode dataset — a realistic, internally-consistent story.
 *
 * "NovaDesk AI" is a fictional customer-support AI startup running 7 agents
 * in production, spending ~$3.4k/month on LLM calls, with ~$1.5k/month of
 * discoverable savings on the Optimizations page (the demo's proof moment).
 *
 * All aggregates (overview, timeseries, agents, models) are derived from the
 * same agent profiles so the numbers cross-check — an engineer poking at the
 * demo should never catch the data contradicting itself.
 */

import type {
  AnalyticsOverview,
  AgentStats,
  ModelStats,
  TimeSeriesPoint,
  Event,
  OptimizationSuggestion,
  OptimizationSummary,
  Recommendation,
  ProjectInfo,
  ProjectListItem,
  ProjectMember,
  ProjectBudgetSettings,
  NotificationListResponse,
  UserProfile,
  SessionInfo,
  ExecutiveReport,
  MetricDelta,
} from "@/lib/api";

export const DEMO_PROJECT_ID = "demo-project";
export const DEMO_PROJECT_NAME = "NovaDesk AI — Production";

// ── Deterministic PRNG so the demo looks alive but stays consistent ──────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// USD per 1M tokens (input, output) — matches real provider pricing.
const PRICING: Record<string, [number, number]> = {
  "gpt-4o": [2.5, 10.0],
  "gpt-4o-mini": [0.15, 0.6],
  "gpt-4.1": [2.0, 8.0],
  "claude-sonnet-4-5": [3.0, 15.0],
  "claude-opus-4-1": [15.0, 75.0],
};

interface AgentProfile {
  name: string;
  model: string;
  callsPerDay: number;
  inTokens: number;
  outTokens: number;
  avgLatencyMs: number;
  errorRate: number;
}

const AGENTS: AgentProfile[] = [
  { name: "support-triage-agent", model: "gpt-4o", callsPerDay: 3200, inTokens: 1800, outTokens: 420, avgLatencyMs: 950, errorRate: 0.012 },
  { name: "faq-bot", model: "gpt-4o", callsPerDay: 4100, inTokens: 900, outTokens: 220, avgLatencyMs: 720, errorRate: 0.034 },
  { name: "research-agent", model: "claude-sonnet-4-5", callsPerDay: 420, inTokens: 9000, outTokens: 1800, avgLatencyMs: 4200, errorRate: 0.018 },
  { name: "report-writer", model: "gpt-4.1", callsPerDay: 600, inTokens: 6500, outTokens: 2400, avgLatencyMs: 5100, errorRate: 0.009 },
  { name: "code-review-agent", model: "claude-opus-4-1", callsPerDay: 90, inTokens: 7000, outTokens: 1400, avgLatencyMs: 6300, errorRate: 0.011 },
  { name: "email-drafter", model: "gpt-4o-mini", callsPerDay: 2500, inTokens: 700, outTokens: 300, avgLatencyMs: 880, errorRate: 0.007 },
  { name: "sentiment-classifier", model: "gpt-4o", callsPerDay: 5500, inTokens: 280, outTokens: 12, avgLatencyMs: 340, errorRate: 0.004 },
];

function perCallCost(p: AgentProfile): number {
  const [inP, outP] = PRICING[p.model];
  return (p.inTokens * inP + p.outTokens * outP) / 1_000_000;
}

function rangeToDays(range: string): number {
  const map: Record<string, number> = { "1h": 1, "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
  return map[range] ?? 7;
}

/**
 * Per-day activity multiplier: weekend dips, slight growth trend, and a
 * seeded wobble so the chart looks like real traffic.
 * `daysAgo` = 0 is today.
 */
function dayMultiplier(daysAgo: number): number {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dow = date.getDay();
  const weekend = dow === 0 || dow === 6 ? 0.55 : 1.0;
  const trend = 1.0 - daysAgo * 0.0035; // ~10% growth over 30 days
  const rand = mulberry32(daysAgo * 7919)();
  const wobble = 0.88 + rand * 0.24; // ±12%
  return weekend * trend * wobble;
}

// ── Analytics ─────────────────────────────────────────────────────────────

export function demoOverview(range: string): AnalyticsOverview {
  const days = rangeToDays(range);
  let mult = 0;
  for (let d = 0; d < days; d++) mult += dayMultiplier(d);
  if (range === "1h") mult = dayMultiplier(0) / 24;
  if (range === "24h") mult = dayMultiplier(0);

  let cost = 0, calls = 0, inTok = 0, outTok = 0, latWeighted = 0, errWeighted = 0;
  for (const p of AGENTS) {
    const c = p.callsPerDay * mult;
    calls += c;
    cost += c * perCallCost(p);
    inTok += c * p.inTokens;
    outTok += c * p.outTokens;
    latWeighted += c * p.avgLatencyMs;
    errWeighted += c * p.errorRate;
  }
  const totalTokens = inTok + outTok;
  return {
    total_cost: round2(cost),
    total_calls: Math.round(calls),
    total_tokens: Math.round(totalTokens),
    total_input_tokens: Math.round(inTok),
    total_output_tokens: Math.round(outTok),
    avg_cost_per_call: calls > 0 ? cost / calls : 0,
    avg_tokens_per_call: calls > 0 ? Math.round(totalTokens / calls) : 0,
    avg_latency_ms: calls > 0 ? Math.round(latWeighted / calls) : 0,
    success_rate: calls > 0 ? round2(100 * (1 - errWeighted / calls)) : 100,
  };
}

export function demoAgentStats(range: string, limit: number): AgentStats[] {
  const days = rangeToDays(range);
  let mult = 0;
  for (let d = 0; d < days; d++) mult += dayMultiplier(d);

  return AGENTS.map((p) => {
    const calls = Math.round(p.callsPerDay * mult);
    return {
      agent_name: p.name,
      total_calls: calls,
      total_cost: round2(calls * perCallCost(p)),
      total_tokens: Math.round(calls * (p.inTokens + p.outTokens)),
      avg_latency_ms: p.avgLatencyMs,
      success_rate: round2(100 * (1 - p.errorRate)),
    };
  })
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, limit);
}

export function demoModelStats(range: string, limit: number): ModelStats[] {
  const days = rangeToDays(range);
  let mult = 0;
  for (let d = 0; d < days; d++) mult += dayMultiplier(d);

  const byModel = new Map<string, ModelStats>();
  for (const p of AGENTS) {
    const calls = Math.round(p.callsPerDay * mult);
    const existing = byModel.get(p.model) ?? {
      model: p.model,
      total_calls: 0,
      total_cost: 0,
      total_tokens: 0,
      avg_latency_ms: 0,
      input_tokens: 0,
      output_tokens: 0,
    };
    const latencyTotal =
      existing.avg_latency_ms * existing.total_calls + p.avgLatencyMs * calls;
    existing.total_calls += calls;
    existing.total_cost = round2(existing.total_cost + calls * perCallCost(p));
    existing.input_tokens += Math.round(calls * p.inTokens);
    existing.output_tokens += Math.round(calls * p.outTokens);
    existing.total_tokens = existing.input_tokens + existing.output_tokens;
    existing.avg_latency_ms =
      existing.total_calls > 0
        ? Math.round(latencyTotal / existing.total_calls)
        : 0;
    byModel.set(p.model, existing);
  }
  return [...byModel.values()]
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, limit);
}

export function demoTimeSeries(range: string): TimeSeriesPoint[] {
  const days = rangeToDays(range);
  const points: TimeSeriesPoint[] = [];

  if (range === "1h" || range === "24h") {
    // Hourly points with a day/night traffic curve.
    const hours = range === "1h" ? 1 : 24;
    const now = new Date();
    for (let h = hours - 1; h >= 0; h--) {
      const ts = new Date(now.getTime() - h * 3600_000);
      const hourOfDay = ts.getHours();
      const curve = 0.45 + 0.55 * Math.sin((Math.PI * (hourOfDay - 4)) / 20) ** 2;
      const rand = mulberry32(hourOfDay * 31 + 17)();
      const mult = (dayMultiplier(0) / 24) * curve * (0.85 + rand * 0.3) * 1.6;
      points.push(buildPoint(ts, mult));
    }
    return points;
  }

  for (let d = days - 1; d >= 0; d--) {
    const ts = new Date();
    ts.setDate(ts.getDate() - d);
    ts.setHours(0, 0, 0, 0);
    points.push(buildPoint(ts, dayMultiplier(d)));
  }
  return points;
}

function buildPoint(ts: Date, mult: number): TimeSeriesPoint {
  let cost = 0, calls = 0, tokens = 0;
  for (const p of AGENTS) {
    const c = p.callsPerDay * mult;
    calls += c;
    cost += c * perCallCost(p);
    tokens += c * (p.inTokens + p.outTokens);
  }
  return {
    timestamp: ts.toISOString(),
    cost: round2(cost),
    calls: Math.round(calls),
    tokens: Math.round(tokens),
  };
}

// ── Events (raw log) ──────────────────────────────────────────────────────

const SAMPLE_ERRORS = [
  "Rate limit exceeded (429): retry after 12s",
  "Context length exceeded for model",
  "Upstream timeout after 30000ms",
];

let eventCache: Event[] | null = null;

/** ~480 events over the last 48h, interleaved across agents, newest first. */
export function demoEvents(): Event[] {
  if (eventCache) return eventCache;
  const rand = mulberry32(424242);
  const events: Event[] = [];
  const now = Date.now();
  const totalPerDay = AGENTS.reduce((s, p) => s + p.callsPerDay, 0);

  for (let i = 0; i < 480; i++) {
    // Pick an agent weighted by call volume.
    let pick = rand() * totalPerDay;
    let profile = AGENTS[0];
    for (const p of AGENTS) {
      pick -= p.callsPerDay;
      if (pick <= 0) {
        profile = p;
        break;
      }
    }
    const ageMs = Math.floor(rand() * 48 * 3600_000 * (0.3 + 0.7 * rand()));
    const inTok = Math.max(20, Math.round(profile.inTokens * (0.6 + rand() * 0.8)));
    const outTok = Math.max(5, Math.round(profile.outTokens * (0.6 + rand() * 0.8)));
    const [inP, outP] = PRICING[profile.model];
    const failed = rand() < profile.errorRate * 2; // slightly over-sample errors so they're visible
    events.push({
      id: `demo-evt-${i.toString().padStart(4, "0")}`,
      project_id: DEMO_PROJECT_ID,
      agent_name: profile.name,
      model: profile.model,
      input_tokens: inTok,
      output_tokens: failed ? 0 : outTok,
      total_tokens: inTok + (failed ? 0 : outTok),
      cost: failed ? 0 : (inTok * inP + outTok * outP) / 1_000_000,
      latency_ms: Math.round(profile.avgLatencyMs * (0.5 + rand() * 1.4)),
      timestamp: new Date(now - ageMs).toISOString(),
      success: !failed,
      error: failed ? SAMPLE_ERRORS[Math.floor(rand() * SAMPLE_ERRORS.length)] : null,
    });
  }
  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  eventCache = events;
  return events;
}

export function demoEventCount(): number {
  // Matches the 30-day overview scale, not just the 480 in the sample log.
  return demoOverview("30d").total_calls;
}

// ── Optimizations (the proof moment) ─────────────────────────────────────

export function demoOptimizationSuggestions(): OptimizationSuggestion[] {
  const monthly = (p: AgentProfile) => p.callsPerDay * 30 * perCallCost(p);
  const codeReview = AGENTS.find((a) => a.name === "code-review-agent")!;
  const sentiment = AGENTS.find((a) => a.name === "sentiment-classifier")!;
  const faq = AGENTS.find((a) => a.name === "faq-bot")!;
  const triage = AGENTS.find((a) => a.name === "support-triage-agent")!;

  return [
    {
      type: "model_downgrade",
      title: "Switch code-review-agent to Claude Sonnet 4.5",
      description:
        "code-review-agent runs Claude Opus 4.1 for structured diff reviews. Benchmarks for this output profile show Sonnet 4.5 matches review quality at 1/5th the price.",
      estimated_savings_monthly: round2(monthly(codeReview) * 0.8),
      estimated_savings_percent: 80,
      priority: "high",
      action_items: [
        "Change model parameter from claude-opus-4-1 to claude-sonnet-4-5",
        "A/B the next 100 reviews against the Opus baseline",
        "Keep Opus as fallback for diffs over 5k lines",
      ],
      agent_name: "code-review-agent",
      model: "claude-opus-4-1",
      alternative_model: "claude-sonnet-4-5",
      metrics: {
        current_calls: codeReview.callsPerDay * 30,
        current_monthly_cost: round2(monthly(codeReview)),
        avg_input_tokens: codeReview.inTokens,
        avg_output_tokens: codeReview.outTokens,
        savings_percentage: 80,
        quality_impact: "negligible for structured review tasks",
        source: "learned",
        confidence_score: 0.92,
        times_implemented: 14,
        savings_accuracy: 93,
      },
    },
    {
      type: "model_downgrade",
      title: "sentiment-classifier doesn't need GPT-4o",
      description:
        "This agent emits 12-token classification labels. GPT-4o-mini handles single-label classification at near-identical accuracy for 94% less.",
      estimated_savings_monthly: round2(monthly(sentiment) * 0.94),
      estimated_savings_percent: 94,
      priority: "high",
      action_items: [
        "Swap gpt-4o for gpt-4o-mini in the classifier config",
        "Validate on a 500-sample labelled set before full rollout",
      ],
      agent_name: "sentiment-classifier",
      model: "gpt-4o",
      alternative_model: "gpt-4o-mini",
      metrics: {
        current_calls: sentiment.callsPerDay * 30,
        current_monthly_cost: round2(monthly(sentiment)),
        avg_input_tokens: sentiment.inTokens,
        avg_output_tokens: sentiment.outTokens,
        savings_percentage: 94,
        quality_impact: "minimal for classification tasks",
        source: "learned",
        confidence_score: 0.97,
        times_implemented: 31,
        savings_accuracy: 96,
      },
    },
    {
      type: "caching",
      title: "Cache faq-bot responses — 38% duplicate prompts",
      description:
        "38% of faq-bot calls in the last 30 days were byte-identical prompts (top repeats: password reset, billing cycle, plan limits). A response cache with a 24h TTL eliminates most of them.",
      estimated_savings_monthly: round2(monthly(faq) * 0.38),
      estimated_savings_percent: 38,
      priority: "medium",
      action_items: [
        "Add a prompt-hash response cache in front of faq-bot",
        "Start with a 24h TTL and exclude account-specific queries",
      ],
      agent_name: "faq-bot",
      model: "gpt-4o",
      alternative_model: null,
      metrics: {
        current_calls: faq.callsPerDay * 30,
        current_monthly_cost: round2(monthly(faq)),
        duplicate_rate: 0.38,
        savings_percentage: 38,
        source: "dynamic",
      },
    },
    {
      type: "model_downgrade",
      title: "Pilot GPT-4o-mini for support-triage-agent",
      description:
        "Triage is a routing decision, not generation. Teams with this call profile cut cost ~88% moving routing to gpt-4o-mini; worth piloting on 10% of traffic.",
      estimated_savings_monthly: round2(monthly(triage) * 0.88),
      estimated_savings_percent: 88,
      priority: "medium",
      action_items: [
        "Route 10% of triage traffic to gpt-4o-mini",
        "Compare mis-route rate against the GPT-4o baseline for a week",
      ],
      agent_name: "support-triage-agent",
      model: "gpt-4o",
      alternative_model: "gpt-4o-mini",
      metrics: {
        current_calls: triage.callsPerDay * 30,
        current_monthly_cost: round2(monthly(triage)),
        avg_input_tokens: triage.inTokens,
        avg_output_tokens: triage.outTokens,
        savings_percentage: 88,
        quality_impact: "low risk — pilot recommended",
        source: "dynamic",
        confidence_score: 0.71,
      },
    },
  ];
}

export function demoOptimizationSummary(): OptimizationSummary {
  const suggestions = demoOptimizationSuggestions();
  const totalSavings = suggestions.reduce(
    (s, x) => s + (x.estimated_savings_monthly ?? 0),
    0,
  );
  const spend = demoOverview("30d").total_cost;
  const byType: Record<string, { count: number; savings: number }> = {};
  for (const s of suggestions) {
    byType[s.type] = byType[s.type] ?? { count: 0, savings: 0 };
    byType[s.type].count += 1;
    byType[s.type].savings = round2(
      byType[s.type].savings + (s.estimated_savings_monthly ?? 0),
    );
  }
  return {
    total_potential_savings_monthly: round2(totalSavings),
    total_potential_savings_percent: round2((100 * totalSavings) / spend),
    current_monthly_spend: spend,
    suggestion_count: suggestions.length,
    high_priority_count: suggestions.filter((s) => s.priority === "high").length,
    by_type: byType,
    effectiveness: {
      total_recommendations: 11,
      implemented: 3,
      dismissed: 2,
      pending: 4,
      expired: 2,
      implementation_rate: 27.3,
      estimated_savings_total: 612.4,
      actual_savings_total: 559.1,
      accuracy_percent: 91.3,
    },
    suggestions,
    has_data: true,
    has_baselines: true,
    event_count: demoEventCount(),
    empty_reason: null,
  };
}

export function demoRecommendations(): Recommendation[] {
  const now = Date.now();
  return demoOptimizationSuggestions().map((s, i) => ({
    id: `demo-rec-${i + 1}`,
    type: s.type,
    title: s.title,
    description: s.description,
    agent_name: s.agent_name,
    model: s.model,
    alternative_model: s.alternative_model,
    estimated_monthly_savings: s.estimated_savings_monthly ?? 0,
    estimated_savings_percent: s.estimated_savings_percent,
    created_at: new Date(now - (i + 1) * 86400_000).toISOString(),
    expires_at: new Date(now + (14 - i) * 86400_000).toISOString(),
  }));
}

// ── Project / team / account ──────────────────────────────────────────────

export function demoProject(): ProjectInfo {
  return {
    id: DEMO_PROJECT_ID,
    name: DEMO_PROJECT_NAME,
    description:
      "Demo workspace — sample data from a fictional AI support platform.",
    api_key: null,
    key_prefix: "ac_demo",
    created_at: new Date(Date.now() - 92 * 86400_000).toISOString(),
    is_active: true,
    monthly_budget_usd: 3500,
    budget_enforcement_mode: "warn",
    budget_alert_thresholds: [50, 75, 90],
  };
}

export function demoProjectList(): ProjectListItem[] {
  return [
    {
      id: DEMO_PROJECT_ID,
      name: DEMO_PROJECT_NAME,
      description:
        "Demo workspace — sample data from a fictional AI support platform.",
      is_active: true,
      role: "admin",
      is_owner: true,
      is_pending: false,
      created_at: new Date(Date.now() - 92 * 86400_000).toISOString(),
    },
  ];
}

export function demoBudget(): ProjectBudgetSettings {
  const dayOfMonth = new Date().getDate();
  let spend = 0;
  for (let d = 0; d < Math.min(dayOfMonth, 31); d++) {
    spend += AGENTS.reduce(
      (s, p) => s + p.callsPerDay * perCallCost(p) * dayMultiplier(d),
      0,
    );
  }
  const now = new Date();
  return {
    project_id: DEMO_PROJECT_ID,
    monthly_budget_usd: 3500,
    budget_enforcement_mode: "warn",
    budget_alert_thresholds: [50, 75, 90],
    current_month_spend: round2(spend),
    current_month_spend_usd: round2(spend),
    utilization_percent: round2((100 * spend) / 3500),
    period_key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    budget_currency: "USD",
    fx_rate: 1,
  };
}

export function demoMembers(): ProjectMember[] {
  const monthsAgo = (n: number) =>
    new Date(Date.now() - n * 30 * 86400_000).toISOString();
  return [
    {
      id: "demo-member-1",
      user_id: "demo-user",
      email: "demo@agentcost.dev",
      name: "Demo Explorer",
      role: "admin",
      is_owner: true,
      is_pending: false,
      invited_at: monthsAgo(3),
      accepted_at: monthsAgo(3),
    },
    {
      id: "demo-member-2",
      user_id: "demo-user-2",
      email: "maya@novadesk.example",
      name: "Maya Chen",
      role: "member",
      is_owner: false,
      is_pending: false,
      invited_at: monthsAgo(2),
      accepted_at: monthsAgo(2),
    },
    {
      id: "demo-member-3",
      user_id: "demo-user-3",
      email: "dev@novadesk.example",
      name: "Dev Patel",
      role: "viewer",
      is_owner: false,
      is_pending: false,
      invited_at: monthsAgo(1),
      accepted_at: monthsAgo(1),
    },
  ];
}

export function demoProfile(): UserProfile {
  return {
    id: "demo-user",
    email: "demo@agentcost.dev",
    name: "Demo Explorer",
    avatar_url: null,
    email_verified: true,
    is_active: true,
    created_at: new Date(Date.now() - 92 * 86400_000).toISOString(),
    last_login_at: new Date().toISOString(),
    auth_provider: "demo",
    user_number: null,
    milestone_badge: null,
  };
}

export function demoSessions(): { sessions: SessionInfo[]; total: number } {
  return {
    sessions: [
      {
        id: "demo-session-1",
        device_info: "This browser (demo)",
        ip_address: null,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400_000).toISOString(),
        is_current: true,
      },
    ],
    total: 1,
  };
}

export function demoNotifications(): NotificationListResponse {
  const summary = demoOptimizationSummary();
  return {
    items: [
      {
        id: "demo-notif-1",
        type: "optimization_found",
        severity: "info",
        title: `$${Math.round(summary.total_potential_savings_monthly)}/mo in savings found`,
        body: `${summary.suggestion_count} optimization opportunities detected across your agents — ${summary.high_priority_count} high priority.`,
        link: "/optimizations",
        project_id: DEMO_PROJECT_ID,
        payload: null,
        is_read: false,
        read_at: null,
        created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
      },
      {
        id: "demo-notif-2",
        type: "budget_threshold",
        severity: "warning",
        title: "Spend is pacing ahead of budget",
        body: "At the current run rate, this project will reach ~96% of its $3,500 monthly budget.",
        link: "/settings",
        project_id: DEMO_PROJECT_ID,
        payload: null,
        is_read: false,
        read_at: null,
        created_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
      },
    ],
    total: 2,
    unread_count: 2,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

// ── Executive Report ──────────────────────────────────────────────────────

/** Call-weighted aggregate over the window [offsetDays, offsetDays + days). */
function windowAgg(offsetDays: number, days: number) {
  let mult = 0;
  for (let d = 0; d < days; d++) mult += dayMultiplier(offsetDays + d);
  let cost = 0, calls = 0, inTok = 0, outTok = 0, latW = 0, errW = 0;
  for (const p of AGENTS) {
    const c = p.callsPerDay * mult;
    calls += c;
    cost += c * perCallCost(p);
    inTok += c * p.inTokens;
    outTok += c * p.outTokens;
    latW += c * p.avgLatencyMs;
    errW += c * p.errorRate;
  }
  return {
    mult,
    cost,
    calls,
    inTok,
    outTok,
    tokens: inTok + outTok,
    avgLat: calls > 0 ? latW / calls : 0,
    successRate: calls > 0 ? 100 * (1 - errW / calls) : 100,
  };
}

function mkDelta(cur: number, prev: number): MetricDelta {
  const change = prev ? ((cur - prev) / Math.abs(prev)) * 100 : 0;
  const direction =
    Math.abs(change) < 0.05 ? "neutral" : change > 0 ? "up" : "down";
  return {
    current: round6(cur),
    previous: round6(prev),
    change_percent: round2(change),
    direction,
  };
}

export function demoExecutiveReport(opts: {
  range?: string;
  start?: string;
  end?: string;
  topN?: number;
}): ExecutiveReport {
  const topN = opts.topN ?? 10;
  const now = new Date();
  let days: number;
  let rangeLabel: string;
  let isCustom = false;
  let tsRange: string;
  let periodStart: Date;
  let periodEnd = new Date();

  if (opts.start && opts.end) {
    isCustom = true;
    periodStart = new Date(opts.start);
    periodEnd = new Date(opts.end);
    days = Math.max(
      1,
      Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400_000),
    );
    rangeLabel = "Custom range";
    tsRange = days <= 1 ? "24h" : days <= 7 ? "7d" : days <= 30 ? "30d" : "90d";
  } else if (opts.range === "mtd") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    days = Math.max(
      1,
      Math.round((now.getTime() - periodStart.getTime()) / 86400_000),
    );
    rangeLabel = "Month to date";
    tsRange = days <= 7 ? "7d" : days <= 30 ? "30d" : "90d";
  } else {
    const r = opts.range ?? "30d";
    days = rangeToDays(r);
    rangeLabel = r;
    tsRange = r;
    periodStart = new Date(now.getTime() - days * 86400_000);
  }

  const cur = windowAgg(0, days);
  const prev = windowAgg(days, days);

  const overview: AnalyticsOverview = {
    total_cost: round2(cur.cost),
    total_calls: Math.round(cur.calls),
    total_tokens: Math.round(cur.tokens),
    total_input_tokens: Math.round(cur.inTok),
    total_output_tokens: Math.round(cur.outTok),
    avg_cost_per_call: cur.calls > 0 ? cur.cost / cur.calls : 0,
    avg_tokens_per_call: cur.calls > 0 ? Math.round(cur.tokens / cur.calls) : 0,
    avg_latency_ms: Math.round(cur.avgLat),
    success_rate: round2(cur.successRate),
  };

  // Models + Pareto + per-model cost share.
  const models = demoModelStats(tsRange, topN);
  const modelTotal = models.reduce((s, m) => s + m.total_cost, 0) || 1;
  for (const m of models) m.cost_share = round2((m.total_cost / modelTotal) * 100);
  const ordered = [...models].sort((a, b) => b.total_cost - a.total_cost);
  let cumulative = 0;
  let paretoCount = 0;
  for (const m of ordered) {
    cumulative += m.total_cost;
    paretoCount += 1;
    if (cumulative / modelTotal >= 0.8) break;
  }

  // Agents + cost share.
  const agents = demoAgentStats(tsRange, topN);
  const agentTotal = agents.reduce((s, a) => s + a.total_cost, 0) || 1;
  const agentCostShare: Record<string, number> = {};
  for (const a of agents)
    agentCostShare[a.agent_name] = round2((a.total_cost / agentTotal) * 100);

  // Latency percentiles — call-weighted across agent profiles.
  const latProfiles = [...AGENTS].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
  const totalW = latProfiles.reduce((s, p) => s + p.callsPerDay, 0) || 1;
  const weightedPct = (pct: number): number => {
    let acc = 0;
    for (const p of latProfiles) {
      acc += p.callsPerDay / totalW;
      if (acc >= pct) return p.avgLatencyMs;
    }
    return latProfiles[latProfiles.length - 1].avgLatencyMs;
  };
  const maxLat = latProfiles[latProfiles.length - 1].avgLatencyMs;
  const latency = {
    p50: round2(weightedPct(0.5)),
    p95: round2(maxLat * 1.4),
    p99: round2(maxLat * 1.8),
    avg: Math.round(cur.avgLat),
    sample_size: Math.round(cur.calls),
    approximate: true,
  };

  // Token efficiency.
  const byModelEff = models.map((m) => ({
    model: m.model,
    cost_per_1k: m.total_tokens > 0 ? round6((m.total_cost / m.total_tokens) * 1000) : 0,
    in_out_ratio: m.output_tokens > 0 ? round2(m.input_tokens / m.output_tokens) : 0,
  }));
  const efficiency = {
    blended_cost_per_1k:
      cur.tokens > 0 ? round6((cur.cost / cur.tokens) * 1000) : 0,
    in_out_ratio: cur.outTok > 0 ? round2(cur.inTok / cur.outTok) : 0,
    total_input_tokens: Math.round(cur.inTok),
    total_output_tokens: Math.round(cur.outTok),
    by_model: byModelEff,
  };

  // Error breakdown per model.
  const errMap = new Map<string, { calls: number; err: number }>();
  for (const p of AGENTS) {
    const calls = p.callsPerDay * cur.mult;
    const e = errMap.get(p.model) ?? { calls: 0, err: 0 };
    e.calls += calls;
    e.err += calls * p.errorRate;
    errMap.set(p.model, e);
  }
  const errors = [...errMap.entries()]
    .map(([model, v]) => ({
      model,
      total_calls: Math.round(v.calls),
      error_count: Math.round(v.err),
      error_rate: v.calls > 0 ? round2((v.err / v.calls) * 100) : 0,
    }))
    .sort((a, b) => b.error_count - a.error_count);
  const totalErrors = errors.reduce((s, e) => s + e.error_count, 0) || 1;
  const top_errors = SAMPLE_ERRORS.map((error, i) => ({
    error,
    count: Math.round((totalErrors * [0.5, 0.3, 0.2][i]) || 0),
  })).filter((e) => e.count > 0);

  // Usage cadence — day-of-week from real weekdays, hour-of-day synthetic.
  const dowCalls = new Array(7).fill(0);
  const dowCost = new Array(7).fill(0);
  for (let d = 0; d < days; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    const m = dayMultiplier(d);
    for (const p of AGENTS) {
      const c = p.callsPerDay * m;
      dowCalls[dow] += c;
      dowCost[dow] += c * perCallCost(p);
    }
  }
  const DOW_LABELS = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];
  const by_dow = DOW_LABELS.map((label, i) => ({
    label,
    index: i,
    calls: Math.round(dowCalls[i]),
    cost: round6(dowCost[i]),
  }));
  const dayCallsTotal = cur.calls;
  const by_hour = Array.from({ length: 24 }, (_, h) => {
    const curve = 0.45 + 0.55 * Math.sin((Math.PI * (h - 4)) / 20) ** 2;
    const share = curve / 14.4; // curve integrates to ~14.4 over 24h
    return {
      label: `${String(h).padStart(2, "0")}:00`,
      index: h,
      calls: Math.round((dayCallsTotal / days) * share * 24),
      cost: round6((cur.cost / days) * share * 24),
    };
  });
  const busiestDow = by_dow.reduce((a, b) => (b.calls > a.calls ? b : a), by_dow[0]);
  const busiestHour = by_hour.reduce((a, b) => (b.calls > a.calls ? b : a), by_hour[0]);

  const dailyAvg = cur.cost / days;
  const run_rate = {
    daily_avg_cost: round6(dailyAvg),
    projected_monthly_cost: round2(dailyAvg * 30),
    window_days: round2(days),
  };

  const b = demoBudget();
  const budget = {
    enabled: true,
    budget: b.monthly_budget_usd,
    current_spend: b.current_month_spend,
    projected_spend: round2((b.current_month_spend / new Date().getDate()) * 30),
    utilization_percent: b.utilization_percent,
    currency: b.budget_currency,
    fx_rate: b.fx_rate,
    mode: b.budget_enforcement_mode,
  };

  const optSummary = demoOptimizationSummary();
  const savings = {
    total_potential_savings_monthly: optSummary.total_potential_savings_monthly,
    total_potential_savings_percent: optSummary.total_potential_savings_percent,
    suggestion_count: optSummary.suggestion_count,
    high_priority_count: optSummary.high_priority_count,
    top_suggestions: optSummary.suggestions.slice(0, 3),
  };

  return {
    generated_at: new Date().toISOString(),
    range_label: rangeLabel,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    previous_period_start: new Date(
      periodStart.getTime() - days * 86400_000,
    ).toISOString(),
    previous_period_end: periodStart.toISOString(),
    is_custom_range: isCustom,
    project_name: DEMO_PROJECT_NAME,
    currency: budget.currency,
    summary: {
      cost: mkDelta(cur.cost, prev.cost),
      calls: mkDelta(cur.calls, prev.calls),
      tokens: mkDelta(cur.tokens, prev.tokens),
      success_rate: mkDelta(cur.successRate, prev.successRate),
      avg_latency_ms: mkDelta(cur.avgLat, prev.avgLat),
      blended_cost_per_1k: efficiency.blended_cost_per_1k,
      in_out_ratio: efficiency.in_out_ratio,
    },
    overview,
    timeseries: demoTimeSeries(tsRange),
    models,
    model_pareto: {
      top_count: paretoCount,
      top_share: round2((cumulative / modelTotal) * 100),
      total_models: models.length,
    },
    agents,
    agent_cost_share: agentCostShare,
    latency,
    efficiency,
    errors,
    top_errors,
    cadence: {
      busiest_day: busiestDow.calls > 0 ? busiestDow.label : null,
      busiest_hour: busiestHour.calls > 0 ? busiestHour.label : null,
      by_dow,
      by_hour,
    },
    run_rate,
    budget,
    savings,
  };
}
