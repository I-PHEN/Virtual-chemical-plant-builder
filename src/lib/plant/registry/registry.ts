/**
 * Asset Registry — the single query surface for plant models.
 *
 * The layout engine, the AI plant builder, and the scene renderer all ask the
 * registry for models. They never read files directly. This is the layer that
 * turns "a folder of GLBs" into "a curated library the AI can reason about".
 *
 * Loading strategy: manifests are JSON files in /public/assets/registry/*.json.
 * We fetch the index on first use (browser-side) or read synchronously
 * (server-side via fs). Both paths feed the same in-memory catalog.
 */

import type {
  AssetManifest,
  AssetQuery,
  AssetQueryResult,
  QualityTier,
} from "./manifest";
import type { EquipmentType } from "../types";

/** Tier weight for ranking — hero > standard > background. */
const TIER_WEIGHT: Record<QualityTier, number> = {
  hero: 3,
  standard: 2,
  background: 1,
};

class AssetRegistry {
  private manifests: Map<string, AssetManifest> = new Map();
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  /** Register a single manifest. Server-side path. */
  register(manifest: AssetManifest): void {
    this.manifests.set(manifest.id, manifest);
    this.loaded = true;
  }

  /** Register many at once. */
  registerAll(list: AssetManifest[]): void {
    for (const m of list) this.manifests.set(m.id, m);
    this.loaded = true;
  }

  /** Get a manifest by id. */
  get(id: string): AssetManifest | undefined {
    return this.manifests.get(id);
  }

  /** All manifests (read-only view). */
  all(): AssetManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Query the registry. Returns ALL matches ranked by score, best first.
   * Callers usually want pickForEquipment() which returns just the winner.
   */
  query(q: AssetQuery): AssetQueryResult[] {
    const types = q.types ?? [];
    const tags = q.tags ?? [];
    const results: AssetQueryResult[] = [];

    for (const manifest of this.manifests.values()) {
      // Type filter is a hard gate — must be able to play the role.
      if (types.length > 0) {
        const hasType = types.some((t) => manifest.equipmentTypes.includes(t));
        if (!hasType) continue;
      }

      // Score: matched tags + tier preference + tag-count tiebreak
      const matchedTags = manifest.tags.filter((t) => tags.includes(t));
      let score = matchedTags.length * 10;

      if (q.preferredTier) {
        if (manifest.qualityTier === q.preferredTier) {
          score += TIER_WEIGHT[manifest.qualityTier];
        } else {
          // Still allow other tiers, just with lower score
          score += Math.floor(TIER_WEIGHT[manifest.qualityTier] / 2);
        }
      } else {
        score += TIER_WEIGHT[manifest.qualityTier];
      }

      results.push({ manifest, score, matchedTags });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Pick the single best manifest for a given equipment role in a given
   * plant context. Returns null if nothing in the registry can play the role —
   * caller falls back to procedural.
   */
  pickForEquipment(
    type: EquipmentType,
    context?: { plantId?: string; tags?: string[]; preferredTier?: QualityTier }
  ): AssetManifest | null {
    // Plant-specific tags help pick ammonia-styled models for ammonia plants.
    const tags = [...(context?.tags ?? [])];
    if (context?.plantId) tags.push(context.plantId);

    const results = this.query({
      types: [type],
      tags,
      preferredTier: context?.preferredTier ?? "hero",
    });

    return results.length > 0 ? results[0].manifest : null;
  }

  /**
   * Browser-side loader. Fetches the registry index from /assets/registry/index.json
   * which lists all manifest files to load. Idempotent.
   */
  async loadFromPublic(): Promise<void> {
    if (this.loaded || this.loadPromise) return this.loadPromise ?? Promise.resolve();
    this.loadPromise = this._doLoadFromPublic();
    await this.loadPromise;
  }

  private async _doLoadFromPublic(): Promise<void> {
    try {
      const res = await fetch("/assets/registry/index.json");
      if (!res.ok) {
        // No index yet — registry starts empty, callers fall back to procedural.
        this.loaded = true;
        return;
      }
      const data = (await res.json()) as { manifests: string[] };
      const manifests: AssetManifest[] = [];
      for (const path of data.manifests) {
        try {
          const r = await fetch(path);
          if (r.ok) manifests.push((await r.json()) as AssetManifest);
        } catch {
          // Skip a bad manifest, don't fail the whole registry.
        }
      }
      this.registerAll(manifests);
    } catch {
      // Network or parse error — registry just stays empty.
      this.loaded = true;
    }
  }

  /** Reset (for tests / hot reload). */
  reset(): void {
    this.manifests.clear();
    this.loaded = false;
    this.loadPromise = null;
  }
}

/** Singleton. The whole app talks to this one instance. */
export const assetRegistry = new AssetRegistry();
