export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  category: "Product" | "Engineering" | "Guides";
  content: string[];
};

export type ChangelogEntry = {
  version: string;
  date: string;
  summary: string;
  changes: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "executive-cost-and-usage-reports",
    title: "Executive Reports: Board-Ready Cost & Usage in One Click",
    excerpt:
      "A single, exportable report that opens with a one-glance executive summary and continues into deep breakdowns — latency percentiles, cost concentration, error analysis, usage cadence, and savings — across any time range.",
    publishedAt: "2026-06-28",
    readTime: "4 min read",
    category: "Product",
    content: [
      "Your dashboard answers questions live, one panel at a time. But when finance asks 'what did we spend last month, and why?', or a customer wants a usage summary, you need a single document you can read top to bottom — or hand to someone who will. That document is the new Executive Report.",
      "Every report opens with an executive summary: total spend, calls, tokens, success rate, average latency, and projected monthly run-rate — each with a period-over-period delta against the immediately preceding window of equal length, so a 30-day report compares against the 30 days before it. The headline is the part anyone can read; everything below it is for the people who need the detail.",
      "And there is a lot of detail. Latency percentiles (p50/p95/p99), not just averages — because averages hide the tail that actually pages your on-call. Cost concentration, showing how few models drive most of your spend (the classic Pareto split). Token efficiency, with blended cost per 1K tokens and your input-to-output ratio per model. A reliability section that breaks failures down by model and lists your most frequent errors verbatim. A usage cadence view that surfaces your busiest day and hour. And an optimization-savings rollup that ties straight back to the recommendations engine.",
      "It runs over any window: the standard presets, month-to-date, or a fully custom start-and-end date range for billing-aligned reporting. Two export paths ship with it. PDF renders a clean, letterheaded document — not a screenshot of the dashboard, but a purpose-built page with its own typography, KPI grid, tables, and inline charts, so it prints the same on every machine. CSV exports the raw breakdown tables (models, agents, errors, cadence) with a UTF-8 byte-order mark so currency symbols and accented text open correctly in Excel on the first try.",
      "You will find it in the dashboard sidebar under Reports. It works against your live data, and it works in the no-signup demo too — open the demo, pick a range, and export a sample report to see exactly what your finance team would receive.",
    ],
  },
  {
    slug: "budget-guardrails-for-llm-spend",
    title: "Budget Guardrails for LLM Spend",
    excerpt:
      "Stop surprise bills with project-level monthly budgets, threshold alerts, and hard-cap enforcement — now with real-time in-app and email notifications.",
    publishedAt: "2026-05-24",
    readTime: "5 min read",
    category: "Product",
    content: [
      "Observability tells you what happened. Governance tells you what should not happen. Until this release, AgentCost only solved the first half.",
      "Budget Guardrails close the loop. Every project can now define a monthly USD budget, a list of alert thresholds (defaults: 50%, 80%, 100%), and one of three enforcement modes: off, warn, or hard cap. In warn mode, owners and project admins receive an in-app notification and an email the first time each threshold is crossed in a calendar month — deduplicated so a noisy ingestion batch can not trigger repeat alerts. In hard cap mode, the ingestion endpoint returns 429 once month-to-date spend reaches the budget, protecting you from runaway agents and broken loops in production.",
      "Thresholds are evaluated on every event batch, against month-to-date cost in UTC. The projected spend (current spend + the incoming batch) is what gets compared, so a single large batch that would push you across the cap is rejected before it is persisted, not after. The deduplication is enforced at the database layer with a unique index on (project_id, period_key, threshold_percent), so a restarted worker or a retried batch can not double-alert.",
      "On the dashboard side, the new Budget Guardrails card in Settings shows month-to-date spend, a utilization bar that changes color as you approach the cap, the configured thresholds as chips you can add or remove, and the enforcement mode as a single dropdown. The new bell icon in the top-right of every dashboard page surfaces budget alerts (and any future user-scoped notifications) with a live unread count.",
      "If you have not set a budget yet, nothing changes — the feature is opt-in per project. To enable it, head to Settings → Budget Guardrails and pick the mode that fits your environment. Most teams start in warn mode for a billing cycle, then promote to hard cap once they trust the threshold values.",
    ],
  },
  {
    slug: "openai-anthropic-langchain-tracking",
    title: "Unified Cost Tracking Across OpenAI, Anthropic, and LangChain",
    excerpt:
      "One observability layer for the three integration paths almost every production stack uses.",
    publishedAt: "2026-03-20",
    readTime: "3 min read",
    category: "Guides",
    content: [
      "Most production LLM stacks are not single-provider. A typical setup calls OpenAI for chat, Anthropic for long-context reasoning, and routes some workflows through LangChain. Fragmented per-provider dashboards make it hard to answer the basic question: which model is actually costing us money this week?",
      "The AgentCost SDK now instruments all three paths through a single import. No wrappers, no decorators, no proxy URLs — lightweight interception attaches to the provider clients you already use and reports usage, tokens, and cost in a normalized schema.",
      "Once events are flowing in, the dashboard surfaces per-model and per-agent breakdowns side by side, so model-routing decisions become a one-look exercise instead of a multi-tab spreadsheet.",
    ],
  },
];

