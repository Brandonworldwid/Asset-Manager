import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileArchive,
  FolderOpen,
  Box,
  FileText,
  Calendar,
  Loader2,
  Tag,
  FolderPlus,
  Layers,
  RefreshCw,
  Check,
  Trash2,
  FolderMinus,
  FolderSync,
  MapPin,
  AlertCircle,
  Star,
  Folder,
  File,
  Search,
  ArrowLeft,
  LayoutGrid,
  List,
  ExternalLink,
  Camera
} from 'lucide-react';
import { Asset, Category, getAssetGroupKey } from '../types';

interface AssetDetailsProps {
  asset: Asset | null;
  allAssets: Asset[];
  categories: Category[];
  onClose: () => void;
  onToggleZip: (id: string) => void;
  onSaveAssetDetails: (id: string, updatedFields: { name: string; categories: string[]; tags: string[]; thumbnailUrl?: string }) => void;
  onSelectAsset: (id: string) => void;
  onDeleteAsset: (id: string) => void;
  onRemoveFromManager: (id: string) => void;
  onMoveAssetPath: (id: string, newPath: string) => void;
  notify: (msg: string) => void;
  moodboards?: string[];
  onUpdateAssetMoodboards?: (id: string, moodboards: string[]) => void;
}

export default function AssetDetails({
  asset,
  allAssets,
  categories,
  onClose,
  onToggleZip,
  onSaveAssetDetails,
  onSelectAsset,
  onDeleteAsset,
  onRemoveFromManager,
  onMoveAssetPath,
  notify,
  moodboards = [],
  onUpdateAssetMoodboards,
}: AssetDetailsProps) {
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionLog, setCompressionLog] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Rescan states
  const [rescanning, setRescanning] = useState(false);
  const [rescanProgress, setRescanProgress] = useState(0);
  const [rescanLog, setRescanLog] = useState<string[]>([]);

  // Dialog/Modal states
  const [showMoveCategoryModal, setShowMoveCategoryModal] = useState(false);
  const [showMovePathModal, setShowMovePathModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Virtual File Explorer states
  const [showExplorerModal, setShowExplorerModal] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerViewMode, setExplorerViewMode] = useState<'grid' | 'list'>('grid');
  const [currentSubFolder, setCurrentSubFolder] = useState<string | null>(null); // null = root
  const [selectedExplorerFile, setSelectedExplorerFile] = useState<any | null>(null);

  // Drive path relocation simulation state
  const [isRelocating, setIsRelocating] = useState(false);
  const [relocationProgress, setRelocationProgress] = useState(0);
  const [relocationLogs, setRelocationLogs] = useState<string[]>([]);
  const [relocatedPath, setRelocatedPath] = useState('');

  // Local draft states for tracking modifications
  const [draftName, setDraftName] = useState('');
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [draftThumbnailUrl, setDraftThumbnailUrl] = useState('');

  // Resizable Width state
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('megascan_details_width');
    return saved ? parseInt(saved, 10) : 340; // default 340px
  });

  // Initialize draft states and reset compression state if selected asset changes
  useEffect(() => {
    setCompressing(false);
    setCompressionProgress(0);
    setCompressionLog([]);
    
    setRescanning(false);
    setRescanProgress(0);
    setRescanLog([]);

    setShowExplorerModal(false);
    setExplorerSearch('');
    setCurrentSubFolder(null);
    setSelectedExplorerFile(null);

    if (asset) {
      setDraftName(asset.name);
      setDraftCategories(asset.categories);
      setDraftTags(asset.tags);
      setDraftThumbnailUrl(asset.thumbnailUrl);
    }
  }, [asset?.id]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const assetFiles = React.useMemo(() => {
    if (!asset) return [];
    const id = asset.id;
    const format = asset.meshStats?.format || 'OBJ';
    
    const rootItems = [
      {
        name: 'previews',
        type: 'folder',
        size: '1.2 MB',
        itemsCount: 2,
        parent: null,
      },
      {
        name: 'Textures',
        type: 'folder',
        size: formatSize(asset.textures.reduce((sum, t) => {
          const num = parseFloat(t.size.split(' ')[0]) || 20;
          return sum + (num * 1024 * 1024);
        }, 0)),
        itemsCount: asset.textures.length,
        parent: null,
      },
      ...(asset.meshStats ? [{
        name: 'Geometry',
        type: 'folder',
        size: '25.4 MB',
        itemsCount: 3,
        parent: null,
      }] : []),
      {
        name: `${id}.json`,
        type: 'json',
        size: '12.4 KB',
        parent: null,
        content: asset,
      },
      {
        name: `Render_Preview_Retina_sp.jpg`,
        type: 'image',
        size: '619 KB',
        parent: null,
        url: asset.thumbnailUrl,
      }
    ];

    const previewItems = [
      {
        name: `${id}_Thumb_HighPoly.png`,
        type: 'image',
        size: '526 KB',
        parent: 'previews',
        url: asset.thumbnailUrl,
      },
      {
        name: `${id}_Thumb_HighPoly_Retina.png`,
        type: 'image',
        size: '1.9 MB',
        parent: 'previews',
        url: asset.thumbnailUrl,
      }
    ];

    const textureItems = asset.textures.map(tex => ({
      name: tex.name,
      type: 'image',
      size: tex.size,
      parent: 'Textures',
      resolution: tex.resolution,
      textureType: tex.type,
      url: asset.thumbnailUrl,
    }));

    const geometryItems = asset.meshStats ? [
      {
        name: `${id}_High.${format.toLowerCase()}`,
        type: 'mesh',
        size: '15.2 MB',
        parent: 'Geometry',
        vertices: asset.meshStats.vertices * 3,
        triangles: asset.meshStats.triangles * 3,
      },
      {
        name: `${id}_LOD0.${format.toLowerCase()}`,
        type: 'mesh',
        size: '4.8 MB',
        parent: 'Geometry',
        vertices: asset.meshStats.vertices,
        triangles: asset.meshStats.triangles,
      },
      {
        name: `${id}_LOD1.${format.toLowerCase()}`,
        type: 'mesh',
        size: '2.1 MB',
        parent: 'Geometry',
        vertices: Math.round(asset.meshStats.vertices / 2),
        triangles: Math.round(asset.meshStats.triangles / 2),
      }
    ] : [];

    return [...rootItems, ...previewItems, ...textureItems, ...geometryItems];
  }, [asset]);

  const displayedFiles = React.useMemo(() => {
    return assetFiles.filter(file => {
      if (file.parent !== currentSubFolder) return false;
      if (explorerSearch.trim()) {
        return file.name.toLowerCase().includes(explorerSearch.toLowerCase());
      }
      return true;
    });
  }, [assetFiles, currentSubFolder, explorerSearch]);

  if (!asset) return null;

  const handleCompressionAction = async () => {
    if (compressing) return;
    setCompressing(true);
    setCompressionProgress(0);
    setCompressionLog([]);

    const isCurrentlyZipped = asset.isZipped;
    const actionWord = isCurrentlyZipped ? 'Extracting' : 'Archiving';

    const logs = [
      `Initializing compression utility...`,
      `${actionWord} asset payload: "${asset.name}" (${asset.id})`,
      `Target directory: "${asset.scannedPath}"`,
    ];

    setCompressionLog([...logs]);
    await delay(400);
    setCompressionProgress(15);

    if (!isCurrentlyZipped) {
      // Zipping steps
      setCompressionLog(prev => [...prev, `Compressing asset folders...`]);
      await delay(500);
      setCompressionProgress(40);

      if (asset.meshStats) {
        setCompressionLog(prev => [
          ...prev,
          `  -> Compressing 3D geometry mesh (${asset.meshStats?.format})...`,
          `  -> Vertices: ${asset.meshStats?.vertices} | Triangles: ${asset.meshStats?.triangles}`,
        ]);
        await delay(500);
      }
      setCompressionProgress(65);

      for (const tex of asset.textures) {
        setCompressionLog(prev => [...prev, `  -> Packing texture: "${tex.name}" (${tex.resolution})`]);
        await delay(300);
      }
      setCompressionProgress(85);

      const savedSize = formatSize(asset.size * 0.65); // Simulate 35% saving
      setCompressionLog(prev => [
        ...prev,
        `Compression complete. Payload deflated by 35%.`,
        `Saved archive size: ${savedSize} (ZIP container)`,
      ]);
    } else {
      // Unzipping steps
      setCompressionLog(prev => [...prev, `Extracting ZIP container structure...`]);
      await delay(500);
      setCompressionProgress(40);

      setCompressionLog(prev => [...prev, `Inflating asset directory mappings...`]);
      await delay(400);
      setCompressionProgress(70);

      asset.textures.forEach(tex => {
        setCompressionLog(prev => [...prev, `  -> Unpacked layer file: "${tex.name}"`]);
      });
      await delay(400);
      setCompressionProgress(90);

      setCompressionLog(prev => [
        ...prev,
        `Extraction complete! Raw geometry and surface texture maps mounted.`,
        `Disk usage: ${formatSize(asset.size)} (Raw files)`,
      ]);
    }

    setCompressionProgress(100);
    await delay(300);
    onToggleZip(asset.id);
    setCompressing(false);
  };

  const handleRescanAction = async () => {
    if (rescanning) return;
    setRescanning(true);
    setRescanProgress(0);
    setRescanLog([]);

    const logs = [
      `Initializing sector scans...`,
      `Opening scanned path: "${asset.scannedPath}"`,
      `Analyzing folder texture indices & extensions...`,
    ];

    setRescanLog([...logs]);
    await delay(400);
    setRescanProgress(25);

    setRescanLog(prev => [
      ...prev,
      `Inspecting map layers:`,
      `  -> Total layers detected: ${asset.textures.length}`,
    ]);
    await delay(450);
    setRescanProgress(60);

    asset.textures.forEach(tex => {
      setRescanLog(prev => [...prev, `  -> Verified integrity of "${tex.name}" (${tex.type}) - OK`]);
    });
    await delay(450);
    setRescanProgress(85);

    if (asset.meshStats) {
      setRescanLog(prev => [
        ...prev,
        `Verifying geometry file bindings:`,
        `  -> Main Mesh Format: ${asset.meshStats?.format}`,
        `  -> Vertices: ${asset.meshStats?.vertices?.toLocaleString()} | Triangles: ${asset.meshStats?.triangles?.toLocaleString()}`,
        `  -> Geometry mesh file verified without vertex gaps.`
      ]);
      await delay(400);
    }

    // Scan for preview image specifically
    setRescanLog(prev => [
      ...prev,
      `Checking for dedicated "preview" image file...`,
      `  -> Scanning files... Found "preview.png" mapping (1024x1024 px).`,
      `  -> Extracting preview metadata and mounting frame buffer... Success!`,
    ]);
    await delay(500);

    // Preserve the existing thumbnailUrl if available, otherwise use a high-res type-specific fallback
    const scannedPreviewThumb = asset.thumbnailUrl || (
      asset.type === '3d'
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&h=600&q=80'
        : asset.type === 'surface'
        ? 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&h=600&q=80'
        : asset.type === '3dplant'
        ? 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&h=600&q=80'
        : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&h=600&q=80'
    );

    setRescanLog(prev => [
      ...prev,
      `Rescan completed successfully! All assets are fully matched and valid.`,
    ]);
    setRescanProgress(100);
    await delay(400);
    
    // Sync draft state as well
    setDraftThumbnailUrl(scannedPreviewThumb);

    // Save details with updated high-res preview thumbnail
    onSaveAssetDetails(asset.id, {
      name: draftName,
      categories: draftCategories,
      tags: draftTags,
      thumbnailUrl: scannedPreviewThumb,
    });

    setRescanning(false);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Local draft modifications
  const handleCategoryCheckboxChange = (catId: string, checked: boolean) => {
    setDraftCategories(prev => {
      if (checked) {
        return prev.includes(catId) ? prev : [...prev, catId];
      } else {
        return prev.filter(id => id !== catId);
      }
    });
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase();
    if (tag && !draftTags.includes(tag)) {
      setDraftTags(prev => [...prev, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setDraftTags(prev => prev.filter(t => t !== tag));
  };

  const handleToggleFavorite = () => {
    const isCurrentlyFavorite = draftCategories.includes('cat-favorites');
    const newCategories = isCurrentlyFavorite
      ? draftCategories.filter(c => c !== 'cat-favorites')
      : [...draftCategories, 'cat-favorites'];
    
    setDraftCategories(newCategories);
    onSaveAssetDetails(asset.id, {
      name: draftName,
      categories: newCategories,
      tags: draftTags,
      thumbnailUrl: draftThumbnailUrl,
    });
  };

  // Change detection calculations
  const isNameChanged = draftName.trim() !== asset.name;
  
  const isCategoryModified = (catId: string) => {
    const originallyHas = asset.categories.includes(catId);
    const currentlyHas = draftCategories.includes(catId);
    return originallyHas !== currentlyHas;
  };

  const areCategoriesChanged = () => {
    if (draftCategories.length !== asset.categories.length) return true;
    return !draftCategories.every(c => asset.categories.includes(c));
  };

  const areTagsChanged = () => {
    if (draftTags.length !== asset.tags.length) return true;
    return !draftTags.every(t => asset.tags.includes(t));
  };

  const isThumbnailChanged = draftThumbnailUrl !== asset.thumbnailUrl;

  const isAnythingChanged = isNameChanged || areCategoriesChanged() || areTagsChanged() || isThumbnailChanged;

  // Reset local edits
  const handleResetDetails = () => {
    setDraftName(asset.name);
    setDraftCategories(asset.categories);
    setDraftTags(asset.tags);
    setDraftThumbnailUrl(asset.thumbnailUrl);
  };

  // Save edits back to parent
  const handleSaveDetails = () => {
    onSaveAssetDetails(asset.id, {
      name: draftName.trim(),
      categories: draftCategories,
      tags: draftTags,
      thumbnailUrl: draftThumbnailUrl,
    });
  };

  // Drag resizer handler for left edge of this right drawer
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Subtracting deltaX because dragging left increases the panel size
      const newWidth = Math.max(280, Math.min(550, startWidth - deltaX));
      setWidth(newWidth);
      localStorage.setItem('megascan_details_width', String(newWidth));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="border-l border-white/10 bg-[#121212] flex flex-col h-full overflow-hidden select-none relative shrink-0 shadow-2xl"
      style={{ width: `${width}px` }}
      id="asset-details-drawer"
    >
      {/* Resizer Handle */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/50 transition-all z-30"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />

      {/* Drawer Header */}
      <div className="p-4 border-b border-white/10 bg-[#151515] flex items-center justify-between shrink-0" id="details-drawer-header">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <h2 className="font-sans font-bold text-xs uppercase tracking-widest text-white">Asset Information</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(asset.scannedPath);
              notify(`Path copied to clipboard!`);
            }}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copy Asset Path"
            id="copy-path-btn"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Collapse Panel"
            id="close-drawer-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Core Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 pb-24" id="details-drawer-scroll-body">
        {/* Main Preview Thumbnail card */}
        <div 
          onClick={() => {
            setShowExplorerModal(true);
            setCurrentSubFolder(null); // start at root
            setSelectedExplorerFile(null);
          }}
          className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#0F0F0F] shadow-lg shadow-black/30 cursor-pointer group" 
          id="details-thumbnail-frame"
        >
          <img
            src={draftThumbnailUrl || asset.thumbnailUrl}
            alt={draftName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-all duration-300 group-hover:blur-md group-hover:scale-105"
          />
          {/* Change picture overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 z-10 select-none">
            <Camera className="w-6 h-6 text-white drop-shadow-md" />
            <span className="font-sans font-bold text-[11px] text-white uppercase tracking-widest drop-shadow-md">
              Change Picture
            </span>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-1 pointer-events-none" />
          
          <div className="absolute bottom-3.5 left-3.5 right-3.5 z-2 pointer-events-none">
            <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/25 text-[9px] font-bold font-mono uppercase rounded-md tracking-wider">
              {asset.type}
            </span>
            <h3 className="font-sans font-bold text-white text-base mt-1.5 truncate leading-tight flex items-center gap-1.5">
              <span>{draftName}</span>
              {isNameChanged && <span className="text-amber-400 font-extrabold" title="Modified">*</span>}
            </h3>
            <span className="font-mono text-[10px] text-gray-300 font-bold mt-1 block">{formatSize(asset.size)}</span>
          </div>
        </div>

        {/* Resolution selector switcher for grouped assets */}
        {(() => {
          const groupKey = getAssetGroupKey(asset);
          const siblingAssets = allAssets.filter((a) => getAssetGroupKey(a) === groupKey);
          if (siblingAssets.length <= 1) return null;

          return (
            <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5 space-y-2 shadow-inner" id="details-resolutions-selector">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">Scanned Resolutions</span>
                <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-600/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                  {siblingAssets.length} variants
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {siblingAssets.map((sib) => {
                  const isCurrent = sib.id === asset.id;
                  return (
                    <button
                      key={sib.id}
                      onClick={() => onSelectAsset(sib.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        isCurrent
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {sib.resolution.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Name Modification Input Field */}
        <div className="space-y-1.5" id="details-name-section">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1">
            <span>Asset Name</span>
            {isNameChanged && <span className="text-amber-400 text-sm font-extrabold" title="Unsaved changes">*</span>}
          </label>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Asset Display Name"
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans font-semibold placeholder:text-gray-600 transition-colors"
            id="edit-asset-name-input"
          />
        </div>

        {/* Compression Utility Panel (ZIP / UNZIP) */}
        <div className="bg-gradient-to-br from-[#181818] to-[#121212] border border-white/10 rounded-xl p-3.5 space-y-3 shadow-md shadow-black/40" id="details-compression-card">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {asset.isZipped ? (
                <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                  <FileArchive className="w-4 h-4 shrink-0" />
                </div>
              ) : (
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                  <FolderOpen className="w-4 h-4 shrink-0" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block leading-tight truncate">Archive Compression</span>
                <span className={`text-[9px] font-mono mt-0.5 block uppercase tracking-wider ${asset.isZipped ? 'text-amber-400 font-semibold' : 'text-gray-400 font-semibold'}`}>
                  {asset.isZipped ? 'Status: Packed (ZIP)' : 'Status: Extracted'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCompressionAction}
              disabled={compressing || rescanning}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm ${
                asset.isZipped
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-black'
              } disabled:opacity-40`}
              id="compression-toggle-btn"
            >
              {compressing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : asset.isZipped ? (
                <FolderOpen className="w-3.5 h-3.5" />
              ) : (
                <FileArchive className="w-3.5 h-3.5" />
              )}
              <span>{asset.isZipped ? 'Unzip' : 'Zip'}</span>
            </button>
          </div>

          {/* Compression Process Bar & Console Logs */}
          <AnimatePresence>
            {compressing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden border-t border-white/5 pt-2.5"
                id="compression-live-progress"
              >
                {/* Visual Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span>Deflating sectors...</span>
                    <span>{compressionProgress}%</span>
                  </div>
                  <div className="w-full bg-[#0F0F0F] rounded-full h-1 overflow-hidden border border-white/5">
                    <motion.div
                      className={`h-full ${asset.isZipped ? 'bg-blue-500' : 'bg-amber-500'}`}
                      animate={{ width: `${compressionProgress}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                </div>

                {/* Micro console logger */}
                <div className="bg-[#0D0D0D] border border-white/5 rounded p-2.5 max-h-24 overflow-y-auto font-mono text-[9px] text-gray-400 space-y-0.5 scrollbar-thin">
                  {compressionLog.map((log, index) => (
                    <div key={index} className="leading-tight flex items-start gap-1">
                      <span className="text-gray-600 font-bold">&gt;</span>
                      <span className={log.startsWith(' ') ? 'text-gray-500' : 'text-blue-400 font-semibold'}>{log}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions bar under compression card (Rescan + Favorite) */}
        <div className="flex justify-between items-center pr-0.5 -mt-2">
          {/* Favorite Toggle Button */}
          <button
            onClick={handleToggleFavorite}
            disabled={rescanning || compressing}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm border ${
              draftCategories.includes('cat-favorites')
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            } disabled:opacity-40 cursor-pointer`}
            id="favorite-toggle-btn"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                draftCategories.includes('cat-favorites') ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              }`}
            />
            <span>{draftCategories.includes('cat-favorites') ? 'Favorited' : 'Favorite'}</span>
          </button>

          {/* Rescan Button */}
          <button
            onClick={handleRescanAction}
            disabled={rescanning || compressing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 cursor-pointer"
            id="rescan-directory-btn"
          >
            {rescanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Rescan Path</span>
          </button>
        </div>

        {/* Rescan Progress bar & Console log terminal */}
        <AnimatePresence>
          {rescanning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#181818] border border-white/10 rounded-xl p-3.5 space-y-2 overflow-hidden shadow-inner"
              id="rescan-live-progress"
            >
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-gray-400">
                  <span>Re-scanning local files...</span>
                  <span>{rescanProgress}%</span>
                </div>
                <div className="w-full bg-[#0F0F0F] rounded-full h-1 overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: `${rescanProgress}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
              </div>

              <div className="bg-[#0D0D0D] border border-white/5 rounded p-2.5 max-h-24 overflow-y-auto font-mono text-[9px] text-gray-400 space-y-0.5 scrollbar-thin">
                {rescanLog.map((log, index) => (
                  <div key={index} className="leading-tight flex items-start gap-1">
                    <span className="text-gray-600 font-bold">&gt;</span>
                    <span className={log.startsWith(' ') ? 'text-gray-500' : 'text-blue-400 font-semibold'}>{log}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Association Organizer */}
        <div className="space-y-3.5 border-t border-white/10 pt-4" id="details-categories-section">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-400" />
              <span>Category Placement</span>
            </span>
            {areCategoriesChanged() && (
              <span className="text-amber-400 text-sm font-extrabold animate-pulse" title="Category selection modified">*</span>
            )}
          </h4>
          <p className="text-[11px] text-gray-400">Manage category directories linked with this asset:</p>
          <button
            onClick={() => setShowMoveCategoryModal(true)}
            className="w-full py-2.5 px-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 rounded-xl text-xs font-bold text-gray-200 transition-all flex items-center justify-center gap-2"
            id="open-move-category-modal-btn"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Move Category...</span>
          </button>
        </div>

        {/* Technical Specification Parameters */}
        <div className="space-y-3.5 border-t border-white/10 pt-4" id="details-specifications-section">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-400" />
            <span>Technical Parameters</span>
          </h4>

          <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs font-mono text-gray-300 shadow-inner" id="specs-key-values">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 font-medium">Asset Type</span>
              <span className="text-white font-bold capitalize">{asset.type}</span>
            </div>
            
            {asset.type === '2d' ? (
              <>
                {asset.width && asset.height && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 font-medium">Resolution</span>
                    <span className="text-white font-bold">{asset.width} × {asset.height} px</span>
                  </div>
                )}
                {asset.orientation && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 font-medium">Orientation</span>
                    <span className="text-blue-400 font-bold capitalize">{asset.orientation}</span>
                  </div>
                )}
                {asset.aspectRatio && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 font-medium">Aspect Ratio</span>
                    <span className="text-white font-bold">{asset.aspectRatio}</span>
                  </div>
                )}
                {asset.colors && asset.colors.length > 0 && (
                  <div className="py-1.5 border-b border-white/5">
                    <span className="text-gray-400 font-medium block mb-1.5">Dominant Colors (Click to Copy)</span>
                    <div className="flex flex-wrap gap-1.5 mt-1 bg-black/35 p-1.5 rounded-lg border border-white/5">
                      {asset.colors.map((colorHex) => (
                        <button
                          key={colorHex}
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(colorHex);
                            notify(`Hex code ${colorHex} copied to clipboard!`);
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
              </>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400 font-medium">Max Res</span>
                  <span className="text-white font-bold uppercase">{asset.resolution} Maps</span>
                </div>
                {asset.meshStats && (
                  <>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Mesh Format</span>
                      <span className="text-blue-400 font-extrabold">{asset.meshStats.format}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Polygons</span>
                      <span className="text-white font-bold">{asset.meshStats.triangles.toLocaleString()} tris</span>
                    </div>
                  </>
                )}
                {asset.dimensions && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 font-medium">Dimensions</span>
                    <span className="text-white font-bold">
                      {asset.dimensions.length || '?'}&nbsp;L × {asset.dimensions.width || '?'}&nbsp;W × {asset.dimensions.height || '?'}&nbsp;H
                    </span>
                  </div>
                )}
              </>
            )}

            {asset.packName && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400 font-medium">Megascan Pack</span>
                <span className="text-amber-400 font-bold text-right truncate max-w-[170px]" title={asset.packName}>
                  {asset.packName}
                </span>
              </div>
            )}
            {asset.country && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400 font-medium">Origin</span>
                <span className="text-white font-bold">
                  {asset.country}{asset.region ? `, ${asset.region}` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 font-medium">Registered</span>
              <span className="text-white font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {new Date(asset.dateAdded).toLocaleDateString()}
              </span>
            </div>
            <div className="pt-1.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Source Path</span>
                <button
                  onClick={() => {
                    setRelocatedPath(asset.scannedPath);
                    setShowMovePathModal(true);
                  }}
                  className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/25 text-blue-400 rounded text-[9px] font-bold font-mono tracking-wide transition-colors cursor-pointer"
                  id="open-move-path-modal-btn"
                >
                  Move drive...
                </button>
              </div>
              <div
                onClick={() => setShowExplorerModal(true)}
                className="group/path cursor-pointer text-[10px] text-blue-400 hover:text-blue-300 break-all leading-normal font-mono font-medium block bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-500/30 rounded p-2 transition-all flex items-start gap-2 shadow-inner"
                id="source-path-clickable-box"
                title="Click to open Virtual File Explorer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-400 group-hover/path:scale-110 shrink-0 transition-transform mt-0.5" />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="block truncate font-bold">{asset.scannedPath}</span>
                  <span className="text-[9px] text-gray-500 font-bold tracking-wider uppercase group-hover/path:text-blue-400/80 transition-colors flex items-center gap-1">
                    <ExternalLink className="w-2.5 h-2.5" />
                    Explore local files & directories
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Textures Table */}
        <div className="space-y-3.5 border-t border-white/10 pt-4" id="details-textures-section">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Map Layers ({asset.textures.length})</span>
          </h4>
          <div className="border border-white/10 rounded-xl overflow-hidden bg-[#141414]" id="textures-table-container">
            <table className="w-full text-left font-mono text-[10px] text-gray-300 border-collapse">
              <thead>
                <tr className="bg-[#181818] border-b border-white/10">
                  <th className="p-2 font-bold text-white">Name</th>
                  <th className="p-2 font-bold text-white">Type</th>
                  <th className="p-2 font-bold text-white text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/10">
                {asset.textures.map((tex, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="p-2 max-w-[120px] truncate text-white font-medium" title={tex.name}>{tex.name}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400 text-[8px] font-bold">
                        {tex.type}
                      </span>
                    </td>
                    <td className="p-2 text-right font-semibold text-gray-300">{tex.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tag Organizer */}
        <div className="space-y-3 border-t border-white/10 pt-4" id="details-tags-section">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              <span>Metadata Tags</span>
            </span>
            {areTagsChanged() && (
              <span className="text-amber-400 text-sm font-extrabold animate-pulse" title="Tags list modified">*</span>
            )}
          </h4>
          <form onSubmit={handleAddTagSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
              id="add-tag-input"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold shrink-0 transition-colors"
              id="add-tag-submit-btn"
            >
              Add
            </button>
          </form>
          <div className="flex flex-wrap gap-1" id="tags-pills-wrap">
            {draftTags.map((tag) => {
              const isNew = !asset.tags.includes(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors ${
                    isNew
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                      : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span>#{tag}</span>
                  {isNew && <span className="text-amber-400 text-[9px] font-bold" title="Unsaved added tag">*</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-rose-400 transition-colors font-extrabold pl-0.5"
                    title="Remove tag"
                    id={`remove-tag-btn-${tag}`}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Moodboards Association Organizer */}
        <div className="space-y-3.5 border-t border-white/10 pt-4" id="details-moodboards-section">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Moodboards</span>
            </span>
          </h4>
          <p className="text-[11px] text-gray-400">Add or remove this asset from your virtual moodboard collections:</p>
          
          <div className="space-y-1.5 bg-[#141414] border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
            {moodboards.length === 0 ? (
              <span className="text-[10px] text-gray-500 italic block py-1">No moodboards created yet. Create one below!</span>
            ) : (
              moodboards.map((mb) => {
                const isAssigned = (asset.moodboards || []).includes(mb);
                return (
                  <label key={mb} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => {
                        if (!onUpdateAssetMoodboards) return;
                        const nextMbs = isAssigned
                          ? (asset.moodboards || []).filter(item => item !== mb)
                          : [...(asset.moodboards || []), mb];
                        onUpdateAssetMoodboards(asset.id, nextMbs);
                      }}
                      className="rounded border-white/15 bg-black/40 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-sans font-medium truncate">{mb}</span>
                  </label>
                );
              })
            )}
          </div>

          {onUpdateAssetMoodboards && (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="New moodboard..."
                id="create-details-moodboard-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      const nextMbs = [...(asset.moodboards || []), val];
                      onUpdateAssetMoodboards(asset.id, nextMbs);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                className="flex-1 bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = document.getElementById('create-details-moodboard-input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const val = input.value.trim();
                    const nextMbs = [...(asset.moodboards || []), val];
                    onUpdateAssetMoodboards(asset.id, nextMbs);
                    input.value = '';
                  }
                }}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/25 text-blue-400 rounded-lg text-xs font-bold shrink-0 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Destructive Actions block */}
        <div className="space-y-3.5 border-t border-white/10 pt-4" id="details-destructive-section">
          <h4 className="text-xs font-bold uppercase tracking-widest text-rose-500 font-mono flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Library Management</span>
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10"
              id="details-delete-asset-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Drive</span>
            </button>
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="flex-1 py-2 px-3 bg-[#222] hover:bg-[#2A2A2A] text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              id="details-remove-manager-btn"
            >
              <FolderMinus className="w-3.5 h-3.5" />
              <span>Remove Manager</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Action Footer that slides in when changes are detected */}
      <AnimatePresence>
        {isAnythingChanged && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#161616] flex items-center gap-2.5 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
            id="details-save-actions-footer"
          >
            <button
              onClick={handleResetDetails}
              className="flex-1 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors"
              id="reset-details-btn"
            >
              Reset
            </button>
            <button
              onClick={handleSaveDetails}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
              id="save-details-btn"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------------- */}
      {/* Dynamic Modals / Dialog backdrops */}
      {/* ----------------------------------------------------------------------- */}
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md" id="delete-confirm-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-rose-500/30 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl"
              id="delete-confirm-modal"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-2 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-sm text-white">Permanently Delete Asset?</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Are you sure you want to permanently delete <strong className="text-white">"{asset.name}"</strong>? This will delete the asset files on your local drive and they won't be able to be recovered.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-colors border border-white/5"
                  id="cancel-delete-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteAsset(asset.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20"
                  id="confirm-delete-btn"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove from Manager Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md" id="remove-confirm-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-amber-500/30 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl"
              id="remove-confirm-modal"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <div className="p-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                  <FolderMinus className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-sm text-white">Remove Asset from Manager?</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Remove <strong className="text-white">"{asset.name}"</strong> from this organizer? The application will flag this scanned path and will not import it back during rescans. Your actual drive files will <strong className="text-emerald-400 font-extrabold uppercase">not</strong> be deleted.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-colors border border-white/5"
                  id="cancel-remove-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRemoveFromManager(asset.id);
                    setShowRemoveConfirm(false);
                  }}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl transition-colors"
                  id="confirm-remove-btn"
                >
                  Remove from Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move Category Choice Dialog */}
      <AnimatePresence>
        {showMoveCategoryModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md" id="move-category-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-white/10 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl"
              id="move-category-modal"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-blue-400" />
                  <h3 className="font-sans font-bold text-sm text-white">Select Categories</h3>
                </div>
                <button
                  onClick={() => setShowMoveCategoryModal(false)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Choose custom directories where this asset will appear:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {categories
                  .filter((c) => c.id !== 'cat-all')
                  .map((cat) => {
                    const renderSubcategory = (sub: any, depth = 0) => {
                      const isAssociated = draftCategories.includes(sub.id);
                      return (
                        <div key={sub.id} style={{ paddingLeft: `${depth * 16}px` }}>
                          <label className="flex items-center justify-between text-xs text-gray-200 hover:text-white cursor-pointer select-none py-1.5 px-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isAssociated}
                                onChange={(e) => handleCategoryCheckboxChange(sub.id, e.target.checked)}
                                className="rounded border-white/10 bg-[#0F0F0F] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="font-semibold">{sub.name}</span>
                            </div>
                          </label>
                          {sub.subcategories && sub.subcategories.map((child: any) => renderSubcategory(child, depth + 1))}
                        </div>
                      );
                    };

                    return (
                      <div key={cat.id}>
                        <label className="flex items-center justify-between text-xs text-gray-200 hover:text-white cursor-pointer select-none py-1.5 px-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={draftCategories.includes(cat.id)}
                              onChange={(e) => handleCategoryCheckboxChange(cat.id, e.target.checked)}
                              className="rounded border-white/10 bg-[#0F0F0F] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-semibold">{cat.name}</span>
                          </div>
                          {isCategoryModified(cat.id) && (
                            <span className="text-amber-400 text-xs font-bold animate-pulse" title="Modified">*</span>
                          )}
                        </label>
                        {cat.subcategories && cat.subcategories.map((sub: any) => renderSubcategory(sub, 1))}
                      </div>
                    );
                  })}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowMoveCategoryModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/10"
                  id="done-move-category-btn"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move Drive Path Relocate Dialog */}
      <AnimatePresence>
        {showMovePathModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md" id="move-path-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-white/10 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl"
              id="move-path-modal"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <h3 className="font-sans font-bold text-sm text-white">Relocate Asset on Drive</h3>
                </div>
                <button
                  onClick={() => {
                    if (!isRelocating) setShowMovePathModal(false);
                  }}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
                  disabled={isRelocating}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs text-gray-300">
                <p>Move the high-resolution texture maps and LOD model files to a different directory on your computer storage.</p>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Current Drive Path</label>
                  <div className="bg-black/30 border border-white/5 rounded px-2.5 py-1.5 font-mono text-[10px] text-gray-500 truncate select-all">
                    {asset.scannedPath}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Target Destination Directory</label>
                  <input
                    type="text"
                    value={relocatedPath}
                    onChange={(e) => setRelocatedPath(e.target.value)}
                    disabled={isRelocating}
                    placeholder="E.g. D:/megascan_library/rock_formations/"
                    className="w-full bg-[#141414] border border-white/10 focus:border-blue-500 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white placeholder:text-gray-600 outline-none"
                  />
                </div>
              </div>

              {/* simulated move transfer console block */}
              <AnimatePresence>
                {isRelocating && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 pt-2 border-t border-white/5"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                      <span>Transferring files...</span>
                      <span>{relocationProgress}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden border border-white/5">
                      <div className="bg-blue-500 h-full transition-all duration-150" style={{ width: `${relocationProgress}%` }} />
                    </div>
                    <div className="bg-black/50 border border-white/5 rounded p-2 max-h-24 overflow-y-auto font-mono text-[9px] text-gray-400 space-y-0.5 scrollbar-thin">
                      {relocationLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-1">
                          <span className="text-gray-600 font-bold">&gt;</span>
                          <span className="text-blue-400">{log}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  disabled={isRelocating}
                  onClick={() => setShowMovePathModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  disabled={isRelocating || !relocatedPath.trim() || relocatedPath === asset.scannedPath}
                  onClick={async () => {
                    if (isRelocating) return;
                    setIsRelocating(true);
                    setRelocationProgress(0);
                    setRelocationLogs([
                      `Preparing relocation sector...`,
                      `Moving map layers for "${asset.name}"`,
                      `Writing destination sector at "${relocatedPath}"`,
                    ]);
                    await delay(350);
                    setRelocationProgress(30);
                    setRelocationLogs(prev => [...prev, `Found verified 3D assets & textures`]);
                    await delay(450);
                    setRelocationProgress(65);
                    setRelocationLogs(prev => [...prev, `Moved diffuse, normal, roughness textures`]);
                    await delay(400);
                    setRelocationProgress(100);
                    setRelocationLogs(prev => [...prev, `Completed transfer. Updating library linkage`]);
                    await delay(300);
                    onMoveAssetPath(asset.id, relocatedPath);
                    setIsRelocating(false);
                    setShowMovePathModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/10 disabled:opacity-40"
                >
                  Begin Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Virtual File Explorer Modal */}
        {showExplorerModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md" id="virtual-explorer-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f10] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[550px] font-mono text-xs text-gray-300"
              id="virtual-explorer-window"
            >
              {/* Explorer Titlebar */}
              <div className="bg-[#141416] border-b border-white/5 px-4 py-3 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 block" />
                  </div>
                  <span className="text-gray-400 font-bold ml-2 text-[11px] uppercase tracking-wider">Storage Explorer</span>
                </div>
                <div className="text-gray-500 font-medium text-[11px] truncate max-w-md">
                  {asset.scannedPath}
                </div>
                <button
                  onClick={() => setShowExplorerModal(false)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explorer Path Navigation Bar */}
              <div className="bg-[#18181b] border-b border-white/5 px-3 py-2 flex items-center gap-3 select-none">
                <button
                  disabled={currentSubFolder === null}
                  onClick={() => {
                    setCurrentSubFolder(null);
                    setSelectedExplorerFile(null);
                  }}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  title="Go to parent directory"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>

                {/* Path display */}
                <div className="flex-1 flex items-center bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5">
                  <span className="hover:text-white cursor-pointer transition-colors" onClick={() => { setCurrentSubFolder(null); setSelectedExplorerFile(null); }}>Computer</span>
                  <span>/</span>
                  <span className="hover:text-white cursor-pointer transition-colors" onClick={() => { setCurrentSubFolder(null); setSelectedExplorerFile(null); }}>Scanned Assets</span>
                  <span>/</span>
                  <span className="text-blue-400 font-bold">{asset.name}</span>
                  {currentSubFolder && (
                    <>
                      <span>/</span>
                      <span className="text-white font-bold">{currentSubFolder}</span>
                    </>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative w-48 shrink-0">
                  <input
                    type="text"
                    placeholder="Search folder..."
                    value={explorerSearch}
                    onChange={(e) => setExplorerSearch(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-7 pr-2.5 py-1 text-[10px] text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-2" />
                </div>
              </div>

              {/* Split Panel Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Folder places */}
                <div className="w-48 bg-[#121213] border-r border-white/5 flex flex-col justify-between p-3 select-none shrink-0">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block px-1">Quick Access</span>
                      <div className="space-y-0.5">
                        <button className="w-full text-left px-2 py-1.5 rounded-lg text-gray-400 text-[10px] flex items-center gap-1.5 hover:bg-white/5 transition-colors">
                          <Star className="w-3 h-3 text-yellow-400/80 shrink-0" />
                          <span>Recent Scans</span>
                        </button>
                        <button className="w-full text-left px-2 py-1.5 rounded-lg text-gray-400 text-[10px] flex items-center gap-1.5 hover:bg-white/5 transition-colors">
                          <Folder className="w-3 h-3 text-blue-400/80 shrink-0" />
                          <span>Downloads</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block px-1">This Computer</span>
                      <div className="space-y-0.5">
                        <button className="w-full text-left px-2 py-1.5 rounded-lg text-gray-400 text-[10px] flex items-center gap-1.5 hover:bg-white/5 transition-colors">
                          <Box className="w-3 h-3 text-teal-400/80 shrink-0" />
                          <span>Local Disk (C:)</span>
                        </button>
                        <button className="w-full text-left px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-[10px] flex items-center gap-1.5 transition-colors">
                          <FolderOpen className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate">Active Asset</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* System statistics badge */}
                  <div className="bg-black/30 border border-white/5 rounded-lg p-2 space-y-1 text-[9px] text-gray-500">
                    <div className="flex justify-between">
                      <span>Drive Health</span>
                      <span className="text-emerald-400 font-bold">100% OK</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full" />
                    </div>
                  </div>
                </div>

                {/* Main Explorer Content Pane */}
                <div className="flex-1 bg-[#09090a] flex flex-col overflow-hidden">
                  {/* Action Bar / Info strip */}
                  <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex justify-between items-center select-none shrink-0 text-[10px]">
                    <span className="text-gray-500 font-bold">
                      {displayedFiles.length} items found {currentSubFolder ? `in /${currentSubFolder}` : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExplorerViewMode('grid')}
                        className={`p-1 rounded ${explorerViewMode === 'grid' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setExplorerViewMode('list')}
                        className={`p-1 rounded ${explorerViewMode === 'list' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Files container */}
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    {displayedFiles.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-gray-600 select-none">
                        <FolderOpen className="w-8 h-8 text-gray-700 stroke-[1.5]" />
                        <div>
                          <p className="font-bold text-xs text-gray-500">No matching items</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">This folder is empty or files are filtered out.</p>
                        </div>
                      </div>
                    ) : explorerViewMode === 'grid' ? (
                      /* GRID VIEW */
                      <div className="grid grid-cols-4 gap-3">
                        {displayedFiles.map((file) => {
                          const isSelected = selectedExplorerFile?.name === file.name;
                          return (
                            <div
                              key={file.name}
                              onClick={() => setSelectedExplorerFile(file)}
                              onDoubleClick={() => {
                                if (file.type === 'folder') {
                                  setCurrentSubFolder(file.name);
                                  setSelectedExplorerFile(null);
                                }
                              }}
                              className={`p-2.5 rounded-xl border flex flex-col items-center text-center select-none cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-500/10 border-blue-500/40 text-white shadow-lg shadow-blue-500/5'
                                  : 'bg-black/25 hover:bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              <div className="w-10 h-10 flex items-center justify-center mb-1.5">
                                {file.type === 'folder' ? (
                                  <Folder className="w-8 h-8 text-amber-500 fill-amber-500/10" />
                                ) : file.type === 'json' ? (
                                  <FileText className="w-7 h-7 text-emerald-400" />
                                ) : file.type === 'mesh' ? (
                                  <Box className="w-7 h-7 text-teal-400" />
                                ) : (
                                  /* Image Preview inside explorer */
                                  <div className="w-8 h-8 rounded border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center relative shadow-sm">
                                    <img
                                      src={file.url}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-transparent" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-medium leading-tight break-all line-clamp-2 max-w-full" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[8px] text-gray-500 font-bold mt-1 uppercase tracking-wider">{file.size}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* LIST VIEW */
                      <div className="space-y-1">
                        {displayedFiles.map((file) => {
                          const isSelected = selectedExplorerFile?.name === file.name;
                          return (
                            <div
                              key={file.name}
                              onClick={() => setSelectedExplorerFile(file)}
                              onDoubleClick={() => {
                                if (file.type === 'folder') {
                                  setCurrentSubFolder(file.name);
                                  setSelectedExplorerFile(null);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg border flex items-center justify-between select-none cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-500/10 border-blue-500/30 text-white'
                                  : 'bg-black/10 hover:bg-white/5 border-transparent text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {file.type === 'folder' ? (
                                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                ) : file.type === 'json' ? (
                                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : file.type === 'mesh' ? (
                                  <Box className="w-4 h-4 text-teal-400 shrink-0" />
                                ) : (
                                  <File className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <span className="text-[10px] font-medium truncate" title={file.name}>{file.name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-gray-500 text-[9px] font-bold">
                                <span>{file.type.toUpperCase()} FILE</span>
                                <span className="w-16 text-right">{file.size}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Preview Pane (Shows selected file details!) */}
                <div className="w-64 bg-[#0d0d0e] border-l border-white/5 flex flex-col overflow-y-auto p-4 select-none shrink-0">
                  {selectedExplorerFile ? (
                    <div className="space-y-4">
                      <div className="border-b border-white/5 pb-3">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Selected Item</span>
                        <h5 className="text-[11px] font-bold text-white break-all leading-normal mt-1">{selectedExplorerFile.name}</h5>
                        <span className="text-[9px] text-blue-400 font-bold block mt-1 uppercase tracking-wider">{selectedExplorerFile.type} FILE ({selectedExplorerFile.size})</span>
                      </div>

                      {/* Folder specifics */}
                      {selectedExplorerFile.type === 'folder' && (
                        <div className="space-y-2 text-[10px]">
                          <p className="text-gray-400 leading-normal">This is a system folder containing the Megascan's internal payload assets.</p>
                          <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-500">File Count</span>
                              <span className="text-white font-bold">{selectedExplorerFile.itemsCount} Files</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Directory</span>
                              <span className="text-amber-500 font-bold">Local Storage</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentSubFolder(selectedExplorerFile.name);
                              setSelectedExplorerFile(null);
                            }}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center mt-2"
                          >
                            Open Directory
                          </button>
                        </div>
                      )}

                      {/* Image Preview specifics */}
                      {selectedExplorerFile.type === 'image' && (
                        <div className="space-y-3">
                          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center relative shadow-inner">
                            <img
                              src={selectedExplorerFile.url}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {selectedExplorerFile.resolution && (
                            <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 text-[10px] space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Dimension</span>
                                <span className="text-white font-bold">{selectedExplorerFile.resolution} Resolution</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Format</span>
                                <span className="text-blue-400 font-extrabold">{selectedExplorerFile.name.split('.').pop()?.toUpperCase()}</span>
                              </div>
                              {selectedExplorerFile.textureType && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Map Layer</span>
                                  <span className="text-purple-400 font-bold">{selectedExplorerFile.textureType}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setDraftThumbnailUrl(selectedExplorerFile.url);
                              setShowExplorerModal(false);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                          >
                            <Check className="w-4 h-4" />
                            <span>Set as Asset Picture</span>
                          </button>
                        </div>
                      )}

                      {/* Mesh Details */}
                      {selectedExplorerFile.type === 'mesh' && (
                        <div className="space-y-2 text-[10px]">
                          <p className="text-gray-400 leading-normal">Level of Detail (LOD) geometry mesh payload.</p>
                          <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Polygons</span>
                              <span className="text-white font-bold">{selectedExplorerFile.triangles?.toLocaleString()} tris</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Vertices</span>
                              <span className="text-white font-bold">{selectedExplorerFile.vertices?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Extension</span>
                              <span className="text-teal-400 font-extrabold">{selectedExplorerFile.name.split('.').pop()?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* JSON Schema Reader */}
                      {selectedExplorerFile.type === 'json' && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Metadata schema</span>
                          <div className="bg-black/50 border border-white/5 rounded-lg p-2 text-[8px] text-amber-300 max-h-[170px] overflow-y-auto whitespace-pre font-mono scrollbar-thin">
                            {JSON.stringify(selectedExplorerFile.content, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-2 text-gray-600 select-none">
                      <File className="w-8 h-8 text-gray-700 stroke-[1.5] mb-2" />
                      <p className="font-bold text-[10px] text-gray-500">Select a file</p>
                      <p className="text-[9px] text-gray-600 mt-0.5">Click any folder or item to view its metadata properties.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
