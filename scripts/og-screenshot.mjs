/**
 * Crop the "Ranked by spend" table out of the hero capture for the homepage
 * share card (src/app/opengraph-image.tsx).
 *
 * The card uses a real product screenshot rather than an illustration, so it
 * must be regenerated whenever public/hero/agents-3200.webp is re-exported:
 *
 *   node scripts/og-screenshot.mjs
 *
 * Coordinates are for the 3200x1500 (2x) capture: the main panel starts right
 * of the 240px sidebar, the table from its column headers down.
 */
import sharp from "sharp";

const SOURCE = "public/hero/agents-3200.webp";
const OUTPUT = "src/assets/og/agents-ranked.png";

const { width, height } = await sharp(SOURCE).metadata();
if (width !== 3200 || height !== 1500) {
  throw new Error(`${SOURCE} is ${width}x${height}; update the crop box for the new capture.`);
}

await sharp(SOURCE)
  .extract({ left: 520, top: 748, width: 2620, height: 752 })
  .resize({ width: 1700 })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`wrote ${OUTPUT}`);
