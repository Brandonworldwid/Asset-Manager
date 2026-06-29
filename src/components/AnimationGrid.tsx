import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  FolderOpen,
  ArrowUpDown,
  Compass,
  Star,
  Check,
  ChevronDown,
  X,
  Eye,
  Calendar,
  RefreshCw,
  Clock,
  Dribbble,
  Layers,
  FileCode,
  Sparkles,
  Play,
  Pause,
  AlertCircle,
  ArrowLeft,
  Edit2,
  FolderMinus,
  Trash2
} from 'lucide-react';

interface AnimationAsset {
  id: string;
  name: string;
  type: string;
  scannedPath: string;
  localPath: string;
  fileDate: string;
  fileSize: string;
  sizeBytes: number;
  skeletonName: string;
  frameCount: number;
  fps: number;
  duration: number;
  category: string;
  tags: string[];
  categories: string[];
  lastScanned: string;
  dateAdded: string;
  description: string;
  thumbnailUrl?: string;
  groupId?: string;
  isGroup?: boolean;
}

interface AnimationGridProps {
  animations: AnimationAsset[];
  selectedAnimId: string | null;
  selectedAnimIds: string[];
  onSelectAnim: (id: string | null) => void;
  onToggleSelectAnim: (id: string, isCtrl: boolean) => void;
  onSelectMultipleAnims: (ids: string[]) => void;
  onToggleFavorite: (id: string) => void;
  onRescanAnim: (id: string) => Promise<void>;
  isLoading?: boolean;
  activeGroupId?: string | null;
  onEnterGroup?: (id: string | null) => void;
  onRenameGroup?: (id: string, newName: string) => void;
  onDissolveGroup?: (id: string) => void;
  onExtractAnimsFromGroup?: (ids: string[]) => void;
}

type SortField = 'name' | 'duration' | 'frameCount' | 'date';
type SortOrder = 'asc' | 'desc';

