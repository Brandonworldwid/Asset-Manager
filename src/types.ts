export type AssetType = '3d' | '3dplant' | 'surface' | 'decal' | 'atlas';

export interface MeshStats {
  vertices: number;
  triangles: number;
  format: 'FBX' | 'OBJ' | 'MAX' | 'MA' | 'USD';
}

export interface TextureFile {
  name: string;
  type: 'Albedo' | 'Normal' | 'Roughness' | 'Displacement' | 'AO' | 'Opacity' | 'Cavity';
  resolution: '1k' | '2k' | '4k' | '8k';
  size: string;
}

export interface Asset {
  id: string; // e.g., "vdvmd" or "MS_rock_vdvmd"
  name: string;
  type: AssetType;
  size: number; // in bytes
  isZipped: boolean;
  resolution: '1k' | '2k' | '4k' | '8k';
  thumbnailUrl: string;
  tags: string[];
  categories: string[]; // Category IDs
  scannedPath: string; // Directory where it was found
  dateAdded: string;
  meshStats?: MeshStats;
  textures: TextureFile[];
  description?: string;
  dimensions?: { length?: string; width?: string; height?: string; };
  packName?: string;
  country?: string;
  region?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface SimulatedDirectoryItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: SimulatedDirectoryItem[];
  scannedAsset?: Partial<Asset>; // If a directory represents a Megascans asset
}

export function getAssetGroupKey(asset: Asset): string {
  // Normalize the name by stripping common resolution designations and trailing spacing
  let normName = asset.name.toLowerCase().replace(/[-_\s]*(1k|2k|4k|8k)\b/gi, '').trim();
  if (normName === '' || normName === '1k' || normName === '2k' || normName === '4k' || normName === '8k') {
    // If the name is literally just a resolution, group all such generic files of the same type together
    return `group-${asset.type}-generic`;
  }
  return `group-${asset.type}-${normName}`;
}

export function getAssetGroupName(asset: Asset): string {
  let name = asset.name;
  
  // Normalize names that are just resolution placeholders
  const lowerName = name.toLowerCase().trim();
  if (lowerName === '1k' || lowerName === '2k' || lowerName === '4k' || lowerName === '8k') {
    // Extract base folder name from scannedPath if possible
    const parts = asset.scannedPath.split('/');
    const lastPart = parts[parts.length - 1] || '';
    let dirName = lastPart.replace(/^(3d_rock_|3dplant_|surface_|atlas_|decal_)/i, '');
    dirName = dirName.replace(/_([1-8]k.*)$/i, '');
    const cleanDir = dirName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    name = cleanDir || (asset.type === 'surface' ? 'Surface Asset' : '3D Asset');
  }

  // Strip resolution tags from the name
  name = name.replace(/\s+([1-8]k|[1-8]K)\b/gi, '').trim();
  return name;
}
