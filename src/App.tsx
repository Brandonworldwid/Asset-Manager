import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderSync, 
  Sparkles, 
  HelpCircle, 
  FolderArchive, 
  Plus, 
  Search, 
  Layers, 
  Box, 
  Info,
  Check,
  CheckCircle,
  TrendingUp,
  SlidersHorizontal,
  X,
  Compass,
  ArrowRight,
  Trash2,
  FolderX,
  Star,
  FileArchive,
  FolderOpen,
  Settings
} from 'lucide-react';

import { Asset, Category } from './types';
import { DEFAULT_CATEGORIES, INITIAL_ASSETS } from './data/mockAssets';
import Sidebar from './components/Sidebar';
import DirectoryScanner from './components/DirectoryScanner';
import AssetGrid from './components/AssetGrid';
import AssetDetails from './components/AssetDetails';

export default function App() {
  // ---------------------------------------------------------------------------
  // State Initialization
  // ---------------------------------------------------------------------------
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('megascan_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('megascan_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [evictedAssetPaths, setEvictedAssetPaths] = useState<string[]>(() => {
    const saved = localStorage.getItem('megascan_evicted_paths');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Settings state
  const [homePageColumns, setHomePageColumns] = useState<number>(() => {
    const saved = localStorage.getItem('megascan_home_page_columns');
    return saved ? parseInt(saved, 10) : 4;
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [draftHomePageColumns, setDraftHomePageColumns] = useState<number>(4);
  const [isSettingsVibrating, setIsSettingsVibrating] = useState<boolean>(false);
  const [forceSaveButtonRed, setForceSaveButtonRed] = useState<boolean>(false);

  // Batch action states & confirmation
  const [showBatchEditModal, setShowBatchEditModal] = useState<boolean>(false);
  const [batchZipPopupAction, setBatchZipPopupAction] = useState<'zip' | 'unzip' | null>(null);
  const [batchConfirmAction, setBatchConfirmAction] = useState<'delete' | 'remove' | null>(null);
  
  // Sync draft settings when settings modal is opened
  useEffect(() => {
    if (showSettingsModal) {
      setDraftHomePageColumns(homePageColumns);
      setIsSettingsVibrating(false);
      setForceSaveButtonRed(false);
    }
  }, [showSettingsModal, homePageColumns]);

  // Save homePageColumns to localStorage
  useEffect(() => {
    localStorage.setItem('megascan_home_page_columns', homePageColumns.toString());
  }, [homePageColumns]);
  
  // Batch rescan state
  const [isBatchScanning, setIsBatchScanning] = useState<boolean>(false);
  const [batchScanProgress, setBatchScanProgress] = useState<number>(0);
  const [batchScanLog, setBatchScanLog] = useState<string[]>([]);

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem('megascan_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('megascan_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('megascan_evicted_paths', JSON.stringify(evictedAssetPaths));
  }, [evictedAssetPaths]);

  // Trigger transient toast notification
  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // Category Management Handlers
  // ---------------------------------------------------------------------------
  const handleCreateCategory = (name: string) => {
    const newCat: Category = {
      id: `cat-custom-${Math.random().toString(36).substring(2, 9)}`,
      name,
    };
    setCategories((prev) => [...prev, newCat]);
    notify(`Created category "${name}"`);
  };

  const handleRenameCategory = (id: string, newName: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
    notify(`Renamed category to "${newName}"`);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // Remove category association from assets
    setAssets((prev) =>
      prev.map((asset) => ({
        ...asset,
        categories: asset.categories.filter((catId) => catId !== id),
      }))
    );
    if (activeCategoryId === id) {
      setActiveCategoryId('cat-all');
    }
    notify('Category removed');
  };

  const handleReorderCategory = (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return;

    const newCategories = [...categories];
    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;

    // Prevent swapping with default protected categories (first 6 items)
    if (swapWithIndex < 6 || swapWithIndex >= categories.length) return;

    // Swap items
    const temp = newCategories[index];
    newCategories[index] = newCategories[swapWithIndex];
    newCategories[swapWithIndex] = temp;

    setCategories(newCategories);
  };

  // ---------------------------------------------------------------------------
  // Asset Modification Handlers
  // ---------------------------------------------------------------------------
  const handleImportAssets = (newAssets: Asset[]) => {
    setAssets((prev) => {
      // Avoid importing duplicates
      const filteredNew = newAssets.filter(
        (na) => !prev.some((la) => la.id === na.id)
      );
      return [...prev, ...filteredNew];
    });

    notify(`Successfully indexed ${newAssets.length} Megascan assets!`);
    
    // Automatically select the first imported asset to showcase the details drawer
    if (newAssets.length > 0) {
      setSelectedAssetId(newAssets[0].id);
    }
  };

  const handleToggleZip = (id: string) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id === id) {
          const updatedZip = !asset.isZipped;
          notify(updatedZip ? `Zipped asset payload` : `Unzipped asset payload`);
          return { ...asset, isZipped: updatedZip };
        }
        return asset;
      })
    );
  };

  const handleUpdateAssetCategories = (id: string, categoryIds: string[]) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, categories: categoryIds } : asset))
    );
  };

  const handleAddTag = (id: string, tag: string) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id === id && !asset.tags.includes(tag)) {
          return { ...asset, tags: [...asset.tags, tag] };
        }
        return asset;
      })
    );
  };

  const handleRemoveTag = (id: string, tag: string) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id === id) {
          return { ...asset, tags: asset.tags.filter((t) => t !== tag) };
        }
        return asset;
      })
    );
  };

  const handleSaveAssetDetails = (id: string, updatedFields: { name: string; categories: string[]; tags: string[]; thumbnailUrl?: string }) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, ...updatedFields } : asset))
    );
    notify(`Saved updated details for "${updatedFields.name}"`);
  };

  const handleToggleFavorite = (id: string) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id === id) {
          const originallyFav = asset.categories.includes('cat-favorites');
          const updatedCategories = originallyFav
            ? asset.categories.filter((c) => c !== 'cat-favorites')
            : [...asset.categories, 'cat-favorites'];
          notify(originallyFav ? `Removed from Favorites` : `Added to Favorites`);
          return { ...asset, categories: updatedCategories };
        }
        return asset;
      })
    );
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    setSelectedAssetId(null);
    notify("Asset deleted from library and local drive.");
  };

  const handleRemoveFromManager = (id: string) => {
    const assetToRemove = assets.find((a) => a.id === id);
    if (assetToRemove) {
      setEvictedAssetPaths((prev) => {
        if (!prev.includes(assetToRemove.scannedPath)) {
          return [...prev, assetToRemove.scannedPath];
        }
        return prev;
      });
    }
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    setSelectedAssetId(null);
    notify("Asset removed from manager and flagged from re-import.");
  };

  const handleMoveAssetPath = (id: string, newPath: string) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, scannedPath: newPath } : asset))
    );
    notify(`Moved drive location to "${newPath}"`);
  };

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    setSelectedAssetIds([]);
    setSelectedAssetId(null);
  };

  const handleToggleSelectAsset = (id: string, isCtrl: boolean) => {
    if (isCtrl) {
      setSelectedAssetIds((prev) => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
        
        // When holding Ctrl, do not show the detail panel at all
        setSelectedAssetId(null);
        return next;
      });
    } else {
      setSelectedAssetIds([id]);
      setSelectedAssetId(id);
    }
  };

  const handleBatchDelete = () => {
    setAssets((prev) => prev.filter((a) => !selectedAssetIds.includes(a.id)));
    notify(`Deleted ${selectedAssetIds.length} assets from library and local drive.`);
    setSelectedAssetIds([]);
    setSelectedAssetId(null);
    setShowBatchEditModal(false);
  };

  const handleBatchRemoveFromManager = () => {
    const toRemove = assets.filter((a) => selectedAssetIds.includes(a.id));
    setEvictedAssetPaths((prev) => {
      const next = [...prev];
      toRemove.forEach((a) => {
        if (!next.includes(a.scannedPath)) {
          next.push(a.scannedPath);
        }
      });
      return next;
    });
    setAssets((prev) => prev.filter((a) => !selectedAssetIds.includes(a.id)));
    notify(`Removed ${toRemove.length} assets from manager & excluded from future scans.`);
    setSelectedAssetIds([]);
    setSelectedAssetId(null);
    setShowBatchEditModal(false);
  };

  const handleBatchFavorite = () => {
    const selectedList = assets.filter((a) => selectedAssetIds.includes(a.id));
    const hasUnfavorited = selectedList.some((a) => !a.categories.includes('cat-favorites'));
    
    setAssets((prev) =>
      prev.map((asset) => {
        if (selectedAssetIds.includes(asset.id)) {
          if (hasUnfavorited) {
            if (!asset.categories.includes('cat-favorites')) {
              return { ...asset, categories: [...asset.categories, 'cat-favorites'] };
            }
          } else {
            return { ...asset, categories: asset.categories.filter((c) => c !== 'cat-favorites') };
          }
        }
        return asset;
      })
    );
    notify(hasUnfavorited ? `Added ${selectedAssetIds.length} assets to Favorites` : `Removed ${selectedAssetIds.length} assets from Favorites`);
  };

  const handleBatchMoveCategory = (categoryId: string) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (selectedAssetIds.includes(asset.id)) {
          const hasFavorite = asset.categories.includes('cat-favorites');
          return {
            ...asset,
            categories: hasFavorite ? [categoryId, 'cat-favorites'] : [categoryId],
          };
        }
        return asset;
      })
    );
    const targetCatName = categories.find((c) => c.id === categoryId)?.name || 'New Category';
    notify(`Moved ${selectedAssetIds.length} assets to category "${targetCatName}"`);
  };

  const handleBatchRescan = () => {
    if (isBatchScanning) return;
    setIsBatchScanning(true);
    setBatchScanProgress(0);
    setBatchScanLog([]);
    
    const toScan = assets.filter((a) => selectedAssetIds.includes(a.id));
    let currentStep = 0;
    const logsList = [
      `[INIT] Launching batch storage integrity scanner...`,
      `[INFO] Target: ${toScan.length} scanned assets payload files`,
      `[DISK] Opening system directory sockets...`,
      ...toScan.flatMap((a) => [
        `[SCAN] Auditing directory: ${a.scannedPath}`,
        `[DATA] Checking metadata descriptor: ${a.id}.json`,
        `[GEOM] Re-calculating LOD meshes topology integrity...`,
        `[TEX] Mapping texture files resolving resolution overlays...`,
        `[OK] Asset "${a.name}" verification succeeded!`
      ]),
      `[DONE] Integrity check complete. 0 lost chunks, 0 corrupt textures.`
    ];

    const interval = setInterval(() => {
      currentStep++;
      const percent = Math.min(Math.round((currentStep / logsList.length) * 100), 100);
      setBatchScanProgress(percent);
      setBatchScanLog((prev) => [...prev, logsList[currentStep - 1]]);

      if (currentStep >= logsList.length) {
        clearInterval(interval);
        setIsBatchScanning(false);
        notify(`Storage verification completed for ${toScan.length} assets!`);
      }
    }, 300);
  };

  const handleBatchZipActionConfirm = () => {
    if (!batchZipPopupAction) return;
    
    const action = batchZipPopupAction;
    setAssets((prev) =>
      prev.map((asset) => {
        if (selectedAssetIds.includes(asset.id)) {
          return { ...asset, isZipped: action === 'zip' };
        }
        return asset;
      })
    );
    
    notify(action === 'zip' ? `Compressed payloads for ${selectedAssetIds.length} assets` : `Decompressed payloads for ${selectedAssetIds.length} assets`);
    setBatchZipPopupAction(null);
  };

  // ---------------------------------------------------------------------------
  // Derived Filtering State
  // ---------------------------------------------------------------------------
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const activeCategoryName = activeCategory ? activeCategory.name : 'All Assets';

  const displayedAssets = assets.filter((asset) => {
    if (activeCategoryId === 'cat-all') return true;
    return asset.categories.includes(activeCategoryId);
  });

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;

  // Global library metadata calculations
  const totalAssetsCount = assets.length;
  const zippedAssetsCount = assets.filter((a) => a.isZipped).length;
  const totalSizeRaw = assets.reduce((sum, a) => sum + a.size, 0);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-gray-200 overflow-hidden font-sans" id="megascans-app-root">
      {/* Top Global Navigation Bar */}
      <header className="h-12 border-b border-white/5 bg-[#0F0F0F] px-4 flex items-center justify-between z-10 shrink-0" id="global-navbar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-sans font-extrabold tracking-tight text-white text-xs uppercase">Megascan Organizer</span>
          </div>
          <span className="text-white/5">|</span>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <span>Total:</span>
              <span className="text-gray-300">{totalAssetsCount} Assets</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Compressed:</span>
              <span className="text-gray-300">{zippedAssetsCount} files ({Math.round((zippedAssetsCount / (totalAssetsCount || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Disk Weight:</span>
              <span className="text-blue-400 font-mono">{formatSize(totalSizeRaw)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`flex items-center gap-2 px-3 py-1.5 bg-[#121214] border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showScanner
                ? 'text-blue-400 border-blue-500/30 bg-blue-500/5'
                : 'text-gray-300 border-white/10 hover:border-white/20 hover:bg-[#161619]'
            }`}
            id="toggle-scanner-btn"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>{showScanner ? 'Hide Auto-Importer' : 'Show Auto-Importer'}</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 bg-[#121214] border border-white/10 hover:border-white/20 hover:bg-[#161619] text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer"
            id="open-settings-cog-btn"
            title="Configure Personalization & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative" id="app-workspace-body">
        
        {/* Left Drawer: Category Sidebar */}
        <Sidebar
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
          onCreateCategory={handleCreateCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategory={handleReorderCategory}
        />

        {/* Central Workspace (Includes Scanner and Card Grid) */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" id="central-grid-pane">
          {/* Collapsible Scanner section */}
          <AnimatePresence>
            {showScanner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-white/5 shrink-0"
                id="collapsible-scanner-container"
              >
                <div className="p-4 bg-black/20">
                  <DirectoryScanner
                    libraryAssets={assets}
                    evictedAssetPaths={evictedAssetPaths}
                    onImportAssets={handleImportAssets}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card Grid view */}
          <AssetGrid
            assets={displayedAssets}
            selectedAssetId={selectedAssetId}
            selectedAssetIds={selectedAssetIds}
            onSelectAsset={setSelectedAssetId}
            onToggleSelectAsset={handleToggleSelectAsset}
            onToggleZip={handleToggleZip}
            activeCategoryName={activeCategoryName}
            onToggleFavorite={handleToggleFavorite}
            columns={homePageColumns}
          />
        </main>

        {/* Right Drawer: Asset details (Slides from right when single selection is active) */}
        <AnimatePresence>
          {selectedAssetId && selectedAssetIds.length <= 1 && (
            <AssetDetails
              asset={selectedAsset}
              allAssets={assets}
              categories={categories}
              onClose={() => {
                setSelectedAssetId(null);
                setSelectedAssetIds([]);
              }}
              onToggleZip={handleToggleZip}
              onSaveAssetDetails={handleSaveAssetDetails}
              onSelectAsset={setSelectedAssetId}
              onDeleteAsset={handleDeleteAsset}
              onRemoveFromManager={handleRemoveFromManager}
              onMoveAssetPath={handleMoveAssetPath}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating Batch Actions Bar */}
      <AnimatePresence>
        {selectedAssetIds.length > 1 && (
          <motion.div
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-6 left-1/2 bg-[#121214]/95 border border-blue-500/35 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl shadow-blue-500/10 z-40 flex items-center gap-4 text-xs font-sans min-w-[500px]"
            id="floating-batch-bar"
          >
            <div className="flex flex-col border-r border-white/10 pr-4">
              <span className="font-mono font-bold text-blue-400">{selectedAssetIds.length} Selected</span>
              <span className="text-[10px] text-gray-400 mt-0.5">{formatSize(assets.filter(a => selectedAssetIds.includes(a.id)).reduce((sum, a) => sum + a.size, 0))}</span>
              <button
                onClick={() => {
                  setSelectedAssetIds([]);
                  setSelectedAssetId(null);
                }}
                className="text-[9px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-wider transition-colors mt-1.5 text-left flex items-center gap-1 cursor-pointer"
                title="Deselect all selected assets"
              >
                <X className="w-2.5 h-2.5" />
                <span>Deselect</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBatchConfirmAction('delete')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white transition-all font-semibold font-sans cursor-pointer"
                title="Delete from library and local drive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setBatchConfirmAction('remove')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-600 border border-amber-500/20 hover:border-amber-500 text-amber-400 hover:text-white transition-all font-semibold font-sans cursor-pointer"
                title="Remove from Manager (Exclude from future scanning)"
              >
                <FolderX className="w-3.5 h-3.5" />
                <span>Remove from Manager</span>
              </button>

              <button
                onClick={handleBatchFavorite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-600 border border-yellow-500/20 hover:border-yellow-500 text-yellow-400 hover:text-white transition-all font-semibold font-sans cursor-pointer"
                title="Toggle favorite status"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Favorites</span>
              </button>
            </div>

            <span className="text-white/10">|</span>

            <button
              onClick={() => setShowBatchEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 transition-all font-bold font-sans text-[11px] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Batch Edit</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Edit Modal Dialog */}
      <AnimatePresence>
        {showBatchEditModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#111112] border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              id="batch-edit-dialog"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 bg-white/2 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                    <span>Batch Editing Control Center</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Batch actions will apply to the <strong className="text-blue-400">{selectedAssetIds.length} selected assets</strong> ({formatSize(assets.filter(a => selectedAssetIds.includes(a.id)).reduce((sum, a) => sum + a.size, 0))})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBatchEditModal(false);
                    setIsBatchScanning(false);
                  }}
                  className="p-1 text-gray-500 hover:text-white rounded hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-6 max-h-[500px] scrollbar-thin scrollbar-thumb-white/5">
                {/* 1. Core Destructive Actions Row */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Core File Operations</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setBatchConfirmAction('delete')}
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-red-600/5 hover:bg-red-600/15 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all cursor-pointer text-center group"
                    >
                      <Trash2 className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                      <span className="font-sans font-bold text-red-300 text-[10px] uppercase">Delete Disk Assets</span>
                    </button>

                    <button
                      onClick={() => setBatchConfirmAction('remove')}
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer text-center group"
                    >
                      <FolderX className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="font-sans font-bold text-amber-300 text-[10px] uppercase">Remove from Manager</span>
                    </button>

                    <button
                      onClick={handleBatchFavorite}
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-yellow-500/5 hover:bg-yellow-500/15 border border-yellow-500/20 hover:border-yellow-500/40 rounded-xl transition-all cursor-pointer text-center group"
                    >
                      <Star className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                      <span className="font-sans font-bold text-yellow-300 text-[10px] uppercase">Favorite Toggle</span>
                    </button>
                  </div>
                </div>

                {/* 2. Category Move */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Move to Category</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {categories
                      .filter((c) => c.id !== 'cat-all' && c.id !== 'cat-favorites')
                      .map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleBatchMoveCategory(cat.id)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-blue-600 hover:text-white border border-white/5 rounded-lg text-xs font-semibold text-gray-300 transition-all cursor-pointer"
                        >
                          {cat.name}
                        </button>
                      ))}
                  </div>
                </div>

                {/* 3. Rescan & Verification */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-sans font-bold text-white uppercase tracking-wider">Storage Directory Scanner</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Audit files on your disk partition matching selected assets.</p>
                    </div>
                    <button
                      onClick={handleBatchRescan}
                      disabled={isBatchScanning}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 hover:border-white/20 rounded-md text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      {isBatchScanning ? 'Scanning...' : 'Rescan'}
                    </button>
                  </div>

                  {isBatchScanning && (
                    <div className="space-y-2 mt-2">
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${batchScanProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                        <span>Verifying drive hardlinks...</span>
                        <span>{batchScanProgress}%</span>
                      </div>

                      {/* Log output viewport */}
                      <div className="bg-black/80 rounded-lg p-2.5 h-32 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1 scrollbar-thin scrollbar-thumb-white/10" id="scan-terminal">
                        {batchScanLog.map((log, index) => (
                          <div key={index} className="line-clamp-1">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Compression Controls with state confirmation popups */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[11px] font-sans font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Archive Compression Controls</span>
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Batch compress or extract local folders to optimize storage weight.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBatchZipPopupAction('zip')}
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600 border border-amber-500/20 hover:border-amber-500 text-amber-400 hover:text-white transition-all font-semibold rounded-md text-xs cursor-pointer flex items-center gap-1"
                    >
                      <FileArchive className="w-3 h-3" />
                      <span>Zip</span>
                    </button>
                    <button
                      onClick={() => setBatchZipPopupAction('unzip')}
                      className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white transition-all font-semibold rounded-md text-xs cursor-pointer flex items-center gap-1"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Unzip</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 bg-white/2 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => {
                    setShowBatchEditModal(false);
                    setIsBatchScanning(false);
                  }}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                >
                  Close Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zip/Unzip Confirmation Popup */}
      <AnimatePresence>
        {batchZipPopupAction !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#141416] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              id="zip-unzip-confirm-popup"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-white/2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {batchZipPopupAction === 'zip' ? (
                    <FileArchive className="w-5 h-5 text-amber-400" />
                  ) : (
                    <FolderOpen className="w-5 h-5 text-blue-400" />
                  )}
                  <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider">
                    {batchZipPopupAction === 'zip' ? 'Zip Compression Audit' : 'Zip Decompression Audit'}
                  </h3>
                </div>
                <button
                  onClick={() => setBatchZipPopupAction(null)}
                  className="p-1 text-gray-500 hover:text-white rounded hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 max-h-[360px] scrollbar-thin scrollbar-thumb-white/5">
                <p className="text-xs text-gray-400">
                  You are about to perform a batch compression state change. Below is the compatibility checklist for the <strong className="text-white">{selectedAssetIds.length} currently selected assets</strong>:
                </p>

                {/* Section A: Assets that WILL be processed */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Assets to be {batchZipPopupAction === 'zip' ? 'Zipped (not zipped currently)' : 'Unzipped (currently zipped)'} ({
                      assets.filter(a => selectedAssetIds.includes(a.id) && (batchZipPopupAction === 'zip' ? !a.isZipped : a.isZipped)).length
                    } assets)</span>
                  </h4>
                  <div className="bg-black/35 rounded-xl border border-white/5 p-2 space-y-1.5">
                    {assets.filter(a => selectedAssetIds.includes(a.id) && (batchZipPopupAction === 'zip' ? !a.isZipped : a.isZipped)).length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic p-1">No assets require this state change.</p>
                    ) : (
                      assets.filter(a => selectedAssetIds.includes(a.id) && (batchZipPopupAction === 'zip' ? !a.isZipped : a.isZipped)).map(a => (
                        <div key={a.id} className="flex justify-between items-center text-[10px] bg-white/2 hover:bg-white/5 px-2 py-1 rounded">
                          <span className="text-white font-medium truncate max-w-[280px]">{a.name} ({a.resolution})</span>
                          <span className="font-mono text-emerald-400">{formatSize(a.size)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section B: Assets that are ALREADY in the state (SKIPPED) */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    <span>Skipped Assets (Already {batchZipPopupAction === 'zip' ? 'Zipped' : 'Unzipped'}) ({
                      assets.filter(a => selectedAssetIds.includes(a.id) && (batchZipPopupAction === 'zip' ? a.isZipped : !a.isZipped)).length
                    } assets)</span>
                  </h4>
                  <div className="bg-black/35 rounded-xl border border-white/5 p-2 space-y-1.5">
                    {assets.filter(a => selectedAssetIds.includes(a.id) && (batchZipPopupAction === 'zip' ? a.isZipped : !a.isZipped)).length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic p-1">No skipped assets.</p>
                    ) : (
                      assets.filter(a => selectedAssetIds.includes(a.id) && (batchZipPopupAction === 'zip' ? a.isZipped : !a.isZipped)).map(a => (
                        <div key={a.id} className="flex justify-between items-center text-[10px] opacity-60 bg-white/2 px-2 py-1 rounded">
                          <span className="text-gray-300 truncate max-w-[280px]">{a.name} ({a.resolution})</span>
                          <span className="font-mono text-gray-400">{formatSize(a.size)} (No Change)</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-white/2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">
                  {batchZipPopupAction === 'zip' ? 'Zip Compression' : 'Unzip Decompression'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBatchZipPopupAction(null)}
                    className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchZipActionConfirm}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer ${
                      batchZipPopupAction === 'zip' 
                        ? 'bg-amber-600 hover:bg-amber-500' 
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    Proceed with Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal (Floating pop-up with blurred background) */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" id="settings-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#111112] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px]"
              id="settings-modal-window"
            >
              {/* Settings Header */}
              <div className="px-5 py-4 bg-white/2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-sans font-extrabold text-white uppercase tracking-wider">Preferences & Preferences</span>
                </div>
                <button
                  onClick={() => {
                    const isDirty = draftHomePageColumns !== homePageColumns;
                    if (isDirty) {
                      setIsSettingsVibrating(true);
                      setForceSaveButtonRed(true);
                      setTimeout(() => {
                        setIsSettingsVibrating(false);
                        setForceSaveButtonRed(false);
                      }, 1000);
                    } else {
                      setShowSettingsModal(false);
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
                  id="settings-close-x"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Body Layout: Vertical Sidebar + Pane */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar Menu for Vertical Tabs */}
                <div className="w-48 border-r border-white/5 bg-[#0D0D0E] p-3 flex flex-col gap-1 shrink-0">
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg text-xs text-left cursor-default"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Personalization</span>
                    {draftHomePageColumns !== homePageColumns && (
                      <span className="text-red-500 font-bold text-sm leading-none select-none">*</span>
                    )}
                  </button>
                </div>

                {/* Right Content Pane */}
                <div className="flex-1 p-6 bg-[#111112] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Homepage Personalization
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
                      Customize how the Megascan library assets are visually organized on your central dashboard.
                    </p>

                    <div className="space-y-3.5">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-gray-300">
                          Grid Columns
                        </label>
                        {draftHomePageColumns !== homePageColumns && (
                          <span className="text-red-500 font-extrabold text-sm select-none" title="Unsaved changes">*</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Select how many horizontal asset cards to view on the main screen (Min: 3, Max: 8).
                      </p>

                      <div className="flex items-center gap-2.5 mt-2">
                        <button
                          onClick={() => setDraftHomePageColumns(prev => Math.max(3, prev - 1))}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold flex items-center justify-center cursor-pointer select-none transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={3}
                          max={8}
                          value={draftHomePageColumns}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setDraftHomePageColumns(val);
                            }
                          }}
                          onBlur={() => {
                            setDraftHomePageColumns(prev => Math.min(8, Math.max(3, prev)));
                          }}
                          className="w-16 h-8 text-center bg-[#161618] border border-white/10 rounded-lg text-white font-mono font-bold text-xs focus:border-blue-500 outline-none"
                        />
                        <button
                          onClick={() => setDraftHomePageColumns(prev => Math.min(8, prev + 1))}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold flex items-center justify-center cursor-pointer select-none transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer (Only visible if the settings are dirty/edited) */}
                  {draftHomePageColumns !== homePageColumns && (
                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                      <button
                        onClick={() => {
                          setDraftHomePageColumns(homePageColumns);
                          setShowSettingsModal(false);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setHomePageColumns(draftHomePageColumns);
                          setShowSettingsModal(false);
                          notify("Personalization settings updated successfully!");
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer ${
                          isSettingsVibrating ? 'animate-shake' : ''
                        } ${
                          forceSaveButtonRed 
                            ? 'bg-red-600 hover:bg-red-500 border border-red-500' 
                            : 'bg-blue-600 hover:bg-blue-500 border border-blue-500'
                        }`}
                      >
                        Save Settings
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Confirmation Modal for Batch Deletions or Exclusions */}
      <AnimatePresence>
        {batchConfirmAction !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4" id="batch-confirmation-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
              id="batch-confirmation-modal"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${batchConfirmAction === 'delete' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {batchConfirmAction === 'delete' ? <Trash2 className="w-5 h-5" /> : <FolderX className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider">
                    {batchConfirmAction === 'delete' ? 'Confirm Delete Disk Assets' : 'Confirm Remove from Manager'}
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {batchConfirmAction === 'delete' 
                      ? `Are you sure you want to delete the ${selectedAssetIds.length} selected assets from your local drive and library? This operation cannot be reverted.`
                      : `Are you sure you want to remove the ${selectedAssetIds.length} selected assets from the manager? They will be flagged and excluded from any future scans.`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  onClick={() => setBatchConfirmAction(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (batchConfirmAction === 'delete') {
                      handleBatchDelete();
                    } else {
                      handleBatchRemoveFromManager();
                    }
                    setBatchConfirmAction(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer transition-all ${
                    batchConfirmAction === 'delete' 
                      ? 'bg-red-600 hover:bg-red-500 border border-red-500/30 shadow-md shadow-red-950/30' 
                      : 'bg-amber-600 hover:bg-amber-500 border border-amber-500/30 shadow-md shadow-amber-950/30'
                  }`}
                >
                  {batchConfirmAction === 'delete' ? 'Delete Assets' : 'Remove Assets'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notifications toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-2.5 bg-blue-600 border border-blue-500 text-white font-sans font-bold text-xs rounded shadow-lg shadow-blue-500/10 z-50 flex items-center gap-2"
            id="toast-notification"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
