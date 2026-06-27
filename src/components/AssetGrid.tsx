import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronDown,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe,
  Calendar,
  Folder,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { Asset, AssetType, getAssetGroupKey, getAssetGroupName } from '../types';
import ExplorerModal from './ExplorerModal';

interface AssetGridProps {
  assets: Asset[];
  selectedAssetId: string | null;
  selectedAssetIds: string[];
  onSelectAsset: (id: string) => void;
  onToggleSelectAsset: (id: string, isCtrl: boolean) => void;
  onSelectMultipleAssets?: (ids: string[]) => void;
  onToggleZip: (id: string) => void;
  activeCategoryName: string;
  onToggleFavorite: (id: string) => void;
  columns?: number;
  isLoading?: boolean;
  onDoubleClickAsset?: (id: string) => void;
}

type SortField = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

const AssetCardSkeleton = () => {
  return (
    <div className="flex flex-col bg-[#161616] rounded-xl border border-white/5 overflow-hidden select-none h-[280px]">
      {/* Thumbnail area placeholder */}
      <div className="relative aspect-video w-full bg-[#1e1e1e] animate-pulse flex items-center justify-center">
        <Box className="w-8 h-8 text-white/10" />
        <div className="absolute top-2 left-2 w-12 h-4 bg-white/5 rounded animate-pulse" />
        <div className="absolute top-2 right-2 w-8 h-4 bg-white/5 rounded animate-pulse" />
      </div>
      {/* Meta/Text area placeholder */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          {/* Title bar */}
          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
          {/* Subtitle bar */}
          <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
        </div>
        {/* Bottom stats / tags row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="h-3 bg-white/5 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-1/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const typeIcons: Record<AssetType, React.ComponentType<any>> = {
  '3d': Box,
  '3dplant': Leaf,
  'surface': Layers,
  'atlas': LayoutGrid,
  'decal': Tag,
  '2d': ImageIcon,
};

const typeLabels: Record<AssetType, string> = {
  '3d': '3D Asset',
  '3dplant': '3D Plant',
  'surface': 'Surface',
  'atlas': 'Atlas Map',
  'decal': 'Decal',
  '2d': '2D Image',
};

export default function AssetGrid({
  assets,
  selectedAssetId,
  selectedAssetIds,
  onSelectAsset,
  onToggleSelectAsset,
  onSelectMultipleAssets,
  onToggleZip,
  activeCategoryName,
  onToggleFavorite,
  columns = 4,
  isLoading = false,
  onDoubleClickAsset,
}: AssetGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string>('all');
  const [isResDropdownOpen, setIsResDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [quickViewAsset, setQuickViewAsset] = useState<Asset | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [isQuickViewMaximized, setIsQuickViewMaximized] = useState(false);
  const [showExplorerModal, setShowExplorerModal] = useState(false);
  const [useTransparencyGrid, setUseTransparencyGrid] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const [lastClickedGroupKey, setLastClickedGroupKey] = useState<string | null>(null);

  // Reset visible items count when filters or assets list size change
  React.useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, selectedType, selectedResolution, sortField, sortOrder, assets.length]);

  // Filter and Sort Logic
  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || asset.type === selectedType;
      
      const matchesResolution = selectedResolution === 'all' || asset.resolution.toLowerCase() === selectedResolution.toLowerCase();

      return matchesSearch && matchesType && matchesResolution;
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

  const handlePrevQuickView = () => {
    if (!quickViewAsset) return;
    const currentIndex = assetGroups.findIndex(g => g.allAssets.some(a => a.id === quickViewAsset.id));
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + assetGroups.length) % assetGroups.length;
      setQuickViewAsset(assetGroups[prevIndex].primaryAsset);
      setCopiedPath(false);
    }
  };

  const handleNextQuickView = () => {
    if (!quickViewAsset) return;
    const currentIndex = assetGroups.findIndex(g => g.allAssets.some(a => a.id === quickViewAsset.id));
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % assetGroups.length;
      setQuickViewAsset(assetGroups[nextIndex].primaryAsset);
      setCopiedPath(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!quickViewAsset) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        setQuickViewAsset(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevQuickView();
      } else if (e.key === 'ArrowRight') {
        handleNextQuickView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickViewAsset, assetGroups]);

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

          {/* Resolution Filter Dropdown */}
          <div className="relative" id="res-filter-dropdown-container">
            <button
              onClick={() => setIsResDropdownOpen(!isResDropdownOpen)}
              className="bg-[#121214] border border-white/10 hover:border-white/20 text-gray-300 text-xs rounded-lg px-3.5 py-1.5 flex items-center justify-between gap-3 outline-none select-none transition-all cursor-pointer min-w-[110px]"
            >
              <span>
                {selectedResolution === 'all' ? 'All Resolutions' : selectedResolution.toUpperCase()}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            
            {isResDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsResDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-40 bg-[#121214] border border-white/10 rounded-lg shadow-2xl py-1 z-40 text-xs overflow-hidden">
                  {[
                    { value: 'all', label: 'All Resolutions' },
                    { value: '8k', label: '8K Ultra HD' },
                    { value: '4k', label: '4K High Res' },
                    { value: '2k', label: '2K Medium Res' },
                    { value: '1k', label: '1K Standard' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedResolution(opt.value);
                        setIsResDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        selectedResolution === opt.value
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
        {isLoading ? (
          <div className={`grid ${colsClass} gap-4`} id="asset-cards-grid-loading">
            {Array.from({ length: 12 }).map((_, i) => (
              <AssetCardSkeleton key={i} />
            ))}
          </div>
        ) : assetGroups.length === 0 ? (
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
          <>
            <div className={`grid ${colsClass} gap-4`} id="asset-cards-grid">
            {assetGroups.slice(0, visibleCount).map((group) => {
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
                    const isShift = e.shiftKey;
                    const alreadySelected = group.allAssets.find(a => selectedAssetIds.includes(a.id)) || group.allAssets.find(a => a.id === selectedAssetId);
                    const targetId = alreadySelected ? alreadySelected.id : asset.id;

                    if (isShift && lastClickedGroupKey && onSelectMultipleAssets) {
                      // Perform range selection based on rendered assetGroups
                      const startIdx = assetGroups.findIndex(g => g.key === lastClickedGroupKey);
                      const endIdx = assetGroups.findIndex(g => g.key === group.key);
                      
                      if (startIdx !== -1 && endIdx !== -1) {
                        const minIdx = Math.min(startIdx, endIdx);
                        const maxIdx = Math.max(startIdx, endIdx);
                        
                        // Get the groups in between (inclusive)
                        const rangeGroups = assetGroups.slice(minIdx, maxIdx + 1);
                        
                        // Extract target asset IDs for each group in the range
                        const targetIds = rangeGroups.map(g => {
                          const existingSelected = g.allAssets.find(a => selectedAssetIds.includes(a.id)) || g.allAssets.find(a => a.id === selectedAssetId);
                          return existingSelected ? existingSelected.id : g.primaryAsset.id;
                        });
                        
                        let newSelectedIds: string[];
                        if (isCtrl) {
                          // Union of current selection and targetIds
                          newSelectedIds = Array.from(new Set([...selectedAssetIds, ...targetIds]));
                        } else {
                          newSelectedIds = targetIds;
                        }
                        
                        onSelectMultipleAssets(newSelectedIds);
                      }
                      setLastClickedGroupKey(group.key);
                    } else {
                      // Normal toggle/single selection
                      onToggleSelectAsset(targetId, isCtrl);
                      setLastClickedGroupKey(group.key);
                    }
                  }}
                  onDoubleClick={() => {
                    const targetId = selectedAssetId && group.allAssets.some(a => a.id === selectedAssetId) ? (selectedAssetId as string) : asset.id;
                    if (onDoubleClickAsset) {
                      onDoubleClickAsset(targetId);
                    } else {
                      onToggleZip(targetId);
                    }
                  }}
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
                      src={asset.originalUrl || asset.thumbnailUrl}
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

                    {/* Hover Overlay with Quick View Button & Dbl-Click Hint */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-[2px] transition-opacity duration-150 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewAsset(asset);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
                        id={`quick-view-btn-${asset.id}`}
                        title="Quick View Asset"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick View</span>
                      </button>
                      <span className="px-1.5 py-0.5 bg-[#111111]/90 border border-white/5 rounded text-[8px] font-mono text-gray-400 flex items-center gap-1">
                        <Zap className="w-2 h-2 text-blue-400 animate-pulse" />
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

          {assetGroups.length > visibleCount && (
            <div className="flex flex-col items-center justify-center mt-8 mb-6 pb-6" id="load-more-container">
              <p className="text-xs text-gray-500 mb-3 font-mono">
                Showing {visibleCount} of {assetGroups.length} assets
              </p>
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 100, assetGroups.length))}
                className="px-6 py-2.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 hover:text-white transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-2"
                id="load-more-btn"
              >
                <span>Load More Assets</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </>
      )}
    </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewAsset && (() => {
          const freshAsset = assets.find(a => a.id === quickViewAsset.id) || quickViewAsset;
          const group = assetGroups.find(g => g.allAssets.some(a => a.id === freshAsset.id)) || {
            groupName: freshAsset.name,
            allAssets: [freshAsset],
          };
          const allAssets: Asset[] = group.allAssets;
          const totalGroupSize = allAssets.reduce((sum, a) => sum + a.size, 0);
          const TypeIcon = typeIcons[freshAsset.type] || Box;

          const isFlippedZip = freshAsset.isZipped;

          const handleCopyPath = () => {
            navigator.clipboard.writeText(freshAsset.scannedPath || '');
            setCopiedPath(true);
            setTimeout(() => setCopiedPath(false), 2000);
          };

          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-4" id="quickview-overlay" onClick={() => { setQuickViewAsset(null); setIsQuickViewMaximized(false); }}>
              {isQuickViewMaximized && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#09090a]" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsQuickViewMaximized(false); }}
                    className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-lg z-[140]"
                    title="Exit Full Screen"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevQuickView(); }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-[140]"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextQuickView(); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-[140]"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  <img
                    src={freshAsset.originalUrl || freshAsset.thumbnailUrl}
                    alt={freshAsset.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-8 select-none shadow-2xl"
                  />
                </div>
              )}
              {/* Left Navigation Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevQuickView();
                }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-[#111112]/80 hover:bg-[#161618] border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50 animate-pulse"
                title="Previous Asset (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Modal Window */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`w-full max-w-5xl bg-[#111112] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[640px] relative ${isQuickViewMaximized ? 'hidden' : ''}`}
                id="quickview-modal-window"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setQuickViewAsset(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/20 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer z-50 shadow-lg"
                  title="Close Quick View (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left Side: Thumbnail Preview Frame */}
                <div 
                  className="md:w-1/2 h-[260px] md:h-full relative bg-[#09090a] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/5"
                  style={useTransparencyGrid ? { 
                    backgroundImage: 'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)', 
                    backgroundSize: '16px 16px', 
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0', 
                    backgroundColor: '#0a0a0c' 
                  } : {}}
                >
                  {/* Grid background effect (only when checkerboard is off) */}
                  {!useTransparencyGrid && (
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                  <img
                    src={freshAsset.originalUrl || freshAsset.thumbnailUrl}
                    alt={freshAsset.name}
                    referrerPolicy="no-referrer"
                    className="max-w-[85%] max-h-[85%] object-contain select-none shadow-2xl rounded-lg"
                  />

                  {/* Top-left Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-30">
                    <span className="bg-blue-600 border border-blue-400/30 text-white rounded px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wide shadow-lg flex items-center gap-1.5">
                      <TypeIcon className="w-3.5 h-3.5" />
                      {typeLabels[freshAsset.type].toUpperCase()}
                    </span>
                    <span className="bg-black/75 border border-white/10 text-gray-300 rounded px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider w-fit">
                      {freshAsset.resolution.toUpperCase()} RESOLUTION
                    </span>
                  </div>

                  {/* Checkerboard Backdrop Toggle for 2D assets */}
                  {freshAsset.type === '2d' && (
                    <div className="absolute top-4 right-16 flex items-center gap-2 z-30">
                      <button
                        onClick={() => setIsQuickViewMaximized(true)}
                        className="px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg border bg-black/75 border-white/10 text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer backdrop-blur-sm shadow-md"
                        title="Maximize Image"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setUseTransparencyGrid(!useTransparencyGrid)}
                        className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer backdrop-blur-sm shadow-md ${
                          useTransparencyGrid
                            ? 'bg-blue-600 border-blue-400 text-white hover:bg-blue-500'
                            : 'bg-black/75 border-white/10 text-gray-400 hover:text-white'
                        }`}
                        title="Toggle checkered background for alpha/transparency channel"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{useTransparencyGrid ? 'ALPHA ON' : 'ALPHA OFF'}</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Actions overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    {/* Resolution toggle list */}
                    <div className="flex gap-1 bg-black/60 border border-white/5 p-1 rounded-lg backdrop-blur-sm">
                      {group.allAssets.map((variant) => {
                        const isVarSelected = freshAsset.id === variant.id;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setQuickViewAsset(variant);
                              setCopiedPath(false);
                            }}
                            className={`font-mono text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                              isVarSelected
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {variant.resolution.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Zip status / toggle & Favorite button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleZip(freshAsset.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer backdrop-blur-sm ${
                          isFlippedZip
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                        }`}
                        title={isFlippedZip ? 'Unzip asset' : 'Zip asset'}
                      >
                        {isFlippedZip ? (
                          <>
                            <FileArchive className="w-3 h-3" />
                            <span>ZIPPED</span>
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-3 h-3" />
                            <span>UNZIPPED</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onToggleFavorite(freshAsset.id)}
                        className="p-1.5 bg-black/60 border border-white/10 hover:border-yellow-500/40 rounded-lg text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer"
                        title={freshAsset.categories.includes('cat-favorites') ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            freshAsset.categories.includes('cat-favorites')
                              ? 'text-yellow-400 fill-yellow-400'
                              : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Primary Properties Details */}
                <div className="md:w-1/2 flex flex-col h-full overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-white/5 bg-[#111112]">
                  <div className="min-h-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                      <span>Megascans Asset Library</span>
                      <span>/</span>
                      <span className="text-blue-400">{typeLabels[freshAsset.type]}</span>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight mt-1 mb-2">
                      {group.groupName}
                    </h2>

                    {freshAsset.description ? (
                      <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                        {freshAsset.description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 italic leading-relaxed font-sans mb-4">
                        High fidelity material scan designed for real-time applications, film visual production, and architecture previewing.
                      </p>
                    )}

                    <div className="border-t border-white/5 my-4" />

                    {/* Meta Properties Grid */}
                    <div className="grid grid-cols-2 gap-3.5 text-xs mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">File Size</span>
                        <div className="text-white font-medium flex flex-wrap items-center gap-1">
                          <span className="font-mono">{formatSize(freshAsset.size)}</span>
                          {group.allAssets.length > 1 && (
                            <span className="text-[10px] text-gray-500">
                              ({formatSize(totalGroupSize)} combined)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Date Imported</span>
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{new Date(freshAsset.dateAdded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {(freshAsset.country || freshAsset.region) && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Origin Location</span>
                          <div className="text-white font-medium flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-gray-500" />
                            <span>
                              {[freshAsset.region, freshAsset.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {freshAsset.packName && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Asset Pack Collection</span>
                          <div className="text-white font-medium truncate" title={freshAsset.packName}>
                            {freshAsset.packName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scanned Path Row */}
                    <div className="p-3 bg-black/20 border border-white/5 rounded-xl text-xs space-y-1.5 mb-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-blue-400" />
                          <span>Local Export Folder</span>
                        </span>
                        <button
                          onClick={handleCopyPath}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 hover:text-white rounded border border-white/5 transition-colors cursor-pointer flex items-center gap-1 font-mono"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedPath ? 'COPIED!' : 'COPY'}</span>
                        </button>
                      </div>
                      <div
                        onClick={() => setShowExplorerModal(true)}
                        className="group/path cursor-pointer text-[10px] text-blue-400 hover:text-blue-300 break-all leading-normal font-mono font-medium block bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-500/30 rounded p-2 transition-all flex items-start gap-2 shadow-inner"
                        title="Click to open Virtual File Explorer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400 group-hover/path:scale-110 shrink-0 transition-transform mt-0.5" />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="block truncate font-bold">{freshAsset.scannedPath || 'Not Scanned'}</span>
                          <span className="text-[9px] text-gray-500 font-bold tracking-wider uppercase group-hover/path:text-blue-400/80 transition-colors flex items-center gap-1">
                            Explore local files & directories
                          </span>
                        </div>
                      </div>
                    </div>

                    {freshAsset.type === '2d' && (
                      <div className="mb-6 space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2 mb-2">
                          <Box className="w-3.5 h-3.5 text-blue-400" />
                          <span>Technical Parameters</span>
                        </h4>
                        <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs font-mono text-gray-300 shadow-inner">
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-gray-400 font-medium">Asset Type</span>
                            <span className="text-white font-bold capitalize">{freshAsset.type}</span>
                          </div>
                          {freshAsset.width && freshAsset.height && (
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-gray-400 font-medium">Resolution</span>
                              <span className="text-white font-bold">{freshAsset.width} × {freshAsset.height} px</span>
                            </div>
                          )}
                          {freshAsset.orientation && (
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-gray-400 font-medium">Orientation</span>
                              <span className="text-blue-400 font-bold capitalize">{freshAsset.orientation}</span>
                            </div>
                          )}
                          {freshAsset.aspectRatio && (
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-gray-400 font-medium">Aspect Ratio</span>
                              <span className="text-white font-bold">{freshAsset.aspectRatio}</span>
                            </div>
                          )}
                          {freshAsset.colors && freshAsset.colors.length > 0 && (
                            <div className="py-1.5 border-b border-white/5">
                              <span className="text-gray-400 font-medium block mb-1.5">Dominant Colors (Click to Copy)</span>
                              <div className="flex flex-wrap gap-1.5 mt-1 bg-black/35 p-1.5 rounded-lg border border-white/5">
                                {freshAsset.colors.map((colorHex) => (
                                  <button
                                    key={colorHex}
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(colorHex);
                                    }}
                                    className="w-6 h-6 rounded-md border border-white/15 cursor-pointer hover:scale-110 hover:border-white/40 active:scale-95 transition-all duration-100 flex items-center justify-center group relative"
                                    style={{ backgroundColor: colorHex }}
                                    title={`Copy hex ${colorHex}`}
                                  >
                                    <span className="absolute bottom-full mb-1 bg-black text-white text-[8px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-100 z-50">
                                      {colorHex}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Spec details based on Asset Type */}
                    {freshAsset.meshStats && (
                      <div className="mb-6 space-y-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Mesh Geometry Specs</span>
                        <div className="grid grid-cols-3 gap-2 bg-black/10 border border-white/5 p-3 rounded-xl text-xs">
                          <div>
                            <div className="text-gray-500 text-[10px] font-mono">FORMAT</div>
                            <div className="text-white font-bold font-mono mt-0.5">{freshAsset.meshStats.format}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-[10px] font-mono">VERTICES</div>
                            <div className="text-white font-bold font-mono mt-0.5">
                              {freshAsset.meshStats.vertices.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-[10px] font-mono">TRIANGLES</div>
                            <div className="text-white font-bold font-mono mt-0.5">
                              {freshAsset.meshStats.triangles.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Textures list if any */}
                    {freshAsset.textures && freshAsset.textures.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                          Linked Texture Maps ({freshAsset.textures.length})
                        </span>
                        <div className="space-y-1 bg-black/10 border border-white/5 p-2 rounded-xl max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
                          {freshAsset.textures.map((tex, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] py-1 px-2 hover:bg-white/5 rounded transition-colors border-b border-white/2 last:border-0">
                              <div className="flex items-center gap-1.5 font-medium text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
                                <span className="text-white font-mono">{tex.type}</span>
                                <span className="text-gray-500 text-[9px] truncate max-w-[120px]" title={tex.name}>{tex.name}</span>
                              </div>
                              <div className="flex items-center gap-2 font-mono text-[10px]">
                                <span className="bg-white/5 border border-white/5 text-gray-400 px-1 rounded text-[9px]">{tex.resolution}</span>
                                <span className="text-gray-500">{tex.size}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {freshAsset.tags && freshAsset.tags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Metadata Tags</span>
                        <div className="flex flex-wrap gap-1">
                          {freshAsset.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-white/5 border border-white/5 text-gray-400 rounded-lg text-[10px] font-mono hover:text-white hover:border-white/10 transition-all"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Right Navigation Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextQuickView();
                }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-[#111112]/80 hover:bg-[#161618] border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50 animate-pulse"
                title="Next Asset (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {showExplorerModal && (
                <ExplorerModal 
                  asset={freshAsset} 
                  onClose={() => setShowExplorerModal(false)}
                  formatSize={formatSize}
                />
              )}
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
