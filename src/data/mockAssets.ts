import { Asset, Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'All Assets', icon: 'FolderArchive' },
  { id: 'cat-favorites', name: 'Favorites', icon: 'Star' },
];

export const MEGASCANS_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'sub-3d-assets',
    name: '3D Assets',
    subcategories: [
      { 
        id: 'sub-3d-building', 
        name: 'Building',
        subcategories: [
          { id: 'sub-3d-building-balcony', name: 'Balcony' },
          { id: 'sub-3d-building-beam', name: 'Beam' },
          { id: 'sub-3d-building-combined', name: 'Combined' },
          { id: 'sub-3d-building-door', name: 'Door' },
          { id: 'sub-3d-building-pillar', name: 'Pillar' },
          { id: 'sub-3d-building-railing', name: 'Railing' },
          { id: 'sub-3d-building-relief', name: 'Relief' },
          { id: 'sub-3d-building-roof', name: 'Roof' },
          { id: 'sub-3d-building-rooftile', name: 'Roof Tile' },
          { id: 'sub-3d-building-stair', name: 'Stair' },
          { id: 'sub-3d-building-trim', name: 'Trim' },
          { id: 'sub-3d-building-wall', name: 'Wall' },
          { id: 'sub-3d-building-window', name: 'Window' },
        ]
      },
      { 
        id: 'sub-3d-food', 
        name: 'Food',
        subcategories: [
          { id: 'sub-3d-food-baked', name: 'Baked Goods' },
          { id: 'sub-3d-food-fruit', name: 'Fruit' },
          { id: 'sub-3d-food-meat', name: 'Meat' },
          { id: 'sub-3d-food-mushroom', name: 'Mushroom' },
          { id: 'sub-3d-food-nut', name: 'Nut' },
          { id: 'sub-3d-food-vegetable', name: 'Vegetable' },
        ]
      },
      { 
        id: 'sub-3d-historical', 
        name: 'Historical',
        subcategories: [
          { id: 'sub-3d-historical-cambodian', name: 'Cambodian Ruins' },
          { id: 'sub-3d-historical-feudal', name: 'Feudal Japan' },
          { id: 'sub-3d-historical-medieval', name: 'Medieval' },
          { id: 'sub-3d-historical-roman', name: 'Roman Empire' },
          { id: 'sub-3d-historical-wildwest', name: 'Wild West' },
        ]
      },
      { 
        id: 'sub-3d-industrial', 
        name: 'Industrial',
        subcategories: [
          { id: 'sub-3d-industrial-construction', name: 'Construction' },
          { id: 'sub-3d-industrial-hardware', name: 'Hardware' },
          { id: 'sub-3d-industrial-mining', name: 'Mining' },
          { id: 'sub-3d-industrial-railway', name: 'Railway' },
          { id: 'sub-3d-industrial-storage', name: 'Storage' },
        ]
      },
      { 
        id: 'sub-3d-interior', 
        name: 'Interior',
        subcategories: [
          { id: 'sub-3d-interior-ceiling', name: 'Ceiling' },
          { id: 'sub-3d-interior-decoration', name: 'Decoration' },
          { id: 'sub-3d-interior-door', name: 'Door' },
          { id: 'sub-3d-interior-fireplace', name: 'Fireplace' },
          { id: 'sub-3d-interior-furniture', name: 'Furniture' },
          { id: 'sub-3d-interior-railing', name: 'Railing' },
          { id: 'sub-3d-interior-stair', name: 'Stair' },
          { id: 'sub-3d-interior-wall', name: 'Wall' },
          { id: 'sub-3d-interior-window', name: 'Window' },
        ]
      },
      { 
        id: 'sub-3d-nature', 
        name: 'Nature',
        subcategories: [
          { id: 'sub-3d-nature-bone', name: 'Bone' },
          { id: 'sub-3d-nature-debris', name: 'Debris' },
          { id: 'sub-3d-nature-embankment', name: 'Embankment' },
          { id: 'sub-3d-nature-mushroom', name: 'Mushroom' },
          { id: 'sub-3d-nature-rock', name: 'Rock' },
          { id: 'sub-3d-nature-seabed', name: 'Seabed' },
          { id: 'sub-3d-nature-snow', name: 'Snow' },
          { id: 'sub-3d-nature-tree', name: 'Tree' },
        ]
      },
      { 
        id: 'sub-3d-props', 
        name: 'Props',
        subcategories: [
          { id: 'sub-3d-props-books', name: 'Books' },
          { id: 'sub-3d-props-farm', name: 'Farm' },
          { id: 'sub-3d-props-firewood', name: 'Firewood' },
          { id: 'sub-3d-props-hardware', name: 'Hardware' },
          { id: 'sub-3d-props-military', name: 'Military' },
          { id: 'sub-3d-props-palisade', name: 'Palisade' },
          { id: 'sub-3d-props-recreational', name: 'Recreational' },
          { id: 'sub-3d-props-storage', name: 'Storage' },
          { id: 'sub-3d-props-trash', name: 'Trash' },
          { id: 'sub-3d-props-weaponry', name: 'Weaponry' },
          { id: 'sub-3d-props-wheel', name: 'Wheel' },
          { id: 'sub-3d-props-wood', name: 'Wood' },
        ]
      },
      { 
        id: 'sub-3d-street', 
        name: 'Street',
        subcategories: [
          { id: 'sub-3d-street-barrier', name: 'Barrier' },
          { id: 'sub-3d-street-bollard', name: 'Bollard' },
          { id: 'sub-3d-street-curb', name: 'Curb' },
          { id: 'sub-3d-street-highway', name: 'Highway' },
          { id: 'sub-3d-street-props', name: 'Props' },
          { id: 'sub-3d-street-sidewalk', name: 'Sidewalk' },
          { id: 'sub-3d-street-trafficcone', name: 'Traffic Cone' },
        ]
      },
    ]
  },
  {
    id: 'sub-3d-plants',
    name: '3D Plants',
    subcategories: [
      { 
        id: 'sub-3d-plants-aquatic', 
        name: 'Aquatic',
        subcategories: [
          { id: 'sub-3d-plants-aquatic-floating', name: 'Floating' },
          { id: 'sub-3d-plants-aquatic-shore', name: 'Shore' },
          { id: 'sub-3d-plants-aquatic-submerged', name: 'Submerged' },
        ]
      },
      { 
        id: 'sub-3d-plants-crop', 
        name: 'Crop',
        subcategories: [
          { id: 'sub-3d-plants-crop-grass', name: 'Grass' },
          { id: 'sub-3d-plants-crop-plant', name: 'Plant' },
        ]
      },
      { 
        id: 'sub-3d-plants-flowering', 
        name: 'Flowering Plant',
        subcategories: [
          { id: 'sub-3d-plants-flowering-flowerhead', name: 'Flowerhead' },
          { id: 'sub-3d-plants-flowering-inflorescence', name: 'Inflorescence' },
        ]
      },
      { 
        id: 'sub-3d-plants-garden', 
        name: 'Garden Plant',
        subcategories: [
          { id: 'sub-3d-plants-garden-bush', name: 'Bush' },
          { id: 'sub-3d-plants-garden-flowering', name: 'Flowering' },
          { id: 'sub-3d-plants-garden-flowerless', name: 'Flowerless' },
        ]
      },
      { 
        id: 'sub-3d-plants-grass', 
        name: 'Grass',
        subcategories: [
          { id: 'sub-3d-plants-grass-lawn', name: 'Lawn' },
          { id: 'sub-3d-plants-grass-wild', name: 'Wild' },
        ]
      },
      { 
        id: 'sub-3d-plants-houseplant', 
        name: 'Houseplant',
        subcategories: [
          { id: 'sub-3d-plants-houseplant-flowering', name: 'Flowering' },
          { id: 'sub-3d-plants-houseplant-flowerless', name: 'Flowerless' },
        ]
      },
      { 
        id: 'sub-3d-plants-shrub', 
        name: 'Shrub',
        subcategories: [
          { id: 'sub-3d-plants-shrub-forest', name: 'Forest' },
          { id: 'sub-3d-plants-shrub-meadow', name: 'Meadow' },
          { id: 'sub-3d-plants-shrub-sandy', name: 'Sandy' },
          { id: 'sub-3d-plants-shrub-urban', name: 'Urban' },
        ]
      },
      { 
        id: 'sub-3d-plants-weed', 
        name: 'Weed',
        subcategories: [
          { id: 'sub-3d-plants-weed-forest', name: 'Forest' },
          { id: 'sub-3d-plants-weed-meadow', name: 'Meadow' },
          { id: 'sub-3d-plants-weed-urban', name: 'Urban' },
        ]
      },
      // Keep existing ones not shown in these screenshots but needed for structure
      { id: 'sub-3d-plants-climber', name: 'Climber' },
      { id: 'sub-3d-plants-fern', name: 'Fern' },
      { id: 'sub-3d-plants-groundcover', name: 'Ground Cover' },
      { id: 'sub-3d-plants-herb', name: 'Herb' },
      { id: 'sub-3d-plants-succulent', name: 'Succulent' },
    ]
  },
  {
    id: 'sub-surfaces',
    name: 'Surfaces',
    subcategories: [
      { id: 'sub-surfaces-asphalt', name: 'Asphalt', subcategories: [ { id: 'sub-surfaces-asphalt-fine', name: 'Fine' }, { id: 'sub-surfaces-asphalt-rough', name: 'Rough' }, { id: 'sub-surfaces-asphalt-torn', name: 'Torn' } ] },
      { id: 'sub-surfaces-bark', name: 'Bark', subcategories: [ { id: 'sub-surfaces-bark-beech', name: 'Beech' }, { id: 'sub-surfaces-bark-birch', name: 'Birch' }, { id: 'sub-surfaces-bark-oak', name: 'Oak' }, { id: 'sub-surfaces-bark-other', name: 'Other' }, { id: 'sub-surfaces-bark-palm', name: 'Palm' }, { id: 'sub-surfaces-bark-pine', name: 'Pine' }, { id: 'sub-surfaces-bark-spruce', name: 'Spruce' }, { id: 'sub-surfaces-bark-willow', name: 'Willow' } ] },
      { id: 'sub-surfaces-branch', name: 'Branch', subcategories: [ { id: 'sub-surfaces-branch-alder', name: 'Alder' }, { id: 'sub-surfaces-branch-birch', name: 'Birch' }, { id: 'sub-surfaces-branch-juniper', name: 'Juniper' }, { id: 'sub-surfaces-branch-pine', name: 'Pine' }, { id: 'sub-surfaces-branch-spruce', name: 'Spruce' } ] },
      { id: 'sub-surfaces-brick', name: 'Brick', subcategories: [ { id: 'sub-surfaces-brick-modern', name: 'Modern' }, { id: 'sub-surfaces-brick-mortar', name: 'Mortar' }, { id: 'sub-surfaces-brick-painted', name: 'Painted' }, { id: 'sub-surfaces-brick-rough', name: 'Rough' } ] },
      { id: 'sub-surfaces-coal', name: 'Coal', subcategories: [ { id: 'sub-surfaces-coal-brick', name: 'Brick' }, { id: 'sub-surfaces-coal-debris', name: 'Debris' } ] },
      { id: 'sub-surfaces-concrete', name: 'Concrete', subcategories: [ { id: 'sub-surfaces-concrete-cast-in-situ', name: 'Cast In Situ' }, { id: 'sub-surfaces-concrete-damaged', name: 'Damaged' }, { id: 'sub-surfaces-concrete-dirty', name: 'Dirty' }, { id: 'sub-surfaces-concrete-painted', name: 'Painted' }, { id: 'sub-surfaces-concrete-rough', name: 'Rough' }, { id: 'sub-surfaces-concrete-slab', name: 'Slab' }, { id: 'sub-surfaces-concrete-smooth', name: 'Smooth' } ] },
      { id: 'sub-surfaces-debris', name: 'Debris', subcategories: [ { id: 'sub-surfaces-debris-construction', name: 'Construction' }, { id: 'sub-surfaces-debris-nature', name: 'Nature' } ] },
      { id: 'sub-surfaces-fabric', name: 'Fabric', subcategories: [ { id: 'sub-surfaces-fabric-carpet', name: 'Carpet' }, { id: 'sub-surfaces-fabric-leather', name: 'Leather' }, { id: 'sub-surfaces-fabric-pattern', name: 'Pattern' }, { id: 'sub-surfaces-fabric-plain', name: 'Plain' }, { id: 'sub-surfaces-fabric-tarp', name: 'Tarp' } ] },
      { id: 'sub-surfaces-grass', name: 'Grass', subcategories: [ { id: 'sub-surfaces-grass-artificial', name: 'Artificial' }, { id: 'sub-surfaces-grass-dried', name: 'Dried' }, { id: 'sub-surfaces-grass-lawn', name: 'Lawn' }, { id: 'sub-surfaces-grass-patchy', name: 'Patchy' }, { id: 'sub-surfaces-grass-wild', name: 'Wild' } ] },
      { id: 'sub-surfaces-gravel', name: 'Gravel', subcategories: [ { id: 'sub-surfaces-gravel-construction', name: 'Construction' }, { id: 'sub-surfaces-gravel-natural', name: 'Natural' }, { id: 'sub-surfaces-gravel-pebbledash', name: 'Pebbledash' } ] },
      { id: 'sub-surfaces-ground', name: 'Ground', subcategories: [ { id: 'sub-surfaces-ground-forest', name: 'Forest' }, { id: 'sub-surfaces-ground-jungle', name: 'Jungle' }, { id: 'sub-surfaces-ground-other', name: 'Other' }, { id: 'sub-surfaces-ground-roots', name: 'Roots' } ] },
      { id: 'sub-surfaces-historical', name: 'Historical', subcategories: [ { id: 'sub-surfaces-historical-asian', name: 'Asian' }, { id: 'sub-surfaces-historical-medieval', name: 'Medieval' }, { id: 'sub-surfaces-historical-middle-eastern', name: 'Middle-Eastern' }, { id: 'sub-surfaces-historical-roman', name: 'Roman' } ] },
      { id: 'sub-surfaces-marble', name: 'Marble', subcategories: [ { id: 'sub-surfaces-marble-polished', name: 'Polished' }, { id: 'sub-surfaces-marble-rough', name: 'Rough' }, { id: 'sub-surfaces-marble-tile', name: 'Tile' } ] },
      { id: 'sub-surfaces-metal', name: 'Metal', subcategories: [ { id: 'sub-surfaces-metal-bare', name: 'Bare' }, { id: 'sub-surfaces-metal-corroded', name: 'Corroded' }, { id: 'sub-surfaces-metal-corrugated', name: 'Corrugated' }, { id: 'sub-surfaces-metal-gun', name: 'Gun' }, { id: 'sub-surfaces-metal-painted', name: 'Painted' }, { id: 'sub-surfaces-metal-sheet', name: 'Sheet' }, { id: 'sub-surfaces-metal-treated', name: 'Treated' } ] },
      { id: 'sub-surfaces-moss', name: 'Moss', subcategories: [ { id: 'sub-surfaces-moss-ground', name: 'Ground' }, { id: 'sub-surfaces-moss-rock', name: 'Rock' } ] },
      { id: 'sub-surfaces-plaster', name: 'Plaster', subcategories: [ { id: 'sub-surfaces-plaster-damaged', name: 'Damaged' }, { id: 'sub-surfaces-plaster-fresh', name: 'Fresh' }, { id: 'sub-surfaces-plaster-old', name: 'Old' }, { id: 'sub-surfaces-plaster-painted', name: 'Painted' } ] },
      { id: 'sub-surfaces-rock', name: 'Rock', subcategories: [ { id: 'sub-surfaces-rock-cliff', name: 'Cliff' }, { id: 'sub-surfaces-rock-jagged', name: 'Jagged' }, { id: 'sub-surfaces-rock-lava', name: 'Lava' }, { id: 'sub-surfaces-rock-mossy', name: 'Mossy' }, { id: 'sub-surfaces-rock-rough', name: 'Rough' }, { id: 'sub-surfaces-rock-smooth', name: 'Smooth' } ] },
      { id: 'sub-surfaces-roofing', name: 'Roofing', subcategories: [ { id: 'sub-surfaces-roofing-new', name: 'New' }, { id: 'sub-surfaces-roofing-old', name: 'Old' } ] },
      { id: 'sub-surfaces-sand', name: 'Sand', subcategories: [ { id: 'sub-surfaces-sand-beach', name: 'Beach' }, { id: 'sub-surfaces-sand-desert', name: 'Desert' } ] },
      { id: 'sub-surfaces-snow', name: 'Snow', subcategories: [ { id: 'sub-surfaces-snow-mixed', name: 'Mixed' }, { id: 'sub-surfaces-snow-pure', name: 'Pure' } ] },
      { id: 'sub-surfaces-soil', name: 'Soil', subcategories: [ { id: 'sub-surfaces-soil-clay', name: 'Clay' }, { id: 'sub-surfaces-soil-mud', name: 'Mud' }, { id: 'sub-surfaces-soil-mulch', name: 'Mulch' }, { id: 'sub-surfaces-soil-sandy', name: 'Sandy' } ] },
      { id: 'sub-surfaces-stone', name: 'Stone', subcategories: [ { id: 'sub-surfaces-stone-castle', name: 'Castle' }, { id: 'sub-surfaces-stone-cobblestone', name: 'Cobblestone' }, { id: 'sub-surfaces-stone-floor', name: 'Floor' }, { id: 'sub-surfaces-stone-granite', name: 'Granite' }, { id: 'sub-surfaces-stone-limestone', name: 'Limestone' }, { id: 'sub-surfaces-stone-mosaic', name: 'Mosaic' }, { id: 'sub-surfaces-stone-pebble', name: 'Pebble' }, { id: 'sub-surfaces-stone-terrazzo', name: 'Terrazzo' }, { id: 'sub-surfaces-stone-tile', name: 'Tile' }, { id: 'sub-surfaces-stone-wall', name: 'Wall' } ] },
      { id: 'sub-surfaces-tile', name: 'Tile', subcategories: [ { id: 'sub-surfaces-tile-ceramic', name: 'Ceramic' }, { id: 'sub-surfaces-tile-grout', name: 'Grout' }, { id: 'sub-surfaces-tile-pavestone', name: 'Pavestone' }, { id: 'sub-surfaces-tile-sidewalk', name: 'Sidewalk' }, { id: 'sub-surfaces-tile-stone', name: 'Stone' } ] },
      { id: 'sub-surfaces-wood', name: 'Wood', subcategories: [ { id: 'sub-surfaces-wood-board', name: 'Board' }, { id: 'sub-surfaces-wood-log', name: 'Log' }, { id: 'sub-surfaces-wood-other', name: 'Other' }, { id: 'sub-surfaces-wood-parquet', name: 'Parquet' }, { id: 'sub-surfaces-wood-plank', name: 'Plank' }, { id: 'sub-surfaces-wood-veneer', name: 'Veneer' } ] },
      { id: 'sub-surfaces-other', name: 'Other', subcategories: [ { id: 'sub-surfaces-other-climber', name: 'Climber' }, { id: 'sub-surfaces-other-creature', name: 'Creature' }, { id: 'sub-surfaces-other-dirt-road', name: 'Dirt Road' }, { id: 'sub-surfaces-other-edible', name: 'Edible' }, { id: 'sub-surfaces-other-fur', name: 'Fur' }, { id: 'sub-surfaces-other-paper', name: 'Paper' }, { id: 'sub-surfaces-other-various', name: 'Various' } ] },
    ]
  },
  {
    id: 'sub-decals',
    name: 'Decals',
    subcategories: [
      { id: 'sub-decals-blood', name: 'Blood', subcategories: [ { id: 'sub-decals-blood-spatter', name: 'Spatter' }, { id: 'sub-decals-blood-stain', name: 'Stain' } ] },
      { id: 'sub-decals-commercial', name: 'Commercial', subcategories: [ { id: 'sub-decals-commercial-poster', name: 'Poster' }, { id: 'sub-decals-commercial-sticker', name: 'Sticker' } ] },
      { id: 'sub-decals-concrete', name: 'Concrete', subcategories: [ { id: 'sub-decals-concrete-crack', name: 'Crack' }, { id: 'sub-decals-concrete-damage', name: 'Damage' }, { id: 'sub-decals-concrete-other', name: 'Other' }, { id: 'sub-decals-concrete-patch', name: 'Patch' } ] },
      { id: 'sub-decals-debris', name: 'Debris', subcategories: [ { id: 'sub-decals-debris-ash', name: 'Ash' }, { id: 'sub-decals-debris-burnt', name: 'Burnt' }, { id: 'sub-decals-debris-construction', name: 'Construction' }, { id: 'sub-decals-debris-dirt', name: 'Dirt' }, { id: 'sub-decals-debris-mulch', name: 'Mulch' }, { id: 'sub-decals-debris-other', name: 'Other' }, { id: 'sub-decals-debris-paper', name: 'Paper' }, { id: 'sub-decals-debris-stone', name: 'Stone' }, { id: 'sub-decals-debris-tile', name: 'Tile' }, { id: 'sub-decals-debris-trash', name: 'Trash' }, { id: 'sub-decals-debris-wood', name: 'Wood' } ] },
      { id: 'sub-decals-door', name: 'Door', subcategories: [ { id: 'sub-decals-door-metal', name: 'Metal' }, { id: 'sub-decals-door-wood', name: 'Wood' } ] },
      { id: 'sub-decals-fabric', name: 'Fabric', subcategories: [ { id: 'sub-decals-fabric-rag', name: 'Rag' }, { id: 'sub-decals-fabric-rug', name: 'Rug' } ] },
      { id: 'sub-decals-graffiti', name: 'Graffiti' },
      { id: 'sub-decals-leakage', name: 'Leakage', subcategories: [ { id: 'sub-decals-leakage-stamp', name: 'Stamp' }, { id: 'sub-decals-leakage-tileable', name: 'Tileable' } ] },
      { id: 'sub-decals-metal', name: 'Metal', subcategories: [ { id: 'sub-decals-metal-manhole-cover', name: 'Manhole Cover' }, { id: 'sub-decals-metal-other', name: 'Other' }, { id: 'sub-decals-metal-scrap', name: 'Scrap' }, { id: 'sub-decals-metal-sheet', name: 'Sheet' }, { id: 'sub-decals-metal-welding-seam', name: 'Welding Seam' } ] },
      { id: 'sub-decals-moss', name: 'Moss', subcategories: [ { id: 'sub-decals-moss-patch', name: 'Patch' }, { id: 'sub-decals-moss-spanish', name: 'Spanish' } ] },
      { id: 'sub-decals-mud', name: 'Mud' },
      { id: 'sub-decals-stone', name: 'Stone', subcategories: [ { id: 'sub-decals-stone-antique', name: 'Antique' }, { id: 'sub-decals-stone-debris', name: 'Debris' }, { id: 'sub-decals-stone-mosaic', name: 'Mosaic' }, { id: 'sub-decals-stone-other', name: 'Other' }, { id: 'sub-decals-stone-trim', name: 'Trim' } ] },
      { id: 'sub-decals-street', name: 'Street', subcategories: [ { id: 'sub-decals-street-manhole-cover', name: 'Manhole Cover' }, { id: 'sub-decals-street-other', name: 'Other' }, { id: 'sub-decals-street-painted-line', name: 'Painted Line' }, { id: 'sub-decals-street-patch', name: 'Patch' }, { id: 'sub-decals-street-pothole', name: 'Pothole' }, { id: 'sub-decals-street-sidewalk', name: 'Sidewalk' }, { id: 'sub-decals-street-stain', name: 'Stain' } ] },
      { id: 'sub-decals-tree', name: 'Tree', subcategories: [ { id: 'sub-decals-tree-bark', name: 'Bark' }, { id: 'sub-decals-tree-branch', name: 'Branch' }, { id: 'sub-decals-tree-log', name: 'Log' } ] },
      { id: 'sub-decals-trim', name: 'Trim', subcategories: [ { id: 'sub-decals-trim-floor', name: 'Floor' }, { id: 'sub-decals-trim-wall', name: 'Wall' } ] },
      { id: 'sub-decals-vegetation', name: 'Vegetation', subcategories: [ { id: 'sub-decals-vegetation-dried', name: 'Dried' }, { id: 'sub-decals-vegetation-flower', name: 'Flower' }, { id: 'sub-decals-vegetation-grass', name: 'Grass' }, { id: 'sub-decals-vegetation-hay', name: 'Hay' }, { id: 'sub-decals-vegetation-jungle', name: 'Jungle' }, { id: 'sub-decals-vegetation-leaf', name: 'Leaf' }, { id: 'sub-decals-vegetation-other', name: 'Other' }, { id: 'sub-decals-vegetation-twig', name: 'Twig' }, { id: 'sub-decals-vegetation-vine', name: 'Vine' }, { id: 'sub-decals-vegetation-weed', name: 'Weed' } ] },
      { id: 'sub-decals-wood', name: 'Wood', subcategories: [ { id: 'sub-decals-wood-board', name: 'Board' }, { id: 'sub-decals-wood-other', name: 'Other' }, { id: 'sub-decals-wood-plank', name: 'Plank' } ] },
      { id: 'sub-decals-other', name: 'Other', subcategories: [ { id: 'sub-decals-other-belt', name: 'Belt' }, { id: 'sub-decals-other-creature', name: 'Creature' }, { id: 'sub-decals-other-edible', name: 'Edible' }, { id: 'sub-decals-other-rock', name: 'Rock' }, { id: 'sub-decals-other-snow', name: 'Snow' }, { id: 'sub-decals-other-table-mat', name: 'Table Mat' }, { id: 'sub-decals-other-various', name: 'Various' } ] },
    ]
  },
  {
    id: 'sub-atlases',
    name: 'Atlases',
    subcategories: [
        { id: 'sub-atlases-debris', name: 'Debris', subcategories: [ { id: 'sub-atlases-debris-burnt', name: 'Burnt' }, { id: 'sub-atlases-debris-nature', name: 'Nature' }, { id: 'sub-atlases-debris-other', name: 'Other' }, { id: 'sub-atlases-debris-paper', name: 'Paper' }, { id: 'sub-atlases-debris-scrap', name: 'Scrap' }, { id: 'sub-atlases-debris-trash', name: 'Trash' }, { id: 'sub-atlases-debris-wood', name: 'Wood' } ] },
        { id: 'sub-atlases-grass', name: 'Grass', subcategories: [ { id: 'sub-atlases-grass-dried', name: 'Dried' }, { id: 'sub-atlases-grass-lawn', name: 'Lawn' }, { id: 'sub-atlases-grass-wild', name: 'Wild' } ] },
        { id: 'sub-atlases-herb', name: 'Herb', subcategories: [ { id: 'sub-atlases-herb-branch', name: 'Branch' }, { id: 'sub-atlases-herb-leaf', name: 'Leaf' }, { id: 'sub-atlases-herb-stem', name: 'Stem' }, { id: 'sub-atlases-herb-twig', name: 'Twig' } ] },
        { id: 'sub-atlases-plant', name: 'Plant', subcategories: [ { id: 'sub-atlases-plant-branch', name: 'Branch' }, { id: 'sub-atlases-plant-flower', name: 'Flower' }, { id: 'sub-atlases-plant-leaf', name: 'Leaf' }, { id: 'sub-atlases-plant-stem', name: 'Stem' } ] },
        { id: 'sub-atlases-shrub', name: 'Shrub', subcategories: [ { id: 'sub-atlases-shrub-branch', name: 'Branch' }, { id: 'sub-atlases-shrub-flower', name: 'Flower' }, { id: 'sub-atlases-shrub-leaf', name: 'Leaf' }, { id: 'sub-atlases-shrub-needle', name: 'Needle' }, { id: 'sub-atlases-shrub-stem', name: 'Stem' }, { id: 'sub-atlases-shrub-twig', name: 'Twig' } ] },
        { id: 'sub-atlases-tree', name: 'Tree', subcategories: [ { id: 'sub-atlases-tree-bark', name: 'Bark' }, { id: 'sub-atlases-tree-branch', name: 'Branch' }, { id: 'sub-atlases-tree-flower', name: 'Flower' }, { id: 'sub-atlases-tree-leaf', name: 'Leaf' }, { id: 'sub-atlases-tree-needle', name: 'Needle' }, { id: 'sub-atlases-tree-stem', name: 'Stem' }, { id: 'sub-atlases-tree-twig', name: 'Twig' } ] },
        { id: 'sub-atlases-vine', name: 'Vine', subcategories: [ { id: 'sub-atlases-vine-branch', name: 'Branch' }, { id: 'sub-atlases-vine-flower', name: 'Flower' }, { id: 'sub-atlases-vine-leaf', name: 'Leaf' }, { id: 'sub-atlases-vine-stem', name: 'Stem' } ] },
        { id: 'sub-atlases-other', name: 'Other', subcategories: [ { id: 'sub-atlases-other-assorted-plant', name: 'Assorted Plant' }, { id: 'sub-atlases-other-belt', name: 'Belt' }, { id: 'sub-atlases-other-creature', name: 'Creature' }, { id: 'sub-atlases-other-edible', name: 'Edible' }, { id: 'sub-atlases-other-metal', name: 'Metal' }, { id: 'sub-atlases-other-painting', name: 'Painting' }, { id: 'sub-atlases-other-various', name: 'Various' } ] },
    ]
  },
  {
    id: 'sub-imperfections',
    name: 'Imperfections',
    subcategories: [
      { id: 'sub-imperfections-metal', name: 'Metal', subcategories: [ { id: 'sub-imperfections-metal-clean', name: 'Clean' }, { id: 'sub-imperfections-metal-scratched', name: 'Scratched' } ] },
    ]
  },
  { id: 'sub-displacements', name: 'Displacements' },
  {
    id: 'sub-brushes',
    name: 'Brushes',
    subcategories: [
        { id: 'sub-brushes-blood', name: 'Blood' },
        { id: 'sub-brushes-damage', name: 'Damage' },
        { id: 'sub-brushes-dirt', name: 'Dirt' },
        { id: 'sub-brushes-graffiti', name: 'Graffiti' },
        { id: 'sub-brushes-grunge', name: 'Grunge' },
        { id: 'sub-brushes-imprint', name: 'Imprint' },
        { id: 'sub-brushes-leakage', name: 'Leakage' },
        { id: 'sub-brushes-scorchmark', name: 'Scorch Mark' },
        { id: 'sub-brushes-spatter', name: 'Spatter' },
        { id: 'sub-brushes-sponge', name: 'Sponge' },
        { id: 'sub-brushes-stain', name: 'Stain' },
        { id: 'sub-brushes-traditional', name: 'Traditional' },
    ]
  },
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
    categories: ['cat-3d', 'sub-rocks', 'cat-favorites'],
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
    categories: ['cat-surfaces', 'sub-soil'],
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
    categories: ['cat-3d', 'sub-rocks'],
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
    categories: ['cat-plants', 'sub-grasses'],
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
    categories: ['cat-surfaces', 'sub-soil'],
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
    categories: ['cat-atlases', 'sub-leaves'],
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
    categories: ['cat-3d', 'sub-structures'],
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
