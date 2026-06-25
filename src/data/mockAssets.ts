import { Asset, Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'All Assets', icon: 'FolderArchive' },
  { id: 'cat-3d', name: '3D Assets', icon: 'Box' },
  { id: 'cat-plants', name: '3D Plants', icon: 'Flower' },
  { id: 'cat-surfaces', name: 'Surfaces', icon: 'Layers' },
  { id: 'cat-atlases', name: 'Atlases', icon: 'Grid' },
  { id: 'cat-favorites', name: 'Favorites', icon: 'Star' },
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'basalt-rock-uivvd',
    name: 'Nordic Basalt Rock',
    type: '3d',
    size: 45209381, // 43.1 MB
    isZipped: false,
    resolution: '4k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&h=600&q=80',
    tags: ['rock', 'cliff', 'nordic', 'basalt', 'coastal'],
    categories: ['cat-3d', 'cat-favorites'],
    scannedPath: '/Users/creative/Downloads/Megascans/3d_rock_basalt_uivvd',
    dateAdded: '2026-06-20T14:22:10Z',
    description: 'A sharp coastal basalt rock block with heavy weathering and detailed mineral lines, perfect for rugged cliffs and shorelines.',
    meshStats: {
      vertices: 18240,
      triangles: 36480,
      format: 'FBX',
    },
    textures: [
      { name: 'uivvd_4K_Albedo.png', type: 'Albedo', resolution: '4k', size: '18.4 MB' },
      { name: 'uivvd_4K_Normal.png', type: 'Normal', resolution: '4k', size: '24.1 MB' },
      { name: 'uivvd_4K_Roughness.png', type: 'Roughness', resolution: '4k', size: '12.8 MB' },
      { name: 'uivvd_4K_AO.png', type: 'AO', resolution: '4k', size: '8.2 MB' },
    ],
  },
  {
    id: 'pine-needle-soil-ukfks',
    name: 'Forest Needle Ground',
    type: 'surface',
    size: 112485901, // 107.2 MB
    isZipped: true,
    resolution: '8k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&h=600&q=80',
    tags: ['soil', 'forest', 'needle', 'moss', 'ground'],
    categories: ['cat-surfaces'],
    scannedPath: '/Users/creative/Downloads/Megascans/surface_pine_needle_ukfks',
    dateAdded: '2026-06-24T09:15:30Z',
    description: 'Rich forest ground surface texture covered in dry pine needles, tiny pine cones, organic forest debris, and light patches of moss.',
    textures: [
      { name: 'ukfks_8K_Albedo.jpg', type: 'Albedo', resolution: '8k', size: '34.2 MB' },
      { name: 'ukfks_8K_Normal.jpg', type: 'Normal', resolution: '8k', size: '48.6 MB' },
      { name: 'ukfks_8K_Roughness.jpg', type: 'Roughness', resolution: '8k', size: '22.1 MB' },
      { name: 'ukfks_8K_Displacement.exr', type: 'Displacement', resolution: '8k', size: '84.5 MB' },
    ],
  },
];

