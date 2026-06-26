import { MEGASCANS_SUBCATEGORIES } from './data/mockAssets';
import { Subcategory } from './types';

// Helper to normalize strings for comparison (e.g. "3D Asset" or "3d" -> "3d assets")
function normalizeName(name: string): string {
  let n = name.toLowerCase().trim();
  if (n === '3d' || n === '3d asset' || n === '3d assets' || n === '3d_assets') return '3d assets';
  if (n === '3dplant' || n === '3d plant' || n === '3d plants' || n === '3d_plants' || n === 'plants') return '3d plants';
  if (n === 'surface' || n === 'surfaces') return 'surfaces';
  if (n === 'decal' || n === 'decals') return 'decals';
  if (n === 'atlas' || n === 'atlases') return 'atlases';
  return n;
}

/**
 * Maps multi-level category paths from Python into existing sidebar Subcategory IDs.
 * Matches names recursively down the predefined MEGASCANS_SUBCATEGORIES tree.
 */
export function mapCategoryPathToIds(paths: string[][]): string[] {
  const ids: string[] = [];

  for (const path of paths) {
    if (!path || path.length === 0) continue;

    let currentList: Subcategory[] = MEGASCANS_SUBCATEGORIES;
    let matchedId: string | null = null;

    for (const seg of path) {
      const normSeg = normalizeName(seg);
      const found = currentList.find(sub => {
        const normSub = normalizeName(sub.name);
        return normSub === normSeg || normSub.includes(normSeg) || normSeg.includes(normSub);
      });

      if (found) {
        matchedId = found.id;
        currentList = found.subcategories || [];
      } else {
        // If not found exactly, stop matching deeper segments of this path
        break;
      }
    }

    if (matchedId) {
      ids.push(matchedId);
    }
  }

  // Ensure unique IDs
  return Array.from(new Set(ids));
}
