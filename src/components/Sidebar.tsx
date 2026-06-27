import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Library,
  Box,
  Leaf,
  Layers,
  LayoutGrid,
  Star,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Folder,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Package,
  Flame,
  Trees,
  Compass,
  Palette,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { Category } from '../types';

interface SidebarProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onCreateCategory: (name: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (id: string, direction: 'up' | 'down') => void;
  libraryMode: '3d' | '2d' | 'anim';
  onLibraryModeChange: (mode: '3d' | '2d' | 'anim') => void;
  moodboards: string[];
  onCreateMoodboard: (name: string) => void;
  onDeleteMoodboard: (name: string) => void;
  selectedColorFilter: string | null;
  onSelectColorFilter: (color: string | null) => void;
}

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

export default function Sidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategory,
  libraryMode,
  onLibraryModeChange,
  moodboards,
  onCreateMoodboard,
  onDeleteMoodboard,
  selectedColorFilter,
  onSelectColorFilter,
}: SidebarProps) {
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMoodboardName, setNewMoodboardName] = useState('');
  const [showMoodboardAdd, setShowMoodboardAdd] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    return {
      'cat-megascans': true,
    };
  });

  // Width and Collapse states
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('megascan_sidebar_width');
    return saved ? parseInt(saved, 10) : 224; // default 224px (w-56 equivalent)
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('megascan_sidebar_collapsed');
    return saved === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('megascan_sidebar_collapsed', String(nextState));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Constraint sidebar width between 160px and 400px
      const newWidth = Math.max(160, Math.min(400, startWidth + deltaX));
      setWidth(newWidth);
      localStorage.setItem('megascan_sidebar_width', String(newWidth));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onCreateCategory(newCatName.trim());
      setNewCatName('');
      setShowAddForm(false);
    }
  };

  const startEditing = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingName(cat.name);
  };

  const saveEdit = (id: string) => {
    if (editingName.trim()) {
      onRenameCategory(id, editingName.trim());
      setEditingCatId(null);
    }
  };

  const toggleCat = (id: string, siblingIds: string[] = []) => {
    setExpandedCategories(prev => {
      const isExpanding = !prev[id];
      const next = { ...prev };
      
      if (isExpanding) {
        // Collapse siblings
        siblingIds.forEach(siblingId => {
          if (siblingId !== id) {
            next[siblingId] = false;
          }
        });
      }
      
      next[id] = isExpanding;
      return next;
    });
  };

  // Helper component for recursive subcategories rendering
  const RecursiveSubcategoryList = ({ subcategories, parentId, depth = 1 }: { subcategories: any[], parentId: string, depth?: number }) => {
    const siblingIds = subcategories.map(s => s.id);
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={`pl-${Math.min(depth * 3 + 1, 12)} overflow-hidden border-l border-white/5 ml-${depth === 1 ? '3.5' : '1.5'} space-y-0.5 mt-0.5`}
      >
        {subcategories.map((sub: any) => {
          const isSubActive = activeCategoryId === sub.id;
          const isExpanded = !!expandedCategories[sub.id];
          const hasChildren = sub.subcategories && sub.subcategories.length > 0;
          return (
            <div key={sub.id} className="w-full">
              <div
                onClick={() => {
                  onSelectCategory(sub.id);
                  if (hasChildren) toggleCat(sub.id, siblingIds);
                }}
                className={`w-full flex items-center justify-between rounded px-2 py-1 text-left text-[11px] border transition-all cursor-pointer ${
                  isSubActive
                    ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 font-bold shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCat(sub.id, siblingIds);
                      }}
                      className="p-0.5 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                    </button>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0 mx-1" />
                  )}
                  <span className="truncate">{sub.name}</span>
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {hasChildren && isExpanded && (
                  <RecursiveSubcategoryList subcategories={sub.subcategories} parentId={sub.id} depth={depth + 1} />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    );
  };

  // Static/Protected categories that cannot be renamed, deleted, or moved
  const isProtected = (id: string) => {
    return ['cat-all', 'cat-favorites', 'cat-megascans'].includes(id);
  };

  // ---------------------------------------------------------------------------
  // Collapsed Sidebar (Slim Icon Rail)
  // ---------------------------------------------------------------------------
  if (isCollapsed) {
    return (
      <div 
        className="w-12 border-r border-white/5 bg-[#111111] flex flex-col items-center h-full select-none shrink-0" 
        id="sidebar-container-collapsed"
      >
        {/* Header Expand Button */}
        <div className="p-3 border-b border-white/5 flex items-center justify-center w-full shrink-0" id="sidebar-header-collapsed">
          <button
            onClick={toggleCollapse}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Expand Sidebar"
            id="expand-sidebar-btn"
          >
            <ChevronRight className="w-4 h-4 animate-pulse" />
          </button>
        </div>

        {/* Categories List (Icons Only) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3.5 w-full flex flex-col items-center scrollbar-none" id="sidebar-categories-collapsed">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || ''] || Tag;
            const isActive = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`p-2 rounded transition-all border shrink-0 flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title={cat.name}
                id={`category-collapsed-${cat.id}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Minimal Footer */}
        <div className="p-2 border-t border-white/5 bg-[#0F0F0F] text-center w-full shrink-0" id="sidebar-footer-collapsed">
          <span className="text-[7px] font-mono text-gray-600">ZIP</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Expanded Sidebar (Resizable)
  // ---------------------------------------------------------------------------
  const colorSwatches = [
    { label: 'Crimson', value: '#EF4444' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Gray', value: '#6B7280' },
    { label: 'White', value: '#F3F4F6' },
    { label: 'Dark', value: '#1F2937' },
  ];

  const handleCreateMoodboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMoodboardName.trim()) {
      onCreateMoodboard(newMoodboardName.trim());
      setNewMoodboardName('');
      setShowMoodboardAdd(false);
    }
  };

  return (
    <div 
      className="border-r border-white/5 bg-[#111111] flex flex-col h-full select-none relative shrink-0" 
      style={{ width: `${width}px` }}
      id="sidebar-container"
    >
      {/* Resizer Handle */}
      <div
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-all z-20"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0" id="sidebar-header">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-blue-600/15 rounded text-blue-400 border border-blue-500/20 shrink-0">
            <Library className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-sans font-bold tracking-tight text-white text-sm leading-none truncate">Megascan Hub</h1>
            <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 truncate">Asset Catalog</p>
          </div>
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0 ml-1"
          title="Collapse Sidebar"
          id="collapse-sidebar-btn"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D vs 2D vs Unreal Animations Library Switcher */}
      <div className="px-3 py-2 border-b border-white/5 bg-[#0F0F0F]/60 shrink-0" id="library-mode-switcher">
        <div className="bg-[#18181B] p-1 rounded-lg flex items-center gap-1 border border-white/5">
          <button
            onClick={() => {
              onLibraryModeChange('3d');
              onSelectCategory('cat-all');
            }}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-bold tracking-tight uppercase transition-all duration-150 cursor-pointer ${
              libraryMode === '3d'
                ? 'bg-blue-600 text-white shadow-md font-extrabold shadow-blue-500/15'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            id="lib-mode-3d-btn"
            type="button"
          >
            <Box className="w-3 h-3 shrink-0" />
            <span>3D</span>
          </button>
          <button
            onClick={() => {
              onLibraryModeChange('2d');
              onSelectCategory('cat-all');
              onSelectColorFilter(null);
            }}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-bold tracking-tight uppercase transition-all duration-150 cursor-pointer ${
              libraryMode === '2d'
                ? 'bg-blue-600 text-white shadow-md font-extrabold shadow-blue-500/15'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            id="lib-mode-2d-btn"
            type="button"
          >
            <ImageIcon className="w-3 h-3 shrink-0" />
            <span>2D</span>
          </button>
          <button
            onClick={() => {
              onLibraryModeChange('anim');
              onSelectCategory('cat-all');
              onSelectColorFilter(null);
            }}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-bold tracking-tight uppercase transition-all duration-150 cursor-pointer ${
              libraryMode === 'anim'
                ? 'bg-blue-600 text-white shadow-md font-extrabold shadow-blue-500/15'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            id="lib-mode-anim-btn"
            type="button"
          >
            <Compass className="w-3 h-3 shrink-0" />
            <span>Anims</span>
          </button>
        </div>
      </div>

      {/* Categories / Filters List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-white/5" id="sidebar-categories">
        {libraryMode === '3d' ? (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest">Library</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-white/5 transition-colors"
                title="Add Category"
                id="add-category-btn"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Category Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleCreate}
                  className="px-2 mb-3 overflow-hidden"
                >
                  <div className="flex gap-1.5 items-center bg-white/5 border border-white/10 rounded p-1">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="New category..."
                      className="flex-1 bg-transparent text-xs text-white border-none outline-none focus:ring-0 placeholder:text-gray-600 px-1"
                      autoFocus
                      id="new-category-input"
                    />
                    <button
                      type="submit"
                      className="p-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                      id="submit-category-btn"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      id="cancel-category-btn"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-1" id="categories-list-container">
              {categories.map((cat, index) => {
                const Icon = iconMap[cat.icon || ''] || Tag;
                const isActive = activeCategoryId === cat.id;
                const isEdit = editingCatId === cat.id;
                const protect = isProtected(cat.id);
                const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
                const isExpanded = expandedCategories[cat.id];

                return (
                  <div key={cat.id} className="space-y-0.5">
                    <motion.div
                      layoutId={`cat-item-${cat.id}`}
                      className={`group relative flex items-center justify-between rounded px-2 py-1.5 transition-all text-xs border ${
                        isActive
                          ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                      id={`category-${cat.id}`}
                    >
                      {/* Category Link or Inline Edit */}
                      <div
                        className="flex-1 flex items-center gap-1.5 cursor-pointer select-none min-w-0"
                        onClick={() => {
                          if (!isEdit) {
                            onSelectCategory(cat.id);
                            if (hasSubcategories) {
                              setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }));
                            }
                          }
                        }}
                      >
                        {/* Arrow before category if there is subcategories */}
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          {hasSubcategories ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const topLevelIds = categories.map(c => c.id);
                                toggleCat(cat.id, topLevelIds);
                              }}
                              className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          ) : null}
                        </div>

                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
                        
                        {isEdit ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(cat.id);
                              if (e.key === 'Escape') setEditingCatId(null);
                            }}
                            className="bg-black/60 border border-white/15 rounded px-1 py-0.5 text-[11px] text-white outline-none w-full focus:border-blue-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            id={`edit-cat-name-${cat.id}`}
                          />
                        ) : (
                          <span className="font-medium truncate" onClick={() => {
                             if (!isEdit) {
                               onSelectCategory(cat.id);
                               if (hasSubcategories) {
                                 const topLevelIds = categories.map(c => c.id);
                                 toggleCat(cat.id, topLevelIds);
                               }
                             }
                          }}>{cat.name}</span>
                        )}
                      </div>

                      {/* Actions (Only visible for custom, non-protected categories on hover) */}
                      {!protect && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1.5 transition-opacity shrink-0 bg-[#161616] py-0.5 px-0.5 rounded border border-white/5">
                          {isEdit ? (
                            <>
                              <button
                                onClick={() => saveEdit(cat.id)}
                                className="p-0.5 hover:text-emerald-400 text-gray-500 cursor-pointer"
                                title="Save"
                                id={`save-cat-edit-${cat.id}`}
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="p-0.5 hover:text-rose-400 text-gray-500 cursor-pointer"
                                title="Cancel"
                                id={`cancel-cat-edit-${cat.id}`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Reordering */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReorderCategory(cat.id, 'up');
                                }}
                                disabled={index === 6} // First custom item (0-5 are protected default categories)
                                className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20 disabled:hover:text-gray-600 cursor-pointer"
                                title="Move Up"
                                id={`move-up-cat-${cat.id}`}
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReorderCategory(cat.id, 'down');
                                }}
                                disabled={index === categories.length - 1}
                                className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20 disabled:hover:text-gray-600 cursor-pointer"
                                title="Move Down"
                                id={`move-down-cat-${cat.id}`}
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              {/* Editing */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(cat);
                                }}
                                className="p-0.5 hover:text-blue-400 text-gray-500 cursor-pointer"
                                title="Rename"
                                id={`edit-cat-btn-${cat.id}`}
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              {/* Deleting */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteCategory(cat.id);
                                }}
                                className="p-0.5 hover:text-rose-400 text-gray-500 cursor-pointer"
                                title="Delete"
                                id={`delete-cat-btn-${cat.id}`}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </motion.div>

                    {/* Render Subcategories list */}
                    <AnimatePresence initial={false}>
                      {hasSubcategories && isExpanded && (
                        <RecursiveSubcategoryList subcategories={cat.subcategories!} parentId={cat.id} depth={1} />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ) : libraryMode === 'anim' ? (
          <div className="space-y-5">
            {/* 1. Unreal Animations Filters */}
            <div className="space-y-1">
              <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 block mb-2 font-mono">Unreal Animations</span>
              
              <button
                onClick={() => onSelectCategory('cat-all')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-all'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>All Animations</span>
              </button>

              <button
                onClick={() => onSelectCategory('cat-favorites')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-favorites'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span>Favorites</span>
              </button>
            </div>

            {/* 2. Motion Categories */}
            <div className="space-y-1">
              <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 block mb-2 font-mono">Motion Category</span>
              
              {[
                { label: 'Locomotion', value: 'cat-anim-locomotion' },
                { label: 'Combat', value: 'cat-anim-combat' },
                { label: 'Movement', value: 'cat-anim-movement' },
                { label: 'Idle', value: 'cat-anim-idle' },
                { label: 'Emotes', value: 'cat-anim-emotes' },
                { label: 'Evade/Roll', value: 'cat-anim-evade' }
              ].map((animCat) => (
                <button
                  key={animCat.value}
                  onClick={() => onSelectCategory(animCat.value)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                    activeCategoryId === animCat.value
                      ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                  type="button"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>{animCat.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. 2D Standard Filters */}
            <div className="space-y-1">
              <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 block mb-2">Creative Assets</span>
              
              <button
                onClick={() => onSelectCategory('cat-all')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-all'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>All 2D Assets</span>
              </button>

              <button
                onClick={() => onSelectCategory('cat-favorites')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-favorites'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span>Favorites</span>
              </button>
            </div>

            {/* 2. Orientation Filters */}
            <div className="space-y-1">
              <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 block mb-2">Orientation</span>
              <button
                onClick={() => onSelectCategory('cat-2d-landscape')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-2d-landscape'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <LayoutGrid className="w-3.5 h-3.5 rotate-90" />
                <span>Landscape (Wide)</span>
              </button>

              <button
                onClick={() => onSelectCategory('cat-2d-portrait')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-2d-portrait'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Portrait (Tall)</span>
              </button>

              <button
                onClick={() => onSelectCategory('cat-2d-square')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                  activeCategoryId === 'cat-2d-square'
                    ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                type="button"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Square (1:1)</span>
              </button>
            </div>

            {/* 3. Color Swatches Filter */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest">Color Matcher</span>
                {selectedColorFilter && (
                  <button
                    onClick={() => onSelectColorFilter(null)}
                    className="text-[9px] font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase shrink-0"
                    type="button"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 px-1 py-1 bg-white/[0.02] border border-white/5 rounded-xl">
                {colorSwatches.map((sw) => {
                  const isColorActive = selectedColorFilter === sw.value;
                  return (
                    <button
                      key={sw.value}
                      onClick={() => onSelectColorFilter(isColorActive ? null : sw.value)}
                      style={{ backgroundColor: sw.value }}
                      className={`w-full aspect-square rounded-lg border-2 relative transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
                        isColorActive
                          ? 'border-white ring-2 ring-blue-500 scale-105 shadow-md'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      title={`${sw.label} palette lookup`}
                      type="button"
                    >
                      {isColorActive && (
                        <Check className={`w-3.5 h-3.5 ${sw.value === '#F3F4F6' ? 'text-black' : 'text-white'} stroke-[3.5]`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Moodboards (Virtual Collections) */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-sans text-[10px] font-bold text-gray-500 uppercase tracking-widest">Moodboards</span>
                <button
                  onClick={() => setShowMoodboardAdd(!showMoodboardAdd)}
                  className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-white/5 transition-colors"
                  title="Create Moodboard"
                  id="add-moodboard-btn"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {showMoodboardAdd && (
                <form onSubmit={handleCreateMoodboardSubmit} className="px-2 mb-2 overflow-hidden">
                  <div className="flex gap-1.5 items-center bg-white/5 border border-white/10 rounded p-1">
                    <input
                      type="text"
                      value={newMoodboardName}
                      onChange={(e) => setNewMoodboardName(e.target.value)}
                      placeholder="Moodboard name..."
                      className="flex-1 bg-transparent text-xs text-white border-none outline-none focus:ring-0 placeholder:text-gray-600 px-1"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-1">
                {moodboards.map((mb) => {
                  const id = `moodboard-${mb}`;
                  const isMBActive = activeCategoryId === id;
                  return (
                    <div
                      key={mb}
                      className={`group relative flex items-center justify-between rounded px-2.5 py-1.5 text-xs border transition-all ${
                        isMBActive
                          ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 font-bold'
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div
                        onClick={() => onSelectCategory(id)}
                        className="flex-1 flex items-center gap-1.5 cursor-pointer truncate"
                      >
                        <Compass className="w-3.5 h-3.5 shrink-0 text-blue-500/60" />
                        <span className="truncate">{mb}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMoodboard(mb);
                          if (isMBActive) onSelectCategory('cat-all');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-rose-400 rounded transition-opacity cursor-pointer shrink-0"
                        title="Delete virtual moodboard"
                        type="button"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                {moodboards.length === 0 && (
                  <span className="block px-2 py-3 text-[10px] text-gray-600 italic">No moodboards created yet.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/5 bg-[#0F0F0F] text-center shrink-0" id="sidebar-footer">
        <p className="text-[9px] font-mono text-gray-500 truncate">
          {libraryMode === '3d' ? 'Double-click cards to quick-zip' : 'Drag assets directly into apps'}
        </p>
      </div>
    </div>
  );
}
