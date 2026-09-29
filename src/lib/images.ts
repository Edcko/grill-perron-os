import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

/** Optimized, serializable image data that React islands can receive as props. */
export interface FoodImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

export type FoodImages = Record<string, FoodImage>;

const sources = import.meta.glob<{ default: ImageMetadata }>("../assets/food/*.jpg", { eager: true });

function idFromPath(path: string): string {
  return path.split("/").pop()!.replace(/\.jpg$/, "");
}

let cache: Promise<FoodImages> | null = null;

/**
 * Runs at build time. Every photo is converted to WebP at three widths,
 * so islands never ship the original JPEGs.
 */
export function getFoodImages(): Promise<FoodImages> {
  cache ??= (async () => {
    const entries = await Promise.all(
      Object.entries(sources).map(async ([path, mod]) => {
        const img = await getImage({ src: mod.default, widths: [480, 900, 1200], sizes: "(min-width: 1024px) 33vw, 50vw", format: "webp", quality: 72 });
        return [
          idFromPath(path),
          {
            src: img.src,
            srcSet: img.srcSet.attribute,
            width: mod.default.width,
            height: mod.default.height,
          },
        ] as const;
      }),
    );
    return Object.fromEntries(entries);
  })();
  return cache;
}