// These are NOT in the library initially. When scanned from the virtual download directory,
// the app will "detect" them and put them in the library.
export const VIRTUAL_DOWNLOADS_ASSETS: Asset[] = [
  {
    id: 'mossy-rock-vdvmd',
    name: 'Mossy Forest Rock',
    type: '3d',
    size: 154238023, // 147 MB
    isZipped: false,
    resolution: '2k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&h=600&q=80',
    tags: ['rock', 'mossy', 'forest', 'boulder', 'ancient'],
    categories: ['cat-3d'],
    scannedPath: '/Users/creative/Downloads/Megascans/3d_rock_mossy_vdvmd',
    dateAdded: '2026-06-25T02:00:00Z',
    description: 'A moss-covered damp forest boulder with organic sediment and deep cracks. Scanned natively from ancient woodland.',
    meshStats: {
      vertices: 24500,
      triangles: 48900,
      format: 'FBX',
    },
    textures: [
      { name: 'vdvmd_2K_Albedo.jpg', type: 'Albedo', resolution: '2k', size: '8.4 MB' },
      { name: 'vdvmd_2K_Normal.jpg', type: 'Normal', resolution: '2k', size: '12.1 MB' },
      { name: 'vdvmd_2K_Roughness.jpg', type: 'Roughness', resolution: '2k', size: '5.8 MB' },
      { name: 'vdvmd_2K_AO.jpg', type: 'AO', resolution: '2k', size: '3.2 MB' },
    ],
  },
  {
    id: 'wild-grass-tfnsb',
    name: 'Wild Forest Grass Cluster',
    type: '3dplant',
    size: 18450122, // 17.6 MB
    isZipped: false,
    resolution: '4k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&h=600&q=80',
    tags: ['plant', 'grass', 'wild', 'foliage', 'green'],
    categories: ['cat-plants'],
    scannedPath: '/Users/creative/Downloads/Megascans/3dplant_wild_grass_tfnsb',
    dateAdded: '2026-06-25T02:01:00Z',
    description: 'A dense cluster of wild green field grass with slight weathering and individual blade variations. Low-poly optimized with high-res leaf textures.',
    meshStats: {
      vertices: 1250,
      triangles: 2100,
      format: 'OBJ',
    },
    textures: [
      { name: 'tfnsb_4K_Albedo.png', type: 'Albedo', resolution: '4k', size: '4.5 MB' },
      { name: 'tfnsb_4K_Normal.png', type: 'Normal', resolution: '4k', size: '6.2 MB' },
      { name: 'tfnsb_4K_Opacity.png', type: 'Opacity', resolution: '4k', size: '3.1 MB' },
    ],
  },
  {
    id: 'cracked-soil-ukfks',
    name: 'Desert Cracked Soil',
    type: 'surface',
    size: 89450201, // 85.3 MB
    isZipped: true,
    resolution: '4k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&h=600&q=80', // Replace or use default
    tags: ['soil', 'desert', 'cracked', 'dry', 'mud'],
    categories: ['cat-surfaces'],
    scannedPath: '/Users/creative/Downloads/Megascans/surface_cracked_soil_ukfks',
    dateAdded: '2026-06-25T02:02:00Z',
    description: 'Dry, baking hot desert mud flats showing beautiful crack networks, sandy recesses, and sun-baked silt layers.',
    textures: [
      { name: 'ukfks_4K_Albedo.jpg', type: 'Albedo', resolution: '4k', size: '12.4 MB' },
      { name: 'ukfks_4K_Normal.jpg', type: 'Normal', resolution: '4k', size: '18.1 MB' },
      { name: 'ukfks_4K_Displacement.jpg', type: 'Displacement', resolution: '4k', size: '14.5 MB' },
    ],
  },
  {
    id: 'autumn-leaves-zjsie',
    name: 'Autumn Maple Leaves',
    type: 'atlas',
    size: 28410293, // 27.1 MB
    isZipped: false,
    resolution: '4k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&h=600&q=80', // Beautiful forest/autumn
    tags: ['atlas', 'leaves', 'autumn', 'maple', 'foliage'],
    categories: ['cat-atlases'],
    scannedPath: '/Users/creative/Downloads/Megascans/atlas_autumn_leaves_zjsie',
    dateAdded: '2026-06-25T02:03:00Z',
    description: 'High resolution scan of autumn maple leaves, containing individual leaves with transparent backgrounds for particle scatter setup.',
    textures: [
      { name: 'zjsie_4K_Albedo.png', type: 'Albedo', resolution: '4k', size: '9.2 MB' },
      { name: 'zjsie_4K_Opacity.png', type: 'Opacity', resolution: '4k', size: '4.1 MB' },
      { name: 'zjsie_4K_Normal.png', type: 'Normal', resolution: '4k', size: '11.4 MB' },
    ],
  },
  {
    id: 'ulxqchsdw',
    name: 'Modular Building 1st Floor Kit',
    type: '3d',
    size: 1850000000, // 1.85 GB total textures + meshes
    isZipped: false,
    resolution: '8k',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&h=600&q=80',
    tags: ['brown', 'bricks', 'house', 'brick', 'wall', 'window', 'cmb_scatter', 'scatter', 'cmb_asset', 'modular', 'building', 'nordic', 'classical', 'sweden', 'europe', 'urban', 'exterior', 'architecture'],
    categories: ['cat-3d'],
    scannedPath: '/Users/creative/Downloads/Megascans/3d_building_modular_1st_floor_ulxqchsdw',
    dateAdded: '2026-06-25T03:00:00Z',
    description: 'A premium Nordic-Classical modular building 1st floor kit scanned in Gothenburg, Sweden. Features high-resolution 8K brick textures, wood fixtures, clean architectural lines, and full Level of Detail (LOD) geometries.',
    meshStats: {
      vertices: 34596,
      triangles: 69192,
      format: 'FBX',
    },
    dimensions: {
      length: '2.37m',
      width: '1.0m',
      height: '3.5m',
    },
    packName: 'Nordic-Classical Modular Building',
    country: 'Sweden',
    region: 'Europe',
    textures: [
      { name: 'ulxqchsdw_8K_Albedo.jpg', type: 'Albedo', resolution: '8k', size: '33.6 MB' },
      { name: 'ulxqchsdw_8K_Normal.jpg', type: 'Normal', resolution: '8k', size: '44.4 MB' },
      { name: 'ulxqchsdw_8K_Roughness.jpg', type: 'Roughness', resolution: '8k', size: '14.8 MB' },
      { name: 'ulxqchsdw_8K_Displacement.jpg', type: 'Displacement', resolution: '8k', size: '13.8 MB' },
      { name: 'ulxqchsdw_8K_Specular.jpg', type: 'Roughness', resolution: '8k', size: '18.3 MB' }, // specular acts as roughness variation
    ],
  },
];