export const changelogEntries: ChangelogEntry[] = [
  {
    version: "v1.9.0",
    date: "2026-06-28",
    summary:
      "Executive Reports with PDF/CSV export, a redesigned Pricing page, and reliability fixes",
    changes: [
      "Added Executive Reports — a new Reports page that pairs a one-glance executive summary (spend, calls, tokens, success rate, latency, projected run-rate, each with period-over-period deltas) with deep breakdowns: latency percentiles (p50/p95/p99), model cost concentration (Pareto), token efficiency, per-model error analysis, usage cadence (busiest day/hour), budget status, and an optimization-savings rollup.",
      "Reports run over standard ranges, month-to-date, or a fully custom start/end date window — deltas always compare against the immediately preceding window of equal length.",
      "Added a one-click PDF export that renders a purpose-built, letterheaded document (its own typography, KPI grid, tables, and inline SVG charts) instead of printing the dashboard — consistent output on every machine.",
      "Added CSV export of the raw breakdown tables (models, agents, errors, cadence) with a UTF-8 byte-order mark and CRLF line endings, so currency symbols and accented text open correctly in Excel.",
      "Backed the report with a new /v1/analytics/report endpoint and ReportService that compose the existing analytics, budget, and optimization services — no duplicated aggregation logic.",
      "Reports work end-to-end in the no-signup demo, generated entirely client-side from the same sample dataset as the rest of the demo.",
      "Redesigned the Pricing page: the header link now opens a dedicated page with an interactive savings estimator and an honest, single 'Free forever' open-source plan — replacing the old anchor jump to the metrics section.",
      "Added a Back-to-home link and a featured-post layout to the Blog index.",
      "Fixed the test suite's in-memory database setup (shared connection + commit-on-success) and aligned auth fixtures with the dual-auth model, restoring full green coverage; corrected the soft-delete test to reflect intentional grace-period reactivation.",
    ],
  },
  {
    version: "v1.8.0",
    date: "2026-06-18",
    summary:
      "Interactive no-signup demo, a redesigned analytics dashboard, and broader model coverage",
    changes: [
      "Added Live Demo mode — explore a fully populated workspace (sample data from a fictional AI-support company) with no signup. It runs entirely client-side, so the demo works even when the API is unavailable.",
      "Reachable from the landing hero, the navbar, and the sign-in page, the demo is read-only: any write action invites you to create a free account, and signups originating in the demo are attributed for conversion reporting.",
      "Added a Demo Funnel page to the admin control plane: sessions over time, entry sources, most-explored pages, signup click-through, and demo-to-account conversion rate.",
      "Redesigned the dashboard with hero metric cards (inline sparklines and period-over-period deltas) and a new operational snapshot: projected monthly spend at the current run rate, blended cost per 1K tokens, and failed-call/error-rate tracking.",
      "Added a new activity chart with a Spend / Calls / Tokens switcher and a period-average reference line, an interactive cost-by-model donut, and a ranked agent cost list with per-agent calls, success rate, and latency.",
      "Reworked the Agents and Models pages with provider tags, cost-share bars, call-volume-weighted success rates, and input/output token-split visualizations.",
      "Updated model coverage to reflect 2,900+ supported models, synced from LiteLLM's pricing database.",
      "Refined the visual language across the app — flat, single-color data fills replace cross-color gradient treatments for a cleaner, more professional look.",
      "Fixed a reliability issue on the registration page where an unreachable policy-versions endpoint surfaced a console error instead of silently falling back to the built-in defaults.",
    ],
  },
  {
    version: "v1.7.1",
    date: "2026-05-24",
    summary:
      "INR currency support, clearer Budget Guardrails UX, and stability fixes",
    changes: [
      "Added per-project currency selection for Budget Guardrails — USD and INR are supported, with live ECB-sourced FX rates fetched and cached for 6 hours via frankfurter.app.",
      "Budget evaluation now converts USD cost events into the project's chosen currency before comparing against thresholds and the hard-cap budget, so a ₹4,000 budget behaves natively in INR.",
      "Email and in-app budget alerts now render amounts with the project's currency symbol (₹ or $).",
      "Redesigned the Enforcement Mode dropdown with a dark-theme custom selector and clearer wording (Tracking only / Notify on thresholds / Block when budget is reached).",
      "Widened the threshold input so the helper text is no longer clipped.",
      "Fixed a TypeError on /v1/auth/me caused by legacy naive timestamps in last_active_at.",
      "Auto-migration now also adds events.cost_source and events.input_hash so analytics queries succeed on first deploy.",
      "Logout now clears the project-scoped API key from local storage to prevent a previous account's key from leaking into a new account session.",
      "Team page detects when a stored API key points to a project the current user can't access and offers a one-click recovery action.",
    ],
  },
  {
    version: "v1.7.0",
    date: "2026-05-24",
    summary:
      "Budget Guardrails: monthly caps, threshold alerts, and notifications",
    changes: [
      "Added per-project monthly budget configuration with enforcement modes: off, warn, and hard_cap.",
      "Added configurable alert thresholds (defaults: 50%, 80%, 100%) with strict 1–100% validation and automatic deduplication.",
      "Added deduplicated threshold crossing records via a new budget_threshold_alerts table — guaranteed at most one alert per project, per month, per threshold.",
      "Added in-app notification system: per-user notification feed with unread counts, severity levels (info / warning / critical), mark-read, and mark-all-read endpoints.",
      "Added budget alert email template — branded HTML email dispatched via Resend to project owners and admin members on every newly crossed threshold.",
      "Added a notification bell to the dashboard layout with a live unread badge that polls every 60 seconds.",
      "Added the Budget Guardrails settings card with month-to-date utilization, color-coded progress bar, and threshold chip editor.",
      "Hardened the ingestion endpoint: returns HTTP 429 when projected spend exceeds the budget in hard_cap mode, with a clear, actionable error message.",
      "Added 13 unit + integration tests covering threshold normalization, month-window math, year-rollover, evaluation across all enforcement modes, dedup, and owner/admin fan-out.",
    ],
  },
  {
    version: "v1.6.4",
    date: "2026-03-20",
    summary: "Branding and SEO coverage for multi-provider support",
    changes: [
      "Updated site metadata to explicitly include OpenAI and Anthropic alongside LangChain across title, description, Open Graph, and Twitter cards.",
      "Updated landing-page copy and SDK snippets to reflect multi-provider support.",
      "Standardized icon metadata (shortcut + apple touch icon) for consistent favicon rendering across browsers.",
    ],
  },
];
