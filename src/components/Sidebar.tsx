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
  ChevronRight
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
}

const iconMap: Record<string, React.ComponentType<any>> = {
  FolderArchive: Library,
  Box: Box,
  Flower: Leaf,
  Layers: Layers,
  Grid: LayoutGrid,
  Star: Star,
};

export default function Sidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategory,
}: SidebarProps) {
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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

  // Static/Protected categories that cannot be renamed, deleted, or moved
  const isProtected = (id: string) => {
    return ['cat-all', 'cat-3d', 'cat-plants', 'cat-surfaces', 'cat-atlases', 'cat-favorites'].includes(id);
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

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/5" id="sidebar-categories">
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

          <div className="space-y-0.5" id="categories-list-container">
            {categories.map((cat, index) => {
              const Icon = iconMap[cat.icon || ''] || Tag;
              const isActive = activeCategoryId === cat.id;
              const isEdit = editingCatId === cat.id;
              const protect = isProtected(cat.id);

              return (
                <motion.div
                  layoutId={`cat-item-${cat.id}`}
                  key={cat.id}
                  className={`group relative flex items-center justify-between rounded px-2 py-1.5 transition-all text-xs border ${
                    isActive
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                  id={`category-${cat.id}`}
                >
                  {/* Category Link or Inline Edit */}
                  <div
                    className="flex-1 flex items-center gap-2 cursor-pointer select-none min-w-0"
                    onClick={() => !isEdit && onSelectCategory(cat.id)}
                  >
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
                      <span className="font-medium truncate">{cat.name}</span>
                    )}
                  </div>

                  {/* Actions (Only visible for custom, non-protected categories on hover) */}
                  {!protect && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1.5 transition-opacity shrink-0 bg-[#161616] py-0.5 px-0.5 rounded border border-white/5">
                      {isEdit ? (
                        <>
                          <button
                            onClick={() => saveEdit(cat.id)}
                            className="p-0.5 hover:text-emerald-400 text-gray-500"
                            title="Save"
                            id={`save-cat-edit-${cat.id}`}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-0.5 hover:text-rose-400 text-gray-500"
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
                            className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20 disabled:hover:text-gray-600"
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
                            className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20 disabled:hover:text-gray-600"
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
                            className="p-0.5 hover:text-blue-400 text-gray-500"
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
                            className="p-0.5 hover:text-rose-400 text-gray-500"
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/5 bg-[#0F0F0F] text-center shrink-0" id="sidebar-footer">
        <p className="text-[9px] font-mono text-gray-500 truncate">
          Double-click cards to quick-zip
        </p>
      </div>
    </div>
  );
}
