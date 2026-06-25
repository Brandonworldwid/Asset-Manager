import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  FileArchive,
  FolderOpen,
  ArrowUpDown,
  Tag,
  Zap,
  Box,
  Leaf,
  Layers,
  LayoutGrid,
  Star,
  Check,
  ChevronDown
} from 'lucide-react';
import { Asset, AssetType, getAssetGroupKey, getAssetGroupName } from '../types';

interface AssetGridProps {
  assets: Asset[];
  selectedAssetId: string | null;
  selectedAssetIds: string[];
  onSelectAsset: (id: string) => void;
  onToggleSelectAsset: (id: string, isCtrl: boolean) => void;
  onToggleZip: (id: string) => void;
  activeCategoryName: string;
  onToggleFavorite: (id: string) => void;
  columns?: number;
}

type SortField = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

const typeIcons: Record<AssetType, React.ComponentType<any>> = {
  '3d': Box,
  '3dplant': Leaf,
  'surface': Layers,
  'atlas': LayoutGrid,
  'decal': Tag,
};

const typeLabels: Record<AssetType, string> = {
  '3d': '3D Asset',
  '3dplant': '3D Plant',
  'surface': 'Surface',
  'atlas': 'Atlas Map',
  'decal': 'Decal',
};

export default function AssetGrid({
  assets,
  selectedAssetId,
  selectedAssetIds,
  onSelectAsset,
  onToggleSelectAsset,
  onToggleZip,
  activeCategoryName,
  onToggleFavorite,
  columns = 4,
}: AssetGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and Sort Logic
  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || asset.type === selectedType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'size') {
        comparison = a.size - b.size;
      } else if (sortField === 'date') {
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Group multiple resolutions of the same asset into a single card
  const groupMap: Record<string, Asset[]> = {};
  filteredAssets.forEach((asset) => {
    const key = getAssetGroupKey(asset);
    if (!groupMap[key]) {
      groupMap[key] = [];
    }
    groupMap[key].push(asset);
  });

  const assetGroups = Object.entries(groupMap).map(([key, groupAssets]) => {
    const resOrder = { '8k': 4, '4k': 3, '2k': 2, '1k': 1 };
    const sortedGroupAssets = [...groupAssets].sort((a, b) => {
      const aVal = resOrder[a.resolution] || 0;
      const bVal = resOrder[b.resolution] || 0;
      return bVal - aVal;
    });

    const primaryAsset = sortedGroupAssets[0];
    const groupName = getAssetGroupName(primaryAsset);

    return {
      key,
      groupName,
      primaryAsset,
      allAssets: sortedGroupAssets,
    };
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const gridColsMap: Record<number, string> = {
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    7: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7',
    8: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8',
  };
  const colsClass = gridColsMap[columns] || gridColsMap[4];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0E0E0E]" id="asset-grid-workspace">
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-white/5 bg-[#111111]/60 flex flex-col md:flex-row md:items-center justify-between gap-3" id="grid-filters-bar">
        <div>
          <h2 className="font-sans font-bold text-base text-white flex items-center gap-2">
            <span>{activeCategoryName}</span>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-600/10 border border-blue-500/15 px-1.5 py-0.5 rounded">
              {assetGroups.length} {assetGroups.length === 1 ? 'asset' : 'assets'}
            </span>
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Organize, preview, and compress your megascan exports.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5" id="filters-controls-wrap">
          {/* Search bar (Picture 1 style) */}
          <div className="relative w-full sm:w-56 bg-[#121214] border border-white/10 hover:border-white/20 focus-within:border-white/30 rounded-full py-1 px-3.5 flex items-center gap-2 transition-all">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="bg-transparent border-none outline-none text-white text-xs w-full focus:ring-0 placeholder:text-gray-500"
              id="grid-search-input"
            />
          </div>

          {/* Type Filter Dropdown (Picture 2 style) */}
          <div className="relative" id="type-filter-dropdown-container">
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="bg-[#121214] border border-white/10 hover:border-white/20 text-gray-300 text-xs rounded-lg px-3.5 py-1.5 flex items-center justify-between gap-3 outline-none select-none transition-all cursor-pointer min-w-[110px]"
            >
              <span>
                {{
                  all: 'All Types',
                  '3d': '3D Assets',
                  '3dplant': 'Plants',
                  surface: 'Surfaces',
                  atlas: 'Atlases',
                }[selectedType] || 'All Types'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            
            {isTypeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsTypeDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-40 bg-[#121214] border border-white/10 rounded-lg shadow-2xl py-1 z-40 text-xs overflow-hidden">
                  {[
                    { value: 'all', label: 'All Types' },
                    { value: '3d', label: '3D Assets' },
                    { value: '3dplant', label: 'Plants' },
                    { value: 'surface', label: 'Surfaces' },
                    { value: 'atlas', label: 'Atlases' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedType(opt.value);
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        selectedType === opt.value
                          ? 'bg-blue-600/10 text-blue-400 font-bold'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort Toggles in Picture 2 style */}
          <button
            onClick={() => toggleSort('date')}
            className={`bg-[#121214] border px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              sortField === 'date'
                ? 'border-blue-500/50 text-blue-400 font-bold bg-blue-600/5'
                : 'border-white/10 hover:border-white/20 text-gray-300'
            }`}
            id="sort-by-date-btn"
          >
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3 text-gray-500" />
          </button>

          <button
            onClick={() => toggleSort('name')}
            className={`bg-[#121214] border px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              sortField === 'name'
                ? 'border-blue-500/50 text-blue-400 font-bold bg-blue-600/5'
                : 'border-white/10 hover:border-white/20 text-gray-300'
            }`}
            id="sort-by-name-btn"
          >
            <span>Name</span>
            <ArrowUpDown className="w-3 h-3 text-gray-500" />
          </button>

          <button
            onClick={() => toggleSort('size')}
            className={`bg-[#121214] border px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              sortField === 'size'
                ? 'border-blue-500/50 text-blue-400 font-bold bg-blue-600/5'
                : 'border-white/10 hover:border-white/20 text-gray-300'
            }`}
            id="sort-by-size-btn"
          >
            <span>Size</span>
            <ArrowUpDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Grid of Assets (Exactly 4 columns layout requested) */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/5" id="cards-grid-container">
        {assetGroups.length === 0 ? (
          <div className="h-92 flex flex-col items-center justify-center text-gray-500 text-center space-y-3.5" id="empty-grid-msg">
            <div className="p-3 bg-[#111111] border border-white/5 rounded-full text-gray-600">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans font-medium text-gray-300 text-sm">No assets match your filters</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Try clearing your search query or choosing another category.</p>
            </div>
          </div>
        ) : (
          <div className={`grid ${colsClass} gap-4`} id="asset-cards-grid">
            {assetGroups.map((group) => {
              const asset = group.primaryAsset;
              const TypeIcon = typeIcons[asset.type] || Box;
              const isMultiSelected = group.allAssets.some(a => selectedAssetIds.includes(a.id));
              const isSingleActive = selectedAssetId !== null && group.allAssets.some(a => a.id === selectedAssetId);
              
              // Total size of all resolution variants in this group
              const totalGroupSize = group.allAssets.reduce((sum, a) => sum + a.size, 0);

              return (
                <motion.div
                  key={group.key}
                  layoutId={`asset-group-card-${group.key}`}
                  onClick={(e) => {
                    // Detect if Ctrl or Cmd key is held
                    const isCtrl = e.ctrlKey || e.metaKey;
                    const alreadySelected = group.allAssets.find(a => selectedAssetIds.includes(a.id)) || group.allAssets.find(a => a.id === selectedAssetId);
                    const targetId = alreadySelected ? alreadySelected.id : asset.id;
                    onToggleSelectAsset(targetId, isCtrl);
                  }}
                  onDoubleClick={() => onToggleZip(selectedAssetId && group.allAssets.some(a => a.id === selectedAssetId) ? (selectedAssetId as string) : asset.id)}
                  whileHover={{ y: -2, transition: { duration: 0.12 } }}
                  className={`group relative flex flex-col bg-[#161616] rounded-xl border overflow-hidden cursor-pointer select-none transition-all ${
                    isMultiSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10 bg-[#1a1c22]'
                      : isSingleActive
                        ? 'border-blue-500/75 ring-1 ring-blue-500/10 bg-[#14161c]'
                        : 'border-white/5 hover:border-white/10 hover:bg-[#1C1C1C]'
                  }`}
                  id={`asset-group-card-${group.key}`}
                >
                  {/* Top Thumbnail Frame */}
                  <div className="relative aspect-square w-full bg-[#0F0F0F] flex items-center justify-center overflow-hidden border-b border-b-white/5">
                    <img
                      src={asset.thumbnailUrl}
                      alt={group.groupName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161616]/90 via-transparent to-black/30 opacity-90" />

                    {/* Asset Type / Selected badge (top-left) */}
                    <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 border text-white rounded text-[9px] font-bold font-mono tracking-wide backdrop-blur-sm transition-all ${
                      isMultiSelected 
                        ? 'bg-blue-600 border-blue-400 shadow-sm shadow-blue-500/20' 
                        : 'bg-black/75 border-white/10 text-gray-300'
                    }`}>
                      {isMultiSelected ? (
                        <Check className="w-3 h-3 text-white stroke-[3.5]" />
                      ) : (
                        <TypeIcon className="w-2.5 h-2.5 text-blue-400" />
                      )}
                      <span>{typeLabels[asset.type].toUpperCase()}</span>
                    </div>

                    {/* Compression Status badge (top-right) */}
                    <div className="absolute top-2 right-2 flex items-center">
                      {asset.isZipped ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded text-[9px] font-bold font-mono uppercase tracking-wider backdrop-blur-sm">
                          <FileArchive className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>Zip</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/20 text-blue-400 rounded text-[9px] font-bold font-mono uppercase tracking-wider backdrop-blur-sm">
                          <FolderOpen className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>Unzip</span>
                        </div>
                      )}
                    </div>

                    {/* Double-click Hint (Appears on hover) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity duration-150">
                      <span className="px-2 py-1 bg-[#111111]/95 border border-white/10 rounded text-[9px] font-mono text-gray-200 shadow-lg flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                        Dbl-click to {asset.isZipped ? 'unzip' : 'zip'}
                      </span>
                    </div>

                    {/* Favorite status Star button on card (bottom-right) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(asset.id);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 bg-black/75 border border-white/10 hover:border-yellow-500/40 rounded-lg text-gray-400 hover:text-yellow-400 backdrop-blur-sm transition-all z-20 cursor-pointer"
                      id={`favorite-btn-${asset.id}`}
                      title={asset.categories.includes('cat-favorites') ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          asset.categories.includes('cat-favorites')
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-400 group-hover:text-yellow-400'
                        }`}
                      />
                    </button>

                    {/* Multiple Resolutions list directly in bottom-left overlay */}
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1" id="group-resolutions-badges">
                      {group.allAssets.map((variant) => {
                        const isVarSelected = selectedAssetId === variant.id || selectedAssetIds.includes(variant.id);
                        return (
                          <span
                            key={variant.id}
                            className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm transition-colors border ${
                              isVarSelected
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-black/85 border-white/10 text-gray-300'
                            }`}
                          >
                            {variant.resolution.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Asset Details info */}
                  <div className="p-3 flex flex-col justify-between flex-grow bg-[#161616]">
                    <div>
                      <h3 className={`font-sans font-semibold text-xs group-hover:text-blue-400 transition-colors line-clamp-1 ${
                        isMultiSelected ? 'text-blue-300' : 'text-gray-200'
                      }`}>
                        {group.groupName}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-[9px] text-gray-500">
                          {group.allAssets.length > 1 ? `${group.allAssets.length} resolutions` : asset.id}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                        <span className="font-mono text-[9px] text-gray-400 font-bold" title="Combined resolution storage size">
                          {formatSize(totalGroupSize)}
                        </span>
                      </div>
                    </div>

                    {/* Combined tags */}
                    <div className="flex flex-wrap gap-0.5 mt-2.5">
                      {Array.from(new Set(group.allAssets.flatMap(a => a.tags))).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1 py-0.5 bg-white/5 border border-white/5 text-gray-400 rounded text-[8px] font-mono hover:text-white transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                      {Array.from(new Set(group.allAssets.flatMap(a => a.tags))).length > 3 && (
                        <span className="px-1 py-0.5 bg-white/5 border border-white/5 text-gray-500 rounded text-[8px] font-mono">
                          +{Array.from(new Set(group.allAssets.flatMap(a => a.tags))).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
