import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft, Search, Star, Folder, Box, FolderOpen, LayoutGrid, List, FileArchive, File, FileText } from 'lucide-react';
import { Asset } from '../types';

interface ExplorerModalProps {
  asset: Asset;
  onClose: () => void;
  formatSize: (bytes: number) => string;
}

export default function ExplorerModal({ asset, onClose, formatSize }: ExplorerModalProps) {
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerViewMode, setExplorerViewMode] = useState<'grid' | 'list'>('grid');
  const [currentSubFolder, setCurrentSubFolder] = useState<string | null>(null);
  const [selectedExplorerFile, setSelectedExplorerFile] = useState<any | null>(null);

  const getExplorerItems = () => {
    let items = [];
    const id = asset.name;
    const format = asset.meshStats?.format || 'fbx';

    const getImgUrl = () => asset.originalUrl || asset.thumbnailUrl;

    if (asset.type === '2d') {
      items = [
        {
          name: `${id}_Thumb.jpg`,
          type: 'image',
          size: asset.size ? formatSize(asset.size) : '1.1 MB',
          parent: null,
          url: getImgUrl(),
        }
      ];
    } else {
      items = [
        {
          name: `Render_Preview.png`,
          type: 'image',
          size: '1.2 MB',
          parent: null,
          url: getImgUrl(),
        },
        {
          name: `Render_Preview_Retina.png`,
          type: 'image',
          size: '3.4 MB',
          parent: null,
          url: getImgUrl(),
        },
        {
          name: `Render_Preview_Retina_sp.jpg`,
          type: 'image',
          size: '619 KB',
          parent: null,
          url: getImgUrl(),
        }
      ];

      const previewItems = [
        {
          name: `${id}_Thumb_HighPoly.png`,
          type: 'image',
          size: '526 KB',
          parent: 'previews',
          url: getImgUrl(),
        },
        {
          name: `${id}_Thumb_HighPoly_Retina.png`,
          type: 'image',
          size: '1.9 MB',
          parent: 'previews',
          url: getImgUrl(),
        }
      ];

      const textureItems = asset.textures.map(tex => ({
        name: tex.name,
        type: 'image',
        size: tex.size,
        parent: 'Textures',
        resolution: tex.resolution,
        textureType: tex.type,
        url: getImgUrl(),
      }));

      const geometryItems = asset.meshStats ? [
        {
          name: `${id}_High.${format.toLowerCase()}`,
          type: 'model',
          size: '45.2 MB',
          parent: 'Geometry',
        },
        {
          name: `${id}_LOD0.${format.toLowerCase()}`,
          type: 'model',
          size: '12.1 MB',
          parent: 'Geometry',
        },
        {
          name: `${id}_LOD1.${format.toLowerCase()}`,
          type: 'model',
          size: '3.5 MB',
          parent: 'Geometry',
        },
        {
          name: `${id}_LOD2.${format.toLowerCase()}`,
          type: 'model',
          size: '800 KB',
          parent: 'Geometry',
        }
      ] : [];

      if (!currentSubFolder) {
        items.push(...[
          { name: 'previews', type: 'folder', size: '--', parent: null },
          { name: 'Textures', type: 'folder', size: '--', parent: null }
        ]);
        if (asset.meshStats) {
          items.push({ name: 'Geometry', type: 'folder', size: '--', parent: null });
        }
        if (asset.isZipped) {
          items.push({ name: `${asset.name}_archive.zip`, type: 'archive', size: formatSize(asset.size), parent: null });
        } else {
          items.push({ name: `${asset.name}_meta.json`, type: 'text', size: '2 KB', parent: null });
        }
      } else {
        if (currentSubFolder === 'previews') items = previewItems;
        else if (currentSubFolder === 'Textures') items = textureItems;
        else if (currentSubFolder === 'Geometry') items = geometryItems;
      }
    }

    if (explorerSearch) {
      items = items.filter(i => i.name.toLowerCase().includes(explorerSearch.toLowerCase()));
    }

    return items;
  };

  const currentItems = getExplorerItems();

  const handleExplorerClick = (item: any) => {
    if (item.type === 'folder') {
      setCurrentSubFolder(item.name);
      setSelectedExplorerFile(null);
    } else {
      setSelectedExplorerFile(item);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-8 h-8 text-blue-400 mb-2" />;
      case 'image': return <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 mx-auto"><File className="w-4 h-4" /></div>;
      case 'model': return <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 mx-auto"><Box className="w-4 h-4" /></div>;
      case 'archive': return <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 mx-auto"><FileArchive className="w-4 h-4" /></div>;
      case 'text': return <div className="w-8 h-8 rounded bg-gray-500/20 text-gray-400 flex items-center justify-center mb-2 mx-auto"><FileText className="w-4 h-4" /></div>;
      default: return <File className="w-8 h-8 text-gray-400 mb-2" />;
    }
  };

  const getListFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'image': return <File className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'model': return <Box className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'archive': return <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'text': return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
      default: return <File className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-md" id="virtual-explorer-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f0f10] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[550px] font-mono text-xs text-gray-300 relative"
        id="virtual-explorer-window"
        onClick={(e) => e.stopPropagation()}
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
            onClick={onClose}
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

          {/* Main View Area */}
          <div className="flex-1 flex flex-col bg-[#0a0a0b] min-w-0">
            {/* View controls */}
            <div className="flex items-center justify-between p-2 border-b border-white/5 text-[10px] bg-black/20 select-none">
              <div className="text-gray-500 font-bold">
                {currentItems.length} items
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded border border-white/10 p-0.5">
                <button
                  onClick={() => setExplorerViewMode('grid')}
                  className={`p-1 rounded transition-colors ${explorerViewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setExplorerViewMode('list')}
                  className={`p-1 rounded transition-colors ${explorerViewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="List View"
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
              {explorerViewMode === 'grid' ? (
                <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
                  {currentItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleExplorerClick(item)}
                      onDoubleClick={() => handleExplorerClick(item)}
                      className={`flex flex-col items-center p-3 rounded-xl border border-transparent transition-all cursor-pointer text-center group ${
                        selectedExplorerFile === item ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'hover:bg-white/5 hover:border-white/5'
                      }`}
                    >
                      {item.type === 'image' && item.url ? (
                        <div className="w-12 h-12 rounded bg-black border border-white/10 mb-2 overflow-hidden flex items-center justify-center">
                          <img src={item.url} alt={item.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-cover" />
                        </div>
                      ) : (
                        getFileIcon(item.type)
                      )}
                      <span className={`text-[10px] font-medium break-all line-clamp-2 w-full ${selectedExplorerFile === item ? 'text-blue-300' : 'text-gray-300 group-hover:text-white'}`}>
                        {item.name}
                      </span>
                      {item.type !== 'folder' && (
                        <span className="text-[9px] text-gray-500 mt-0.5">{item.size}</span>
                      )}
                    </div>
                  ))}
                  {currentItems.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                      <span>This folder is empty.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center px-3 py-1.5 border-b border-white/5 text-[9px] text-gray-500 font-bold uppercase tracking-wider select-none mb-2">
                    <div className="flex-1">Name</div>
                    <div className="w-24 text-right">Size</div>
                    <div className="w-24 text-right">Kind</div>
                  </div>
                  {currentItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleExplorerClick(item)}
                      onDoubleClick={() => handleExplorerClick(item)}
                      className={`flex items-center px-3 py-2 rounded-lg border border-transparent transition-colors cursor-pointer group ${
                        selectedExplorerFile === item ? 'bg-blue-600/20 border-blue-500/30' : 'hover:bg-white/5 border-b border-white/5 rounded-none'
                      }`}
                    >
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        {getListFileIcon(item.type)}
                        <span className={`text-[10px] font-medium truncate ${selectedExplorerFile === item ? 'text-blue-300' : 'text-gray-300 group-hover:text-white'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="w-24 text-right text-[10px] text-gray-500 font-mono">
                        {item.size}
                      </div>
                      <div className="w-24 text-right text-[10px] text-gray-500 capitalize">
                        {item.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Details Preview Sidebar (Right) */}
          {selectedExplorerFile && (
            <div className="w-64 bg-[#121213] border-l border-white/5 flex flex-col overflow-hidden shrink-0">
              <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col items-center text-center">
                {selectedExplorerFile.type === 'image' && selectedExplorerFile.url ? (
                  <div className="w-32 h-32 rounded-lg bg-black border border-white/10 mb-4 overflow-hidden flex items-center justify-center shadow-lg shadow-black/40">
                    <img src={selectedExplorerFile.url} alt={selectedExplorerFile.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 mb-4 flex items-center justify-center opacity-50">
                    {getFileIcon(selectedExplorerFile.type)}
                  </div>
                )}
                <h4 className="text-[11px] font-bold text-white break-all mb-1">{selectedExplorerFile.name}</h4>
                <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-gray-400 capitalize">{selectedExplorerFile.type} File</span>
              </div>
              
              <div className="p-4 space-y-4 text-[10px] flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block">Size</span>
                  <span className="text-white font-mono">{selectedExplorerFile.size}</span>
                </div>
                {selectedExplorerFile.resolution && (
                  <div className="space-y-1">
                    <span className="text-gray-500 font-bold uppercase tracking-wider block">Dimensions</span>
                    <span className="text-white font-mono">{selectedExplorerFile.resolution}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block">Location</span>
                  <span className="text-blue-400 font-mono break-all">{asset.scannedPath}/{currentSubFolder ? currentSubFolder + '/' : ''}</span>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/5 bg-black/20">
                <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[10px] font-bold">
                  Open File
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
