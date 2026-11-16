/**
 * Fonts for the Open Graph cards.
 *
 * next/og bundles a single regular-weight Noto Sans, so without this every
 * card renders in one weight of a font the site never uses. These are the
 * site's own faces (Newsreader headings, Inter body, JetBrains Mono labels),
 * fetched as TTF from Google Fonts, the method Vercel documents for next/og.
 *
 * Cards are rendered at build time (or once per ISR window), not per request.
 * If Google Fonts is unreachable the card still renders in the bundled font:
 * a failed fetch must never fail a build or a share preview.
 */

type FontWeight = 400 | 500 | 600 | 700;
type OgFont = { name: string; data: ArrayBuffer; weight: FontWeight; style: "normal" };

const FACES: { family: string; name: string; weight: FontWeight }[] = [
  { family: "Newsreader", name: "Newsreader", weight: 500 },
  { family: "Inter", name: "Inter", weight: 400 },
  { family: "Inter", name: "Inter", weight: 600 },
  { family: "JetBrains+Mono", name: "JetBrains Mono", weight: 500 },
];

// Subset to what cards can contain: printable ASCII plus the few symbols used.
const GLYPHS =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("") + "·—–’“”…×−▲▼→";

async function loadFace(family: string, weight: FontWeight): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(GLYPHS)}`;
    const css = await (await fetch(url, { signal: AbortSignal.timeout(10_000) })).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

let cached: Promise<OgFont[]> | null = null;

export function ogFonts(): Promise<OgFont[]> {
  if (!cached) {
    cached = Promise.all(
      FACES.map(async (face) => {
        const data = await loadFace(face.family, face.weight);
        return data ? { name: face.name, data, weight: face.weight, style: "normal" as const } : null;
      }),
    ).then((fonts) => fonts.filter((font): font is OgFont => font !== null));
  }
  return cached;
}

export const DISPLAY = "Newsreader, Inter, sans-serif";
export const SANS = "Inter, sans-serif";
export const MONO = "JetBrains Mono, monospace";
