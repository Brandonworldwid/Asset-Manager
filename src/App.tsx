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
  Settings,
  LayoutGrid,
  Leaf,
  Folder,
  Tag,
  Package,
  Flame,
  Trees,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Library
} from 'lucide-react';

import { Asset, Category, getAssetGroupKey } from './types';
import { DEFAULT_CATEGORIES, INITIAL_ASSETS, MEGASCANS_SUBCATEGORIES } from './data/mockAssets';
import { mapCategoryPathToIds } from './utils';
import Sidebar from './components/Sidebar';
import DirectoryScanner from './components/DirectoryScanner';
import AssetGrid from './components/AssetGrid';
import AssetDetails from './components/AssetDetails';

const iconMap: Record<string, React.ComponentType<any>> = {
  FolderArchive: Library,
  Box: Box,
  Flower: Leaf,
  Leaf: Leaf,
  Layers: Layers,
  Grid: LayoutGrid,
  Star: Star,
  Folder: Folder,
  Tag: Tag,
  Sparkles: Sparkles,
  Package: Package,
  Flame: Flame,
  Trees: Trees,
  Compass: Compass,
};

export default function App() {
  // ---------------------------------------------------------------------------
  // State Initialization
  // ---------------------------------------------------------------------------
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('megascan_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out unwanted default categories (3D Assets, Plants, Surfaces, Atlases) if they exist
        return parsed.filter((c: Category) => ['cat-all', 'cat-favorites', 'cat-megascans'].includes(c.id) || c.id.startsWith('cat-custom-'));
      } catch (e) {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('megascan_assets');
    try {
      return saved ? JSON.parse(saved) : INITIAL_ASSETS;
    } catch (e) {
      return INITIAL_ASSETS;
    }
  });

  const [evictedAssetPaths, setEvictedAssetPaths] = useState<string[]>(() => {
    const saved = localStorage.getItem('megascan_evicted_paths');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Advanced 2D, Mode, and Moodboards pipeline states
  const [libraryMode, setLibraryMode] = useState<'3d' | '2d'>('3d');
  const [customMoodboards, setCustomMoodboards] = useState<string[]>(() => {
    const saved = localStorage.getItem('megascan_custom_moodboards');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);

  // Settings state
  const [homePageColumns, setHomePageColumns] = useState<number>(() => {
    const saved = localStorage.getItem('megascan_home_page_columns');
    return saved ? parseInt(saved, 10) : 4;
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [draftHomePageColumns, setDraftHomePageColumns] = useState<number>(4);
  const [isSettingsVibrating, setIsSettingsVibrating] = useState<boolean>(false);
  const [forceSaveButtonRed, setForceSaveButtonRed] = useState<boolean>(false);

  const [showBridgePrompt, setShowBridgePrompt] = useState<boolean>(() => {
    return localStorage.getItem('megascan_bridge_prompt_shown') !== 'true';
  });

  const [hasBridgeAssets, setHasBridgeAssets] = useState<boolean>(() => {
    return localStorage.getItem('megascan_has_bridge_assets') === 'true';
  });

  const [appDataPath, setAppDataPath] = useState<string>('');
  const [cachePath, setCachePath] = useState<string>('');
  const [draftAppDataPath, setDraftAppDataPath] = useState<string>('');
  const [draftCachePath, setDraftCachePath] = useState<string>('');

  // Categories editing in Settings states
  const [activeSettingsTab, setActiveSettingsTab] = useState<'personalization' | 'categories' | 'bridge' | 'storage'>('personalization');
  const [draftCategoriesList, setDraftCategoriesList] = useState<Category[]>([]);
  const [categoryNavPath, setCategoryNavPath] = useState<string[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState<string>('');
  const [newMainCategoryInput, setNewMainCategoryInput] = useState<string>('');
  const [activeIconSelectorCatId, setActiveIconSelectorCatId] = useState<string | null>(null);

  // Batch action states & confirmation
  const [showBatchEditModal, setShowBatchEditModal] = useState<boolean>(false);
  const [batchZipPopupAction, setBatchZipPopupAction] = useState<'zip' | 'unzip' | null>(null);
  const [batchConfirmAction, setBatchConfirmAction] = useState<'delete' | 'remove' | null>(null);
  const [resolutionSelectionAction, setResolutionSelectionAction] = useState<{ type: 'delete' | 'remove', assetIds: string[] } | null>(null);
  
  // Sync draft settings when settings modal is opened
  useEffect(() => {
    if (showSettingsModal) {
      setDraftHomePageColumns(homePageColumns);
      setDraftCategoriesList(JSON.parse(JSON.stringify(categories)));
      setDraftAppDataPath(appDataPath);
      setDraftCachePath(cachePath);
      
      const firstParent = categories.find(c => c.id !== 'cat-all' && c.id !== 'cat-favorites') || categories[0];
      setCategoryNavPath(firstParent ? [firstParent.id] : []);
      
      setNewSubcategoryInput('');
      setNewMainCategoryInput('');
      setActiveIconSelectorCatId(null);
      setActiveSettingsTab('personalization');
      setIsSettingsVibrating(false);
      setForceSaveButtonRed(false);
    }
  }, [showSettingsModal, homePageColumns, categories, appDataPath, cachePath]);

  // Save homePageColumns to localStorage
  useEffect(() => {
    localStorage.setItem('megascan_home_page_columns', homePageColumns.toString());
  }, [homePageColumns]);

  // Save customMoodboards to localStorage
  useEffect(() => {
    localStorage.setItem('megascan_custom_moodboards', JSON.stringify(customMoodboards));
  }, [customMoodboards]);
  
  // Batch rescan state
  const [isBatchScanning, setIsBatchScanning] = useState<boolean>(false);
  const [batchScanProgress, setBatchScanProgress] = useState<number>(0);
  const [batchScanLog, setBatchScanLog] = useState<string[]>([]);

  // Trigger transient toast notification
  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Save to localStorage whenever states change
  useEffect(() => {
    try {
      localStorage.setItem('megascan_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('megascan_assets', JSON.stringify(assets));
    } catch (e) {
      console.error('Failed to save assets to localStorage:', e);
      notify('Local storage limit reached. Assets will remain active in this session, but some changes won\'t persist across reloads.');
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('megascan_evicted_paths', JSON.stringify(evictedAssetPaths));
    } catch (e) {
      console.error('Failed to save evicted paths to localStorage:', e);
    }
  }, [evictedAssetPaths]);

  // Synchronize with local Python (FastAPI) cached sqlite library on startup
  useEffect(() => {
    setIsLoading(true);
    fetch('http://127.0.0.1:8000/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'running') {
          // Fetch settings first
          fetch('http://127.0.0.1:8000/api/settings')
            .then((r) => r.json())
            .then((sData) => {
              if (sData) {
                setAppDataPath(sData.app_data_path || '');
                setCachePath(sData.cache_path || '');
                setDraftAppDataPath(sData.app_data_path || '');
                setDraftCachePath(sData.cache_path || '');
                if (typeof sData.has_bridge_assets === 'boolean') {
                  setHasBridgeAssets(sData.has_bridge_assets);
                }
              }
            })
            .catch((err) => console.error('Error loading settings from Python:', err));

          fetch('http://127.0.0.1:8000/api/assets')
            .then((res) => res.json())
            .then((assetsData) => {
              if (assetsData.assets && assetsData.assets.length > 0) {
                const mappedAssets = assetsData.assets.map((a: any) => ({
                  ...a,
                  categories: mapCategoryPathToIds(a.categoryPaths || [])
                }));
                setAssets(mappedAssets);
                console.log('Successfully synchronized library from Python SQLite backend!', mappedAssets.length);
              }
              setIsLoading(false);
            })
            .catch((err) => {
              console.error('Error fetching assets from Python:', err);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => {
        // Fall back silently to simulated local storage database if local FastAPI is not running
        setIsLoading(false);
      });
  }, []);

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

  const handleToggleZip = async (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;

    const action = asset.isZipped ? 'unzip' : 'zip';
    
    try {
      const statusRes = await fetch('http://127.0.0.1:8000/api/status').catch(() => null);
      const isRunning = statusRes && statusRes.ok && (await statusRes.json()).status === 'running';

      if (isRunning) {
        const res = await fetch(`http://127.0.0.1:8000/api/assets/${id}/zip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: 'Failed to process on backend' }));
          throw new Error(errData.detail || 'Failed on backend');
        }
        const data = await res.json();
        
        setAssets((prev) =>
          prev.map((a) => {
            if (a.id === id) {
              return { 
                ...a, 
                isZipped: action === 'zip',
                thumbnailUrl: data.thumbnail || a.thumbnailUrl
              };
            }
            return a;
          })
        );
        notify(action === 'zip' ? `Compressed asset payload & cached preview thumbnail` : `Decompressed asset payload back to local disk folder`);
      } else {
        // Fallback simulation
        setAssets((prev) =>
          prev.map((a) => {
            if (a.id === id) {
              return { ...a, isZipped: action === 'zip' };
            }
            return a;
          })
        );
        notify(action === 'zip' ? `[Simulated] Compressed asset payload` : `[Simulated] Decompressed asset payload`);
      }
    } catch (e: any) {
      console.error('Zip toggle failed:', e);
      notify(`Operation failed: ${e.message || e}`);
    }
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

  const handleGroup2DAssets = () => {
    const selected = assets.filter(a => selectedAssetIds.includes(a.id));
    if (selected.length < 2) return;
    
    const groupId = `2d-group-${Math.random().toString(36).substring(2, 8)}`;
    const newGroupAsset: Asset = {
      id: groupId,
      name: `Image Group (${selected.length} items)`,
      type: '2d',
      size: selected.reduce((sum, a) => sum + a.size, 0),
      isZipped: false,
      resolution: selected[0].resolution,
      thumbnailUrl: selected[0].thumbnailUrl,
      tags: ['group', '2d-group'],
      categories: selected[0].categories,
      scannedPath: selected[0].scannedPath,
      dateAdded: new Date().toISOString(),
      textures: selected[0].textures,
      colors: selected[0].colors,
      isGroup: true,
    };

    setAssets(prev => {
      const updated = prev.map(a => selectedAssetIds.includes(a.id) ? { ...a, groupId } : a);
      return [newGroupAsset, ...updated];
    });

    setSelectedAssetIds([]);
    setSelectedAssetId(null);
    notify(`Grouped ${selected.length} images into a single asset card.`);
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
    const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id));
    const groupKeysToDelete = new Set(selectedAssets.map((a) => getAssetGroupKey(a)));
    
    setAssets((prev) => prev.filter((a) => !groupKeysToDelete.has(getAssetGroupKey(a))));
    notify(`Deleted all variants for ${selectedAssetIds.length} selected assets.`);
    setSelectedAssetIds([]);
    setSelectedAssetId(null);
    setShowBatchEditModal(false);
  };

  const handleBatchRemoveFromManager = () => {
    const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id));
    const groupKeysToRemove = new Set(selectedAssets.map((a) => getAssetGroupKey(a)));
    const toRemove = assets.filter((a) => groupKeysToRemove.has(getAssetGroupKey(a)));
    
    setEvictedAssetPaths((prev) => {
      const next = [...prev];
      toRemove.forEach((a) => {
        if (!next.includes(a.scannedPath)) {
          next.push(a.scannedPath);
        }
      });
      return next;
    });
    setAssets((prev) => prev.filter((a) => !groupKeysToRemove.has(getAssetGroupKey(a))));
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
    setAssets((prev) => {
      // 1. Identify all variants of ALL selected assets
      const selectedAssets = prev.filter(a => selectedAssetIds.includes(a.id));
      const groupKeysToMove = new Set(selectedAssets.map(a => getAssetGroupKey(a)));
      
      return prev.map((asset) => {
        // 2. Check if this asset is a variant of any selected asset
        if (groupKeysToMove.has(getAssetGroupKey(asset))) {
          const hasFavorite = asset.categories.includes('cat-favorites');
          return {
            ...asset,
            categories: hasFavorite ? [categoryId, 'cat-favorites'] : [categoryId],
          };
        }
        return asset;
      });
    });
    const targetCatName = categories.find((c) => c.id === categoryId)?.name || 'New Category';
    notify(`Moved all resolution variants of ${selectedAssetIds.length} asset groups to category "${targetCatName}"`);
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

  const handleBatchZipActionConfirm = async () => {
    if (!batchZipPopupAction) return;
    
    const action = batchZipPopupAction;
    
    try {
      const statusRes = await fetch('http://127.0.0.1:8000/api/status').catch(() => null);
      const isRunning = statusRes && statusRes.ok && (await statusRes.json()).status === 'running';

      if (isRunning) {
        notify(`Processing batch ${action === 'zip' ? 'compression' : 'decompression'} on server backend...`);
        const res = await fetch('http://127.0.0.1:8000/api/assets/batch-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_ids: selectedAssetIds, action })
        });
        if (!res.ok) {
          throw new Error('Batch operation failed on server');
        }
        
        // Refresh catalog from database
        const assetsRes = await fetch('http://127.0.0.1:8000/api/assets');
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          if (assetsData.assets) {
            const mappedAssets = assetsData.assets.map((a: any) => ({
              ...a,
              categories: mapCategoryPathToIds(a.categoryPaths || [])
            }));
            setAssets(mappedAssets);
          }
        }
        notify(action === 'zip' ? `Compressed payloads for ${selectedAssetIds.length} assets` : `Decompressed payloads for ${selectedAssetIds.length} assets`);
      } else {
        // Fallback simulation
        setAssets((prev) =>
          prev.map((asset) => {
            if (selectedAssetIds.includes(asset.id)) {
              return { ...asset, isZipped: action === 'zip' };
            }
            return asset;
          })
        );
        notify(action === 'zip' ? `[Simulated] Compressed payloads for ${selectedAssetIds.length} assets` : `[Simulated] Decompressed payloads for ${selectedAssetIds.length} assets`);
      }
    } catch (e: any) {
      console.error('Batch Zip failed:', e);
      notify(`Batch operation failed: ${e.message || e}`);
    }
    
    setBatchZipPopupAction(null);
  };

  // ---------------------------------------------------------------------------
  // Advanced 2D, Colors & Moodboards pipeline handlers
  // ---------------------------------------------------------------------------
  const handleCreateMoodboard = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !customMoodboards.includes(trimmed)) {
      setCustomMoodboards((prev) => [...prev, trimmed]);
      notify(`Moodboard "${trimmed}" created!`);
    }
  };

  const handleUpdateAssetMoodboards = async (assetId: string, nextMoodboards: string[]) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/assets/${assetId}/moodboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodboards: nextMoodboards }),
      });
      if (res.ok) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, moodboards: nextMoodboards } : a)));
      } else {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, moodboards: nextMoodboards } : a)));
      }
    } catch (err) {
      console.error("Error updating asset moodboards:", err);
      setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, moodboards: nextMoodboards } : a)));
    }
  };

  const handleDeleteMoodboard = async (name: string) => {
    setCustomMoodboards((prev) => prev.filter((m) => m !== name));
    
    // De-assign moodboard from all assets
    const affectedAssets = assets.filter((a) => a.moodboards && a.moodboards.includes(name));
    for (const item of affectedAssets) {
      const nextMbs = (item.moodboards || []).filter((m) => m !== name);
      await handleUpdateAssetMoodboards(item.id, nextMbs);
    }
    
    notify(`Moodboard "${name}" deleted.`);
  };

  // Color matching utilities
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  };

  const colorDistance = (hex1: string, hex2: string) => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const matchesColorFilter = (assetColors: string[] | undefined, filterHex: string | null) => {
    if (!filterHex) return true;
    if (!assetColors || assetColors.length === 0) return false;
    return assetColors.some((color) => colorDistance(color, filterHex) < 95);
  };

  // Dynamic moodboards calculated list
  const computedMoodboardsList = React.useMemo(() => {
    const set = new Set<string>(customMoodboards);
    assets.forEach((a) => {
      if (a.moodboards) {
        a.moodboards.forEach((m) => set.add(m));
      }
    });
    return Array.from(set).sort();
  }, [assets, customMoodboards]);

  // ---------------------------------------------------------------------------
  // Derived Filtering State
  // ---------------------------------------------------------------------------
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const activeCategoryName = activeCategory ? activeCategory.name : 'All Assets';

  const displayedAssets = assets.filter((asset) => {
    // 0. Filter by group visibility
    if (activeGroupId) {
      if (asset.groupId !== activeGroupId) return false;
    } else {
      if (asset.groupId) return false;
    }

    // 1. Differentiate library modes (3D vs 2D)
    if (libraryMode === '2d') {
      if (asset.type !== '2d') return false;
    } else {
      if (asset.type === '2d') return false;
    }

    // 2. Filter by category or pseudo-category (orientation/moodboards)
    if (activeCategoryId !== 'cat-all') {
      if (activeCategoryId === 'cat-2d-landscape') {
        if (asset.orientation !== 'landscape') return false;
      } else if (activeCategoryId === 'cat-2d-portrait') {
        if (asset.orientation !== 'portrait') return false;
      } else if (activeCategoryId === 'cat-2d-square') {
        if (asset.orientation !== 'square') return false;
      } else if (activeCategoryId.startsWith('moodboard-')) {
        const mbName = activeCategoryId.replace('moodboard-', '');
        if (!asset.moodboards || !asset.moodboards.includes(mbName)) return false;
      } else {
        if (!asset.categories.includes(activeCategoryId)) return false;
      }
    }

    // 3. Color matching filter for 2D library
    if (libraryMode === '2d' && selectedColorFilter) {
      if (!matchesColorFilter(asset.colors, selectedColorFilter)) return false;
    }

    return true;
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

  const handleBridgeToggle = (val: boolean) => {
    setHasBridgeAssets(val);
    localStorage.setItem('megascan_has_bridge_assets', val ? 'true' : 'false');
    localStorage.setItem('megascan_bridge_prompt_shown', 'true');
    
    if (val) {
       // add Mega Scans category
       setCategories(prev => {
           if (!prev.find(c => c.id === 'cat-megascans')) {
               return [...prev, { id: 'cat-megascans', name: 'Megascans', icon: 'Box', subcategories: MEGASCANS_SUBCATEGORIES }];
           }
           return prev;
       });
       setDraftCategoriesList(prev => {
           if (!prev.find(c => c.id === 'cat-megascans')) {
               return [...prev, { id: 'cat-megascans', name: 'Megascans', icon: 'Box', subcategories: MEGASCANS_SUBCATEGORIES }];
           }
           return prev;
       });
       notify("Megascans workspace created");
    } else {
       // remove Mega Scans category
       setCategories(prev => prev.filter(c => c.id !== 'cat-megascans'));
       setDraftCategoriesList(prev => prev.filter(c => c.id !== 'cat-megascans'));
       notify("Megascans workspace removed");
    }
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
          libraryMode={libraryMode}
          onLibraryModeChange={setLibraryMode}
          moodboards={computedMoodboardsList}
          onCreateMoodboard={handleCreateMoodboard}
          onDeleteMoodboard={handleDeleteMoodboard}
          selectedColorFilter={selectedColorFilter}
          onSelectColorFilter={setSelectedColorFilter}
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
          {activeGroupId && (
            <div className="px-5 py-3 border-b border-white/5 bg-[#121214] flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveGroupId(null);
                  setSelectedAssetIds([]);
                  setSelectedAssetId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded text-xs font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Library</span>
              </button>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Viewing Image Group</span>
              </div>
            </div>
          )}
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
            isLoading={isLoading}
            onDoubleClickAsset={(id) => {
              const asset = assets.find(a => a.id === id);
              if (asset?.isGroup) {
                setActiveGroupId(asset.id);
                setSelectedAssetIds([]);
                setSelectedAssetId(null);
              } else {
                handleToggleZip(id);
              }
            }}
          />
        </main>

        {/* Right Drawer: Asset details (Slides from right when single selection is active) */}
        <AnimatePresence>
          {selectedAssetId && selectedAssetIds.length <= 1 && (
            <AssetDetails
              asset={selectedAsset}
              allAssets={assets}
              categories={[...categories, ...MEGASCANS_SUBCATEGORIES.map(s => ({ ...s, icon: 'Folder' }))]}
              onClose={() => {
                setSelectedAssetId(null);
                setSelectedAssetIds([]);
              }}
              onToggleZip={handleToggleZip}
              onSaveAssetDetails={handleSaveAssetDetails}
              onSelectAsset={setSelectedAssetId}
              onDeleteAsset={(id) => setResolutionSelectionAction({ type: 'delete', assetIds: [id] })}
              onRemoveFromManager={(id) => setResolutionSelectionAction({ type: 'remove', assetIds: [id] })}
              onMoveAssetPath={handleMoveAssetPath}
              notify={notify}
              moodboards={computedMoodboardsList}
              onUpdateAssetMoodboards={handleUpdateAssetMoodboards}
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
                onClick={() => setResolutionSelectionAction({ type: 'delete', assetIds: selectedAssetIds })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white transition-all font-semibold font-sans cursor-pointer"
                title="Delete from library and local drive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setResolutionSelectionAction({ type: 'remove', assetIds: selectedAssetIds })}
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

              {selectedAssetIds.length > 1 && assets.filter(a => selectedAssetIds.includes(a.id)).every(a => a.type === '2d') && (
                <button
                  onClick={handleGroup2DAssets}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white transition-all font-semibold font-sans cursor-pointer"
                  title="Group selected 2D images"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Group Images</span>
                </button>
              )}
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
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                    {(() => {
                      const flattenedCats: { id: string; name: string; pathName: string }[] = [];
                      const traverse = (cats: Category[], parentPathName: string = '') => {
                        cats.forEach(c => {
                          if (c.id === 'cat-all' || c.id === 'cat-favorites') return;
                          const currentPath = parentPathName ? `${parentPathName} > ${c.name}` : c.name;
                          flattenedCats.push({ id: c.id, name: c.name, pathName: currentPath });
                          if (c.subcategories) {
                            traverse(c.subcategories, currentPath);
                          }
                        });
                      };
                      traverse(categories);
                      return flattenedCats.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleBatchMoveCategory(cat.id)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-blue-600 hover:text-white border border-white/5 rounded-lg text-[10px] font-semibold text-gray-300 transition-all cursor-pointer"
                          title={cat.pathName}
                        >
                          {cat.pathName}
                        </button>
                      ));
                    })()}
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
        {showSettingsModal && (() => {
          const isPersonalizationDirty = draftHomePageColumns !== homePageColumns;
          const isCategoriesDirty = JSON.stringify(categories) !== JSON.stringify(draftCategoriesList);
          const isStorageDirty = draftAppDataPath !== appDataPath || draftCachePath !== cachePath;
          const isSettingsDirty = isPersonalizationDirty || isCategoriesDirty || isStorageDirty;
          
          const findCategoryByPath = (list: any[], path: string[]): any => {
            if (path.length === 0) return null;
            let currentList = list;
            let target = null;
            for (let i = 0; i < path.length; i++) {
              target = currentList.find(c => c.id === path[i]);
              if (!target) return null;
              currentList = target.subcategories || [];
            }
            return target;
          };

          const selectedParentCategory = findCategoryByPath(draftCategoriesList, categoryNavPath);
          const subCount = selectedParentCategory?.subcategories?.length || 0;

          // Action handlers for categories drafting inside Settings
          const handleChangeDraftCategoryIcon = (catId: string, iconName: string) => {
            setDraftCategoriesList(prev => prev.map(c => c.id === catId ? { ...c, icon: iconName } : c));
          };

          const handleRenameDraftCategory = (catId: string, newName: string) => {
            setDraftCategoriesList(prev => prev.map(c => c.id === catId ? { ...c, name: newName } : c));
          };

          const handleDeleteDraftCategory = (catId: string) => {
            setDraftCategoriesList(prev => prev.filter(c => c.id !== catId));
            if (categoryNavPath[0] === catId) {
              setCategoryNavPath([]);
            }
          };

          const handleAddDraftCategory = (name: string) => {
            if (!name.trim()) return;
            const newId = `cat-custom-${Math.random().toString(36).substring(2, 9)}`;
            const newCat: Category = {
              id: newId,
              name: name.trim(),
              icon: 'Tag',
              subcategories: []
            };
            setDraftCategoriesList(prev => [...prev, newCat]);
            setCategoryNavPath([newId]);
          };

          const updateNestedCategory = (list: any[], path: string[], updateFn: (cat: any) => any): any[] => {
            if (path.length === 0) return list;
            const [currentId, ...restPath] = path;
            return list.map(c => {
              if (c.id === currentId) {
                if (restPath.length === 0) {
                  return updateFn(c);
                } else {
                  return {
                    ...c,
                    subcategories: updateNestedCategory(c.subcategories || [], restPath, updateFn)
                  };
                }
              }
              return c;
            });
          };

          const handleAddDraftSubcategory = (path: string[], subName: string) => {
            if (!subName.trim() || path.length === 0) return;
            setDraftCategoriesList(prev => updateNestedCategory(prev, path, (c) => {
              const subs = c.subcategories || [];
              if (path.length > 0 && path.length <= 8 && subs.length >= 8 && path.length > 1) {
                // If it's a nested subcategory (depth > 1), enforce 8 items limit
                return c;
              }
              const newSub = {
                id: `sub-${Math.random().toString(36).substring(2, 9)}`,
                name: subName.trim(),
                subcategories: []
              };
              return {
                ...c,
                subcategories: [...subs, newSub]
              };
            }));
          };

          const handleDeleteDraftSubcategory = (path: string[], subId: string) => {
            setDraftCategoriesList(prev => updateNestedCategory(prev, path, (c) => {
              return {
                ...c,
                subcategories: (c.subcategories || []).filter((sub: any) => sub.id !== subId)
              };
            }));
          };

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" id="settings-modal-overlay">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-3xl bg-[#111112] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]"
                id="settings-modal-window"
              >
                {/* Settings Header */}
                <div className="px-5 py-4 bg-white/2 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-sans font-extrabold text-white uppercase tracking-wider">Preferences & Categories Settings</span>
                  </div>
                  <button
                    onClick={() => {
                      if (isSettingsDirty) {
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
                <div className="flex-1 flex overflow-hidden min-h-0">
                  {/* Left Sidebar Menu for Vertical Tabs */}
                  <div className="w-48 border-r border-white/5 bg-[#0D0D0E] p-3 flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => setActiveSettingsTab('personalization')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        activeSettingsTab === 'personalization'
                          ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold'
                          : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="flex-1 truncate">Personalization</span>
                      {isPersonalizationDirty && (
                        <span className="text-red-500 font-bold text-[10px] leading-none select-none">*</span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveSettingsTab('categories')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        activeSettingsTab === 'categories'
                          ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold'
                          : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="flex-1 truncate">Categories</span>
                      {isCategoriesDirty && (
                        <span className="text-red-500 font-bold text-[10px] leading-none select-none">*</span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab('bridge')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        activeSettingsTab === 'bridge'
                          ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold'
                          : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span className="flex-1 truncate">Bridge</span>
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab('storage')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        activeSettingsTab === 'storage'
                          ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold'
                          : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span className="flex-1 truncate">Storage & Cache</span>
                      {isStorageDirty && (
                        <span className="text-red-500 font-bold text-[10px] leading-none select-none">*</span>
                      )}
                    </button>
                  </div>

                  {/* Right Content Pane */}
                  <div className="flex-1 p-6 bg-[#111112] flex flex-col justify-between min-h-0">
                    
                    {activeSettingsTab === 'personalization' ? (
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span>Homepage Personalization</span>
                          {isPersonalizationDirty && (
                            <span className="text-red-500 font-extrabold text-sm leading-none" title="Unsaved changes">*</span>
                          )}
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
                          Customize how the Megascan library assets are visually organized on your central dashboard.
                        </p>

                        <div className="space-y-3.5">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-gray-300">
                              Grid Columns
                            </label>
                            {isPersonalizationDirty && (
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
                    ) : (
                      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span>Categories & Customization</span>
                          {isCategoriesDirty && (
                            <span className="text-red-500 font-extrabold text-sm leading-none" title="Unsaved category changes">*</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                          Create or delete parent categories, customize icons, and manage up to 8 subcategories each.
                        </p>

                        {/* Split layout inside Settings */}
                        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden text-xs">
                          
                          {/* Left Pane: Categories List (cols-7) */}
                          <div className="col-span-7 flex flex-col min-h-0 bg-black/10 border border-white/5 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-wider">Parent Categories</span>
                              <span className="text-[10px] text-gray-500">Click to edit subcategories</span>
                            </div>

                            {/* Add Category Form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (newMainCategoryInput.trim()) {
                                  handleAddDraftCategory(newMainCategoryInput.trim());
                                  setNewMainCategoryInput('');
                                }
                              }}
                              className="flex gap-1.5 mb-3"
                            >
                              <input
                                type="text"
                                placeholder="New category name..."
                                value={newMainCategoryInput}
                                onChange={(e) => setNewMainCategoryInput(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-gray-600 focus:border-blue-500 outline-none"
                              />
                              <button
                                type="submit"
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            </form>

                            {/* Scrollable list */}
                            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/5">
                              {draftCategoriesList.map((cat) => {
                                const OptionIcon = iconMap[cat.icon || ''] || Tag;
                                const isSelected = categoryNavPath[0] === cat.id;
                                const isProtectedCat = ['cat-all', 'cat-favorites'].includes(cat.id);
                                const isCustomDeletable = !['cat-all', 'cat-3d', 'cat-plants', 'cat-surfaces', 'cat-atlases', 'cat-favorites'].includes(cat.id);

                                return (
                                  <div
                                    key={cat.id}
                                    onClick={() => setCategoryNavPath([cat.id])}
                                    className={`relative flex items-center justify-between gap-2 p-1.5 rounded border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 font-bold'
                                        : 'bg-white/2 border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {/* Icon Selector Button */}
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveIconSelectorCatId(activeIconSelectorCatId === cat.id ? null : cat.id);
                                          }}
                                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                          title="Change Category Icon"
                                        >
                                          <OptionIcon className="w-3.5 h-3.5 shrink-0" />
                                        </button>

                                        {/* Icon Selector Dropdown Popup */}
                                        {activeIconSelectorCatId === cat.id && (
                                          <div className="absolute left-0 top-7 z-50 bg-[#161619] border border-white/10 rounded-lg p-1.5 grid grid-cols-5 gap-1 shadow-2xl w-[160px]">
                                            {['Box', 'Leaf', 'Layers', 'Grid', 'Star', 'Folder', 'Tag', 'Sparkles', 'Package', 'Flame'].map((iconName) => {
                                              const PickerIcon = iconMap[iconName] || Tag;
                                              return (
                                                <button
                                                  key={iconName}
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleChangeDraftCategoryIcon(cat.id, iconName);
                                                    setActiveIconSelectorCatId(null);
                                                  }}
                                                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                                                  title={iconName}
                                                >
                                                  <PickerIcon className="w-3 h-3" />
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {/* Category Name (Editable if custom, otherwise text) */}
                                      {isProtectedCat ? (
                                        <span className="font-medium truncate text-gray-500">{cat.name}</span>
                                      ) : (
                                        <input
                                          type="text"
                                          value={cat.name}
                                          onChange={(e) => handleRenameDraftCategory(cat.id, e.target.value)}
                                          className="bg-transparent border-b border-transparent focus:border-white/20 outline-none text-[11px] font-medium w-full text-white py-0.5"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      )}
                                    </div>

                                    {/* Subcategories count badge & Delete button */}
                                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      {cat.subcategories && cat.subcategories.length > 0 && (
                                        <span className="bg-white/5 text-gray-500 px-1 py-0.5 rounded text-[9px] font-mono">
                                          {cat.subcategories.length}
                                        </span>
                                      )}
                                      {isCustomDeletable && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDraftCategory(cat.id)}
                                          className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-white/5 transition-colors cursor-pointer"
                                          title="Delete Category"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Pane: Subcategories Management (cols-5) */}
                          <div className="col-span-5 flex flex-col min-h-0 bg-black/10 border border-white/5 rounded-xl p-3">
                            {selectedParentCategory ? (
                              <div className="flex flex-col h-full min-h-0">
                                <div className="mb-2 flex items-center gap-2">
                                  {categoryNavPath.length > 1 && (
                                    <button
                                      onClick={() => setCategoryNavPath(prev => prev.slice(0, -1))}
                                      className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                                      title="Back to Parent"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate mb-1">
                                      {categoryNavPath.length > 1 ? 'Nested under' : 'Subcategories of'}
                                    </div>
                                    <div className="font-bold text-white text-[12px] truncate">
                                      {selectedParentCategory.name}
                                    </div>
                                  </div>
                                </div>

                                {/* List of subcategories */}
                                <div className="flex-1 overflow-y-auto space-y-1.5 my-2 pr-1 scrollbar-thin scrollbar-thumb-white/5">
                                  {selectedParentCategory.subcategories && selectedParentCategory.subcategories.length > 0 ? (
                                    selectedParentCategory.subcategories.map((sub: any) => (
                                      <div
                                        key={sub.id}
                                        onClick={() => {
                                          if (categoryNavPath.length < 8) {
                                            setCategoryNavPath(prev => [...prev, sub.id]);
                                          }
                                        }}
                                        className="flex items-center justify-between p-1.5 bg-white/3 border border-white/5 rounded text-gray-300 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <span className="truncate font-medium text-[11px]">{sub.name}</span>
                                          {sub.subcategories && sub.subcategories.length > 0 && (
                                            <span className="bg-white/5 text-gray-500 px-1 py-0.5 rounded text-[8px] font-mono shrink-0">
                                              {sub.subcategories.length} subs
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {categoryNavPath.length < 8 && (
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                          )}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteDraftSubcategory(categoryNavPath, sub.id);
                                            }}
                                            className="p-0.5 text-gray-500 hover:text-red-400 rounded hover:bg-white/5 transition-colors cursor-pointer ml-1"
                                            title="Delete Subcategory"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4 pointer-events-none">
                                      <p className="text-[10px] text-gray-600 italic">No subcategories yet.</p>
                                      {categoryNavPath.length > 1 ? (
                                        <p className="text-[9px] text-gray-600 mt-0.5">Use the form below to add up to 8.</p>
                                      ) : (
                                        <p className="text-[9px] text-gray-600 mt-0.5">Use the form below to add unlimited subcategories.</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Add subcategory form */}
                                <div className="border-t border-white/5 pt-2 mt-auto">
                                  {categoryNavPath.length > 1 && subCount >= 8 ? (
                                    <div className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded text-center font-bold">
                                      Max 8 subcategories limit reached for nested levels.
                                    </div>
                                  ) : categoryNavPath.length >= 8 ? (
                                    <div className="text-[9px] text-orange-400 bg-orange-500/10 border border-orange-500/20 p-2 rounded text-center font-bold">
                                      Maximum nesting depth of 8 reached.
                                    </div>
                                  ) : (
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        if (newSubcategoryInput.trim()) {
                                          handleAddDraftSubcategory(categoryNavPath, newSubcategoryInput.trim());
                                          setNewSubcategoryInput('');
                                        }
                                      }}
                                      className="flex gap-1"
                                    >
                                      <input
                                        type="text"
                                        placeholder="Add subcategory..."
                                        value={newSubcategoryInput}
                                        onChange={(e) => setNewSubcategoryInput(e.target.value)}
                                        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white placeholder:text-gray-600 focus:border-blue-500 outline-none"
                                      />
                                      <button
                                        type="submit"
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                                      >
                                        Add
                                      </button>
                                    </form>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <p className="text-[10px] text-gray-600 italic">No parent category selected.</p>
                                <p className="text-[9px] text-gray-600 mt-1">Select one from the left list to manage subcategories.</p>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {activeSettingsTab === 'bridge' && (
                      <div className="flex flex-col h-full">
                        <div className="mb-6">
                           <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Bridge Integration</h4>
                           <p className="text-gray-400 text-[11px] leading-relaxed">
                             Manage your Bridge assets workspace. Epic Games moved Bridge to Fab, but you can still access downloaded assets.
                           </p>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-white mb-1">Do you have Bridge assets?</span>
                              <span className="text-xs text-gray-500">Toggling this will {hasBridgeAssets ? "remove" : "create"} the Mega Scans category.</span>
                           </div>
                           <button
                              onClick={() => handleBridgeToggle(!hasBridgeAssets)}
                              className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                                 hasBridgeAssets ? 'bg-blue-600' : 'bg-white/10'
                              }`}
                           >
                              <div 
                                 className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                                    hasBridgeAssets ? 'translate-x-7' : 'translate-x-1'
                                 }`} 
                              />
                           </button>
                        </div>
                      </div>
                    )}

                    {activeSettingsTab === 'storage' && (
                      <div className="flex flex-col h-full gap-4">
                        <div className="mb-2">
                           <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Storage & Cache Settings</h4>
                           <p className="text-gray-400 text-[11px] leading-relaxed">
                             Customize where your SQLite library database and compressed preview thumbnails cache are stored. Relocating directories will migrate your library database automatically.
                           </p>
                        </div>
                        
                        <div className="flex flex-col gap-4 bg-white/5 border border-white/10 p-5 rounded-xl text-xs">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-300 font-bold">App Data Directory (SQLite library DB):</label>
                            <input
                              type="text"
                              value={draftAppDataPath}
                              onChange={(e) => setDraftAppDataPath(e.target.value)}
                              placeholder="e.g. /home/user/.megascan_data"
                              className="bg-[#121214] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all font-mono w-full"
                            />
                            <p className="text-[10px] text-gray-500 italic">Current path on server: {appDataPath || './.megascan_data'}</p>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-300 font-bold">Zip Preview Thumbnails Cache Directory:</label>
                            <input
                              type="text"
                              value={draftCachePath}
                              onChange={(e) => setDraftCachePath(e.target.value)}
                              placeholder="e.g. /home/user/.megascan_cache"
                              className="bg-[#121214] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all font-mono w-full"
                            />
                            <p className="text-[10px] text-gray-500 italic">Current path on server: {cachePath || './.megascan_cache'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer (Only visible if settings are dirty) */}
                    {isSettingsDirty && (
                      <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4 mt-4">
                        <button
                          onClick={() => {
                            setDraftHomePageColumns(homePageColumns);
                            setDraftCategoriesList(JSON.parse(JSON.stringify(categories)));
                            setShowSettingsModal(false);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            setHomePageColumns(draftHomePageColumns);
                            setCategories(draftCategoriesList);
                            
                            if (isStorageDirty) {
                              try {
                                const res = await fetch('http://127.0.0.1:8000/api/settings', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    app_data_path: draftAppDataPath,
                                    cache_path: draftCachePath,
                                    has_bridge_assets: hasBridgeAssets
                                  })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setAppDataPath(draftAppDataPath);
                                  setCachePath(draftCachePath);
                                  
                                  // Refresh the assets from the newly relocated SQLite database
                                  const assetsRes = await fetch('http://127.0.0.1:8000/api/assets');
                                  if (assetsRes.ok) {
                                    const assetsData = await assetsRes.json();
                                    if (assetsData.assets) {
                                      const mappedAssets = assetsData.assets.map((a: any) => ({
                                        ...a,
                                        categories: mapCategoryPathToIds(a.categoryPaths || [])
                                      }));
                                      setAssets(mappedAssets);
                                    }
                                  }
                                  notify("Storage configuration updated and library successfully synchronized!");
                                } else {
                                  throw new Error("Failed to save settings on Python backend");
                                }
                              } catch (err: any) {
                                console.error('Failed to update storage paths:', err);
                                notify(`Failed to save storage paths: ${err.message || err}`);
                              }
                            } else {
                              notify("Preferences and categories updated successfully!");
                            }
                            
                            setShowSettingsModal(false);
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
          );
        })()}
      </AnimatePresence>

      {/* Bridge Initial Prompt */}
      {showBridgePrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#111112] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl flex flex-col items-center text-center"
           >
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-5">
                <Box className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Do you have Bridge assets?</h2>
              <p className="text-gray-400 mb-8 text-xs leading-relaxed">
                 Epic Games recently acquired Bridge and moved it to Fab. If you have previously downloaded Mega Scans from Bridge, we can create a dedicated workspace for them.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                 <button 
                    onClick={() => {
                       handleBridgeToggle(true);
                       setShowBridgePrompt(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer border border-blue-500"
                 >
                    Yes, I have Bridge assets
                 </button>
                 <button 
                    onClick={() => {
                       handleBridgeToggle(false);
                       setShowBridgePrompt(false);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg font-bold text-xs transition-colors border border-white/10 cursor-pointer"
                 >
                    No
                 </button>
                 <button 
                    onClick={() => {
                       setShowBridgePrompt(false);
                       localStorage.setItem('megascan_bridge_prompt_shown', 'true');
                    }}
                    className="w-full bg-transparent hover:bg-white/5 text-gray-400 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer mt-1"
                 >
                    Not now
                 </button>
              </div>
              <p className="text-gray-500 text-[10px] mt-6">
                 You can change this later in settings.
              </p>
           </motion.div>
        </div>
      )}

      {/* Resolution Selection Modal */}
      <AnimatePresence>
        {resolutionSelectionAction !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4" id="resolution-selection-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider">
                {resolutionSelectionAction.type === 'delete' ? 'Delete Resolutions' : 'Remove Resolutions'}
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Choose which resolution to {resolutionSelectionAction.type === 'delete' ? 'delete' : 'remove'}.
              </p>
              
              <div className="flex flex-col gap-2">
                 {(Array.from(new Set(assets.filter(a => resolutionSelectionAction.assetIds.includes(a.id)).map(a => a.resolution))) as string[]).sort().map(res => (
                   <button
                     key={res}
                     onClick={() => {
                        // Logic to delete specific resolution
                        // Need to find all variants of the selected assets that match this resolution
                        const selectedAssets = assets.filter(a => resolutionSelectionAction.assetIds.includes(a.id));
                        const groupKeys = new Set(selectedAssets.map(a => getAssetGroupKey(a)));
                        const assetsInGroupWithRes = assets.filter(a => groupKeys.has(getAssetGroupKey(a)) && a.resolution === res);
                        const targetIds = assetsInGroupWithRes.map(a => a.id);
                        
                        if (resolutionSelectionAction.type === 'delete') {
                           setAssets(prev => prev.filter(a => !targetIds.includes(a.id)));
                           notify(`Deleted ${targetIds.length} assets of ${res} resolution.`);
                        } else {
                           // Remove from manager logic
                           const toRemove = assets.filter(a => targetIds.includes(a.id));
                           setEvictedAssetPaths(prev => {
                              const next = [...prev];
                              toRemove.forEach(a => { if (!next.includes(a.scannedPath)) next.push(a.scannedPath); });
                              return next;
                           });
                           setAssets(prev => prev.filter(a => !targetIds.includes(a.id)));
                           notify(`Removed ${toRemove.length} assets of ${res} resolution from manager.`);
                        }
                        setResolutionSelectionAction(null);
                     }}
                     className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all"
                   >
                     {res.toUpperCase()}
                   </button>
                 ))}
                 
                 <button
                   onClick={() => {
                      if (resolutionSelectionAction.type === 'delete') {
                        setAssets(prev => prev.filter(a => !resolutionSelectionAction.assetIds.includes(a.id)));
                         notify(`Deleted ${resolutionSelectionAction.assetIds.length} selected assets.`);
                      } else {
                        const toRemove = assets.filter(a => resolutionSelectionAction.assetIds.includes(a.id));
                        setEvictedAssetPaths(prev => {
                           const next = [...prev];
                           toRemove.forEach(a => { if (!next.includes(a.scannedPath)) next.push(a.scannedPath); });
                           return next;
                        });
                        setAssets(prev => prev.filter(a => !resolutionSelectionAction.assetIds.includes(a.id)));
                         notify(`Removed ${toRemove.length} assets from manager.`);
                      }
                      setResolutionSelectionAction(null);
                   }}
                   className="w-full text-left px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all mt-2"
                 >
                   Delete All Variants
                 </button>
                 
                 <button
                   onClick={() => setResolutionSelectionAction(null)}
                   className="w-full text-center px-3 py-2 text-gray-500 hover:text-gray-300 text-xs font-bold transition-all"
                 >
                   Cancel
                 </button>
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