// Card sub-component with interactive frame scrubbing on hover
const AnimationCard = ({
  anim,
  isSelected,
  selectedAnimIds,
  onSelect,
  onToggleFavorite,
  onRescan,
  onEnterGroup
}: {
  key?: string;
  anim: AnimationAsset;
  isSelected: boolean;
  selectedAnimIds: string[];
  onSelect: (e: React.MouseEvent) => void;
  onToggleFavorite: () => void;
  onRescan: (id: string) => Promise<void>;
  onEnterGroup?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [scrubFrame, setScrubFrame] = useState(0);
  const [isRescanning, setIsRescanning] = useState(false);
  const isFavorite = anim.categories?.includes('cat-favorites');
  const scrubIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated scrubbing frame increments on hover
  useEffect(() => {
    if (isHovered) {
      scrubIntervalRef.current = setInterval(() => {
        setScrubFrame((prev) => (prev + 1) % (anim.frameCount || 30));
      }, 1000 / (anim.fps || 30));
    } else {
      if (scrubIntervalRef.current) {
        clearInterval(scrubIntervalRef.current);
      }
      setScrubFrame(0);
    }

    return () => {
      if (scrubIntervalRef.current) {
        clearInterval(scrubIntervalRef.current);
      }
    };
  }, [isHovered, anim.frameCount, anim.fps]);

  const handleRescanClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRescanning) return;
    setIsRescanning(true);
    try {
      await onRescan(anim.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescanning(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.12 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      onDoubleClick={(e) => {
        if (anim.isGroup && onEnterGroup) {
          e.stopPropagation();
          onEnterGroup();
        }
      }}
      className={`group relative flex flex-col h-full w-full bg-[#161616] rounded-xl border overflow-hidden cursor-pointer select-none transition-all ${
        isSelected || selectedAnimIds.includes(anim.id)
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10 bg-[#1a1c22]'
          : 'border-white/5 hover:border-white/10 hover:bg-[#1C1C1C]'
      }`}
      id={`anim-card-${anim.id}`}
    >
      {/* Visual Animation Player Frame */}
      <div className="relative aspect-video w-full bg-[#0F0F0F] flex flex-col items-center justify-center overflow-hidden border-b border-b-white/5">
        
        {/* Abstract animated grid waves for procedural motion representation */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        {anim.isGroup ? (
          <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#161616] bg-indigo-500/10 flex items-center justify-center backdrop-blur-sm z-30">
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-[#161616] bg-blue-500/10 flex items-center justify-center backdrop-blur-sm z-20" />
              <div className="w-10 h-10 rounded-full border-2 border-[#161616] bg-teal-500/10 flex items-center justify-center backdrop-blur-sm z-10" />
            </div>
          </div>
        ) : anim.thumbnailUrl ? (
          <img
            src={anim.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-all duration-300 filter grayscale"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="p-4 bg-blue-500/5 rounded-full border border-blue-500/10">
            <Compass className={`w-8 h-8 text-blue-500/40 ${isHovered ? 'animate-spin' : ''}`} />
          </div>
        )}

        {/* Dynamic timeline progression scrubbing representation */}
        {isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1e1e1f]" id="scrub-track">
            <div 
              className="h-full bg-blue-500 transition-all duration-75" 
              style={{ width: `${((scrubFrame + 1) / (anim.frameCount || 1)) * 100}%` }}
              id="scrub-bar"
            />
          </div>
        )}

        {/* Floating Category/Tag (top-left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 bg-black/75 border border-white/10 text-gray-300 rounded text-[9px] font-bold font-mono tracking-wide backdrop-blur-sm shadow-sm">
          <Compass className="w-2.5 h-2.5 text-blue-400" />
          <span>{(anim.category || (anim.isGroup ? 'Group' : 'Animation')).toUpperCase()}</span>
        </div>

        {/* Skeleton type (bottom-left) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#0A0A0C]/90 border border-white/5 text-gray-400 rounded text-[8px] font-mono tracking-wider backdrop-blur-sm">
          <Layers className="w-2.5 h-2.5 text-gray-500" />
          <span>{anim.skeletonName || 'Mixed'}</span>
        </div>

        {/* Overlay showing play symbol or scrubbing counter */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/35 backdrop-blur-[1px] z-10">
          <div className="flex gap-2">
            {anim.isGroup ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEnterGroup) onEnterGroup();
                }}
                className="px-3 py-1.5 bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 hover:border-indigo-400 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                title="Open Group View"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Group</span>
              </button>
            ) : (
              <button
                onClick={handleRescanClick}
                disabled={isRescanning}
                className="px-3 py-1.5 bg-[#121214] border border-white/10 hover:border-blue-500/50 hover:bg-blue-600/10 text-gray-200 hover:text-blue-400 text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                title="Rescan file structure for changes"
              >
                <RefreshCw className={`w-3 h-3 ${isRescanning ? 'animate-spin' : ''}`} />
                <span>{isRescanning ? 'Rescanning...' : 'Rescan'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Favorite Star (top-right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute bottom-2 right-2 p-1.5 bg-black/75 border border-white/10 hover:border-yellow-500/40 rounded-lg text-gray-400 hover:text-yellow-400 backdrop-blur-sm transition-all z-20 cursor-pointer"
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              isFavorite
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-400 group-hover:text-yellow-400'
            }`}
          />
        </button>

        {/* Scrubbing Counter indicator (top-right) */}
        <div className="absolute top-2 right-2 font-mono text-[8px] font-bold px-1.5 py-0.5 bg-black/80 border border-white/5 rounded text-gray-400 select-none">
          {isHovered ? `F: ${scrubFrame + 1}/${anim.frameCount || 1}` : `${anim.fps || 30} FPS`}
        </div>
      </div>

      {/* Asset Metadata Text Detail */}
      <div className="p-3 flex flex-col justify-between flex-grow bg-[#161616]">
        <div>
          <h3 className={`font-sans font-semibold text-xs group-hover:text-blue-400 transition-colors line-clamp-1 ${
            isSelected ? 'text-blue-300' : 'text-gray-200'
          }`}>
            {anim.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-mono text-[9px] text-gray-500 uppercase">
              {anim.duration || 0}s
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
            <span className="font-mono text-[9px] text-gray-400 font-bold">
              {anim.frameCount || 0} frames
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
            <span className="font-mono text-[9px] text-gray-550 truncate max-w-[100px]" title={anim.scannedPath || ''}>
              {(anim.scannedPath || '').split('/').pop() || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Small Tags strip */}
        <div className="flex flex-wrap gap-0.5 mt-2.5">
          {(anim.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1 py-0.5 bg-white/5 border border-white/5 text-gray-400 rounded text-[8px] font-mono hover:text-white transition-colors"
            >
              #{tag}
            </span>
          ))}
          {anim.tags.length > 3 && (
            <span className="px-1 py-0.5 bg-white/5 border border-white/5 text-gray-500 rounded text-[8px] font-mono">
              +{anim.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function AnimationGrid({
  animations,
  selectedAnimId,
  selectedAnimIds,
  onSelectAnim,
  onToggleSelectAnim,
  onSelectMultipleAnims,
  onToggleFavorite,
  onRescanAnim,
  isLoading = false,
  activeGroupId,
  onEnterGroup,
  onRenameGroup,
  onDissolveGroup,
  onExtractAnimsFromGroup
}: AnimationGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkeleton, setSelectedSkeleton] = useState<string>('all');
  const [isSkelDropdownOpen, setIsSkelDropdownOpen] = useState(false);
  
  const [selectedFrameRange, setSelectedFrameRange] = useState<string>('all');
  const [isFrameDropdownOpen, setIsFrameDropdownOpen] = useState(false);
  
  const [selectedExt, setSelectedExt] = useState<string>('all');
  const [isExtDropdownOpen, setIsExtDropdownOpen] = useState(false);
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [quickViewAnim, setQuickViewAnim] = useState<AnimationAsset | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [lastClickedAnimId, setLastClickedAnimId] = useState<string | null>(null);

  // Group Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Play animation preview loop in Quick View
  useEffect(() => {
    let playTimer: NodeJS.Timeout | null = null;
    if (quickViewAnim && isPlayingPreview) {
      playTimer = setInterval(() => {
        setPreviewFrame((prev) => (prev + 1) % (quickViewAnim.frameCount || 30));
      }, 1000 / (quickViewAnim.fps || 30));
    } else {
      setPreviewFrame(0);
    }

    return () => {
      if (playTimer) clearInterval(playTimer);
    };
  }, [quickViewAnim, isPlayingPreview]);

  // Unique lists for filters
  const uniqueSkeletons = Array.from(new Set(animations.map((a) => a.skeletonName).filter(Boolean)));
  const uniqueExtensions = Array.from(new Set(animations.map((a) => a.scannedPath?.split('.').pop()?.toLowerCase()).filter(Boolean)));

  const frameRanges = [
    { value: 'all', label: 'All Lengths' },
    { value: 'short', label: 'Short (0-30f)' },
    { value: 'medium', label: 'Medium (31-100f)' },
    { value: 'long', label: 'Long (101+ f)' }
  ];

  // Filter & Sort Logic
  const filteredAnims = animations
    .filter((anim) => {
      const matchesSearch =
        anim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anim.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        anim.scannedPath.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSkeleton = selectedSkeleton === 'all' || anim.skeletonName === selectedSkeleton;

      let matchesFrameRange = true;
      if (selectedFrameRange === 'short') matchesFrameRange = anim.frameCount <= 30;
      else if (selectedFrameRange === 'medium') matchesFrameRange = anim.frameCount > 30 && anim.frameCount <= 100;
      else if (selectedFrameRange === 'long') matchesFrameRange = anim.frameCount > 100;

      const ext = anim.scannedPath?.split('.').pop()?.toLowerCase();
      const matchesExt = selectedExt === 'all' || ext === selectedExt;

      return matchesSearch && matchesSkeleton && matchesFrameRange && matchesExt;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'duration') {
        comparison = a.duration - b.duration;
      } else if (sortField === 'frameCount') {
        comparison = a.frameCount - b.frameCount;
      } else if (sortField === 'date') {
        const dateA = a.dateAdded || a.fileDate || '';
        const dateB = b.dateAdded || b.fileDate || '';
        comparison = dateA.localeCompare(dateB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handlePrevQuickView = () => {
    if (!quickViewAnim) return;
    const idx = filteredAnims.findIndex((a) => a.id === quickViewAnim.id);
    if (idx !== -1) {
      const prevIdx = (idx - 1 + filteredAnims.length) % filteredAnims.length;
      setQuickViewAnim(filteredAnims[prevIdx]);
      setCopiedPath(false);
      setPreviewFrame(0);
    }
  };

  const handleNextQuickView = () => {
    if (!quickViewAnim) return;
    const idx = filteredAnims.findIndex((a) => a.id === quickViewAnim.id);
    if (idx !== -1) {
      const nextIdx = (idx + 1) % filteredAnims.length;
      setQuickViewAnim(filteredAnims[nextIdx]);
      setCopiedPath(false);
      setPreviewFrame(0);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0E0E0E]" id="animation-grid-workspace">
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-white/5 bg-[#111111]/60 flex flex-col md:flex-row md:items-center justify-between gap-3" id="anim-filters-bar">
        <div>
          <h2 className="font-sans font-bold text-base text-white flex items-center gap-2">
            <span>Animations Database</span>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-600/10 border border-blue-500/15 px-1.5 py-0.5 rounded">
              {filteredAnims.length} {filteredAnims.length === 1 ? 'sequence' : 'sequences'}
            </span>
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Scanned binary metadata engine for Unreal Engine (.uasset/.ueasset) files.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5" id="anim-filters-controls-wrap">
          {/* Search bar */}
          <div className="relative w-full sm:w-56 bg-[#121214] border border-white/10 hover:border-white/20 focus-within:border-white/30 rounded-full py-1 px-3.5 flex items-center gap-2 transition-all">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search animations..."
              className="bg-transparent border-none outline-none text-white text-xs w-full focus:ring-0 placeholder:text-gray-500"
              id="anim-search-input"
            />
          </div>

          {/* Skeleton Filter Dropdown */}
          <div className="relative" id="skel-filter-dropdown-container">
            <button
              onClick={() => setIsSkelDropdownOpen(!isSkelDropdownOpen)}
              className="bg-[#121214] border border-white/10 hover:border-white/20 text-gray-300 text-xs rounded-lg px-3.5 py-1.5 flex items-center justify-between gap-3 outline-none select-none transition-all cursor-pointer min-w-[130px]"
            >
              <span>
                {selectedSkeleton === 'all' ? 'All Skeletons' : selectedSkeleton}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isSkelDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsSkelDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-44 bg-[#121214] border border-white/10 rounded-lg shadow-2xl py-1 z-40 text-xs overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedSkeleton('all');
                      setIsSkelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 transition-colors ${
                      selectedSkeleton === 'all'
                        ? 'bg-blue-600/10 text-blue-400 font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    All Skeletons
                  </button>
                  {uniqueSkeletons.map((sk) => (
                    <button
                      key={sk}
                      onClick={() => {
                        setSelectedSkeleton(sk);
                        setIsSkelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        selectedSkeleton === sk
                          ? 'bg-blue-600/10 text-blue-400 font-bold'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {sk}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Frame Range Filter Dropdown */}
          <div className="relative" id="frame-filter-dropdown-container">
            <button
              onClick={() => setIsFrameDropdownOpen(!isFrameDropdownOpen)}
              className="bg-[#121214] border border-white/10 hover:border-white/20 text-gray-300 text-xs rounded-lg px-3.5 py-1.5 flex items-center justify-between gap-3 outline-none select-none transition-all cursor-pointer min-w-[130px]"
            >
              <span>
                {frameRanges.find(r => r.value === selectedFrameRange)?.label || 'All Lengths'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isFrameDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsFrameDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-44 bg-[#121214] border border-white/10 rounded-lg shadow-2xl py-1 z-40 text-xs overflow-hidden">
                  {frameRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        setSelectedFrameRange(range.value);
                        setIsFrameDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        selectedFrameRange === range.value
                          ? 'bg-blue-600/10 text-blue-400 font-bold'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Extension Filter Dropdown */}
          <div className="relative" id="ext-filter-dropdown-container">
            <button
              onClick={() => setIsExtDropdownOpen(!isExtDropdownOpen)}
              className="bg-[#121214] border border-white/10 hover:border-white/20 text-gray-300 text-xs rounded-lg px-3.5 py-1.5 flex items-center justify-between gap-3 outline-none select-none transition-all cursor-pointer min-w-[110px]"
            >
              <span>
                {selectedExt === 'all' ? 'All Types' : `.${selectedExt}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isExtDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsExtDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-32 bg-[#121214] border border-white/10 rounded-lg shadow-2xl py-1 z-40 text-xs overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedExt('all');
                      setIsExtDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 transition-colors ${
                      selectedExt === 'all'
                        ? 'bg-blue-600/10 text-blue-400 font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    All Types
                  </button>
                  {uniqueExtensions.map((ext) => (
                    <button
                      key={ext}
                      onClick={() => {
                        setSelectedExt(ext);
                        setIsExtDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        selectedExt === ext
                          ? 'bg-blue-600/10 text-blue-400 font-bold'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      .{ext}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort toggles */}
          <button
            onClick={() => toggleSort('date')}
            className={`bg-[#121214] border px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              sortField === 'date'
                ? 'border-blue-500/50 text-blue-400 font-bold bg-blue-600/5'
                : 'border-white/10 hover:border-white/20 text-gray-300'
            }`}
            id="anim-sort-by-date-btn"
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
            id="anim-sort-by-name-btn"
          >
            <span>Name</span>
            <ArrowUpDown className="w-3 h-3 text-gray-500" />
          </button>

          <button
            onClick={() => toggleSort('frameCount')}
            className={`bg-[#121214] border px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              sortField === 'frameCount'
                ? 'border-blue-500/50 text-blue-400 font-bold bg-blue-600/5'
                : 'border-white/10 hover:border-white/20 text-gray-300'
            }`}
            id="anim-sort-by-frames-btn"
          >
            <span>Frames</span>
            <ArrowUpDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {activeGroupId && (() => {
        const activeGroup = animations.find(a => a.id === activeGroupId);
        if (!activeGroup) return null;
        
        const startEditing = () => {
          setEditingNameValue(activeGroup.name);
          setIsEditingName(true);
        };

        const saveGroupName = () => {
          if (editingNameValue.trim() && onRenameGroup) {
            onRenameGroup(activeGroup.id, editingNameValue.trim());
            setIsEditingName(false);
          }
        };

        return (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="anim-group-header">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (onEnterGroup) onEnterGroup(null);
                  onSelectAnim(null);
                  onSelectMultipleAnims([]);
                }}
                className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Back to Animations Database"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 rounded-lg text-indigo-400">
                  <FolderOpen className="w-4 h-4" />
                </div>
                
                <div className="flex flex-col">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveGroupName();
                          if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        className="bg-[#0e0e0f] border border-blue-500/50 rounded px-2 py-0.5 text-xs font-sans text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
                        autoFocus
                      />
                      <button
                        onClick={saveGroupName}
                        className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors cursor-pointer animate-fade-in"
                        title="Save Group Name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-sans font-extrabold text-white tracking-wide">
                        {activeGroup.name}
                      </h3>
                      <button
                        onClick={startEditing}
                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                        title="Rename Group"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 mt-0.5 font-mono">
                    {animations.filter(a => a.groupId === activeGroupId).length} items &bull; {activeGroup.fileSize || '0 KB'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Extract Selected button */}
              {selectedAnimIds.length > 0 && (
                <button
                  onClick={() => {
                    if (onExtractAnimsFromGroup) {
                      onExtractAnimsFromGroup(selectedAnimIds);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white rounded-lg text-xs font-semibold font-sans cursor-pointer transition-all"
                  title="Extract selected animations from this group back to the main library"
                >
                  <FolderMinus className="w-3.5 h-3.5" />
                  <span>Extract Selected ({selectedAnimIds.length})</span>
                </button>
              )}

              {/* Dissolve Group button */}
              <button
                onClick={() => {
                  if (onDissolveGroup && window.confirm('Are you sure you want to dissolve this group? All animations inside will remain intact and return to the main library view.')) {
                    onDissolveGroup(activeGroupId);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-xs font-semibold font-sans cursor-pointer transition-all"
                title="Dissolve group and return all contents to the main library"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dissolve Group</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Grid of Cards */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/5" id="anim-cards-grid-container">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="anim-cards-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-[#161616] rounded-xl border border-white/5 overflow-hidden h-[240px] animate-pulse">
                <div className="aspect-video w-full bg-[#1e1e1e] flex items-center justify-center">
                  <Compass className="w-8 h-8 text-white/5" />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAnims.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-gray-500 text-center space-y-3.5" id="anim-empty-grid-msg">
            <div className="p-3 bg-[#111111] border border-white/5 rounded-full text-gray-600">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans font-medium text-gray-300 text-sm">No animations found matching filters</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Check your selected mode filters or search keywords.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="anim-cards-grid">
            {filteredAnims.map((anim, index) => (
              <AnimationCard
                key={anim.id}
                anim={anim}
                isSelected={selectedAnimId === anim.id}
                selectedAnimIds={selectedAnimIds}
                onSelect={(e) => {
                  const isCtrl = e.ctrlKey || e.metaKey;
                  const isShift = e.shiftKey;

                  if (isShift && lastClickedAnimId) {
                    const startIdx = filteredAnims.findIndex(a => a.id === lastClickedAnimId);
                    const endIdx = index;
                    if (startIdx !== -1 && endIdx !== -1) {
                      const minIdx = Math.min(startIdx, endIdx);
                      const maxIdx = Math.max(startIdx, endIdx);
                      const rangeIds = filteredAnims.slice(minIdx, maxIdx + 1).map(a => a.id);
                      
                      const newSelection = new Set(selectedAnimIds);
                      rangeIds.forEach(id => newSelection.add(id));
                      onSelectMultipleAnims(Array.from(newSelection));
                    }
                  } else if (isCtrl) {
                    onToggleSelectAnim(anim.id, true);
                    setLastClickedAnimId(anim.id);
                  } else {
                    onToggleSelectAnim(anim.id, false);
                    setQuickViewAnim(selectedAnimId === anim.id ? null : anim);
                    setLastClickedAnimId(anim.id);
                  }
                }}
                onToggleFavorite={() => onToggleFavorite(anim.id)}
                onRescan={onRescanAnim}
                onEnterGroup={() => onEnterGroup?.(anim.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Quick View Modal with dynamic timeline scrubber playback */}
      <AnimatePresence>
        {quickViewAnim && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4" 
            id="quickview-overlay" 
            onClick={() => setQuickViewAnim(null)}
          >
            {/* Left navigation arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevQuickView();
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-[#111112]/80 hover:bg-[#161618] border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50"
              title="Previous Animation (Left Arrow)"
            >
              <X className="w-6 h-6 rotate-90 shrink-0 hidden" />
              <span>&larr;</span>
            </button>

            {/* Right navigation arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextQuickView();
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-[#111112]/80 hover:bg-[#161618] border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50"
              title="Next Animation (Right Arrow)"
            >
              <span>&rarr;</span>
            </button>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-4xl bg-[#111112] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[500px] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setQuickViewAnim(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/20 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer z-50 shadow-lg"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side: Animated Canvas previewer */}
              <div className="md:w-1/2 h-[220px] md:h-full relative bg-[#09090a] flex flex-col items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/5 p-6">
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                
                {/* Visual mannequin dynamic mesh mockup wrapper */}
                <div className="relative p-6 bg-blue-600/5 rounded-full border border-blue-500/10 mb-4 flex items-center justify-center w-24 h-24">
                  <Compass className={`w-12 h-12 text-blue-400/70 ${isPlayingPreview ? 'animate-spin' : ''}`} style={{ animationDuration: `${quickViewAnim.duration}s` }} />
                  {isPlayingPreview && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-blue-600 border border-blue-400/30 text-white font-mono text-[8px] font-bold rounded animate-bounce">
                      PLAY
                    </span>
                  )}
                </div>

                <div className="text-center z-10 space-y-1">
                  <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/20 text-blue-400 text-[10px] font-bold font-mono rounded tracking-wider uppercase">
                    {quickViewAnim.skeletonName} SKELETON
                  </span>
                  <div className="text-gray-300 font-mono text-xs font-semibold">
                    {isPlayingPreview ? `Playing Frame: ${previewFrame + 1} / ${quickViewAnim.frameCount}` : 'Ready to scrub timeline'}
                  </div>
                </div>

                {/* Scrubber controls at the bottom */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 border border-white/5 rounded-xl p-3 backdrop-blur-sm space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <button 
                      onClick={() => setIsPlayingPreview(!isPlayingPreview)} 
                      className="px-2 py-1 bg-white/5 border border-white/5 rounded text-white flex items-center gap-1 hover:bg-white/10"
                    >
                      {isPlayingPreview ? <Pause className="w-3 h-3 text-red-400" /> : <Play className="w-3 h-3 text-green-400" />}
                      <span>{isPlayingPreview ? 'PAUSE' : 'PLAY'}</span>
                    </button>
                    <span>FPS: {quickViewAnim.fps} | SECS: {quickViewAnim.duration}s</span>
                  </div>
                  <div className="h-1.5 bg-[#1C1C1F] rounded-full relative overflow-hidden" id="timeline-track">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${((isPlayingPreview ? previewFrame + 1 : 1) / quickViewAnim.frameCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Detailed properties */}
              <div className="md:w-1/2 p-6 flex flex-col justify-between bg-[#111112]">
                <div className="space-y-4">
                  <div>
                    <span className="font-mono text-[9px] font-bold tracking-widest text-blue-400 uppercase">
                      {quickViewAnim.category} sequence
                    </span>
                    <h2 className="font-sans font-bold text-lg text-white leading-snug mt-1">{quickViewAnim.name}</h2>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{quickViewAnim.description || 'No description available.'}</p>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">Scanned File Path</span>
                      <span className="text-gray-300 font-mono text-right max-w-[200px] truncate" title={quickViewAnim.scannedPath}>
                        {quickViewAnim.scannedPath}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">Animation Frames</span>
                      <span className="text-gray-300 font-mono font-bold">{quickViewAnim.frameCount} total frames</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">Target Frame Rate</span>
                      <span className="text-gray-300 font-mono">{quickViewAnim.fps} frames per second</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">File Last Modified</span>
                      <span className="text-gray-300 font-mono">{quickViewAnim.fileDate}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">Metadata Size</span>
                      <span className="text-gray-300 font-mono">{quickViewAnim.fileSize}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">Last Scanned Date</span>
                      <span className="text-blue-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quickViewAnim.lastScanned}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(quickViewAnim.scannedPath);
                      setCopiedPath(true);
                      setTimeout(() => setCopiedPath(false), 2000);
                    }}
                    className="flex-1 py-2 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{copiedPath ? 'Copied Path!' : 'Copy Relative Path'}</span>
                  </button>

                  <button
                    onClick={async () => {
                      await onRescanAnim(quickViewAnim.id);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rescan Details</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
