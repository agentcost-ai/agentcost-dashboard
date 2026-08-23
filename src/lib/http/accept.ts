/**
 * Accept-header negotiation (RFC 9110 §12.5.1).
 *
 * Kept free of Next imports so it can be unit-tested directly. The site serves
 * two representations of every public page — HTML and Markdown — and this is
 * the single place that decides which one a request gets.
 */

export type MediaRange = {
  type: string;
  subtype: string;
  /** Quality value, 0–1. A q of 0 means "explicitly not acceptable". */
  q: number;
  /** 2 = exact type/subtype, 1 = type/*, 0 = star-slash-star. */
  specificity: 0 | 1 | 2;
};

/** Parse an Accept header into media ranges, most preferred first. */
export function parseAccept(header: string | null | undefined): MediaRange[] {
  if (!header) return [];

  const ranges: MediaRange[] = [];

  for (const part of header.split(",")) {
    const [rawType, ...params] = part.split(";");
    const value = rawType.trim().toLowerCase();
    if (!value) continue;

    const slash = value.indexOf("/");
    if (slash < 0) continue;

    const type = value.slice(0, slash);
    const subtype = value.slice(slash + 1);
    if (!type || !subtype) continue;

    let q = 1;
    for (const param of params) {
      const [key, val] = param.split("=");
      if (key?.trim().toLowerCase() !== "q") continue;
      const parsed = Number.parseFloat(val ?? "");
      // A malformed q is ignored rather than treated as 0 — an unparseable
      // parameter should not silently make a type unacceptable.
      if (Number.isFinite(parsed)) q = Math.min(Math.max(parsed, 0), 1);
    }

    const specificity: 0 | 1 | 2 =
      type === "*" ? 0 : subtype === "*" ? 1 : 2;

    ranges.push({ type, subtype, q, specificity });
  }

  // Stable sort: higher q first, then more specific first.
  return ranges
    .map((range, index) => ({ range, index }))
    .sort(
      (a, b) =>
        b.range.q - a.range.q ||
        b.range.specificity - a.range.specificity ||
        a.index - b.index,
    )
    .map(({ range }) => range);
}

function matches(range: MediaRange, mediaType: string): boolean {
  const [type, subtype] = mediaType.toLowerCase().split("/");
  if (range.type === "*") return true;
  if (range.type !== type) return false;
  return range.subtype === "*" || range.subtype === subtype;
}

/**
 * Pick the best representation for a request.
 *
 * `supported` is in server-preference order and breaks ties. Returns `null`
 * only when the client sent an Accept header that positively excludes every
 * representation we have — that is the one case worth a 406. A missing, empty
 * or wildcard header resolves to the first supported type, so ordinary browser
 * and crawler traffic is never affected.
 */
export function negotiate(
  header: string | null | undefined,
  supported: readonly string[],
): string | null {
  if (supported.length === 0) return null;

  const ranges = parseAccept(header);
  if (ranges.length === 0) return supported[0];

  let best: { mediaType: string; q: number; specificity: number } | null = null;

  for (const mediaType of supported) {
    const range = ranges.find((candidate) => matches(candidate, mediaType));
    if (!range || range.q === 0) continue;

    if (
      !best ||
      range.q > best.q ||
      (range.q === best.q && range.specificity > best.specificity)
    ) {
      best = { mediaType, q: range.q, specificity: range.specificity };
    }
  }

  return best?.mediaType ?? null;
}
