import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderSearch,
  FolderPlus,
  Play,
  Loader2,
  CheckCircle,
  FileText,
  AlertCircle,
  FolderOpen,
  Plus,
  Compass,
  FileArchive,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { Asset, AssetType } from '../types';
import { VIRTUAL_DOWNLOADS_ASSETS, MEGASCANS_SUBCATEGORIES } from '../data/mockAssets';
import { mapCategoryPathToIds } from '../utils';

const VIRTUAL_2D_ASSETS: Asset[] = [
  {
    id: 'sim-2d-cyberpunk',
    name: 'Neon Cyberpunk Alleyway',
    type: '2d',
    size: 2516582,
    isZipped: false,
    resolution: '3840x2160',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&h=600&q=80',
    tags: ['neon', 'cyberpunk', 'alley', 'urban', 'concept-art', 'night', 'futuristic'],
    categories: ['cat-megascans'],
    scannedPath: '/Local/Scanned2D/neon_cyberpunk_alleyway.png',
    dateAdded: new Date().toISOString(),
    description: 'High resolution 2D concept art of a neon-lit cyberpunk city backalley.',
    colors: ['#0f051d', '#d11141', '#00b159', '#ffc425', '#3498db'],
    orientation: 'landscape',
    aspectRatio: '16:9',
    width: 3840,
    height: 2160,
    textures: [
      {
        name: 'neon_cyberpunk_alleyway.png',
        type: '2D Source File',
        resolution: '3840x2160',
        size: '2.4 MB',
        rawSize: 2516582
      }
    ],
    moodboards: []
  },
  {
    id: 'sim-2d-slate',
    name: 'Slate Cliff Face Texture',
    type: '2d',
    size: 1887436,
    isZipped: false,
    resolution: '4096x4096',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&h=600&q=80',
    tags: ['slate', 'cliff', 'rock', 'texture', 'stone', 'nature', 'albedo'],
    categories: ['cat-megascans'],
    scannedPath: '/Local/Scanned2D/slate_cliff_face_albedo.jpg',
    dateAdded: new Date().toISOString(),
    description: 'Beautiful tileable slate rock surface image suited for material overlay.',
    colors: ['#333333', '#555555', '#777777', '#222222', '#444444'],
    orientation: 'square',
    aspectRatio: '1:1',
    width: 4096,
    height: 4096,
    textures: [
      {
        name: 'slate_cliff_face_albedo.jpg',
        type: '2D Source File',
        resolution: '4096x4096',
        size: '1.8 MB',
        rawSize: 1887436
      }
    ],
    moodboards: []
  },
  {
    id: 'sim-2d-forest',
    name: 'Emerald Forest Watercolor Concept',
    type: '2d',
    size: 967680,
    isZipped: false,
    resolution: '2048x3072',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&h=900&q=80',
    tags: ['forest', 'emerald', 'watercolor', 'painting', 'nature', 'landscape', 'concept-art'],
    categories: ['cat-megascans'],
    scannedPath: '/Local/Scanned2D/emerald_forest_watercolor.webp',
    dateAdded: new Date().toISOString(),
    description: 'Watercolor study of an ancient mystical emerald forest, vertical layout.',
    colors: ['#052c1e', '#134e3a', '#2d7458', '#88bda4', '#d4ece0'],
    orientation: 'portrait',
    aspectRatio: '2:3',
    width: 2048,
    height: 3072,
    textures: [
      {
        name: 'emerald_forest_watercolor.webp',
        type: '2D Source File',
        resolution: '2048x3072',
        size: '945 KB',
        rawSize: 967680
      }
    ],
    moodboards: []
  },
  {
    id: 'sim-2d-window',
    name: 'Gothic Cathedral Window Overlay',
    type: '2d',
    size: 4299161,
    isZipped: false,
    resolution: '1920x2560',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548625361-155deee223d0?auto=format&fit=crop&w=600&h=800&q=80',
    tags: ['gothic', 'cathedral', 'stained-glass', 'window', 'overlay', 'light', 'architecture'],
    categories: ['cat-megascans'],
    scannedPath: '/Local/Scanned2D/cathedral_stained_glass_window.png',
    dateAdded: new Date().toISOString(),
    description: 'Stained glass window graphic from a classic gothic cathedral, transparent overlay.',
    colors: ['#110c1a', '#e65100', '#ffd54f', '#1e88e5', '#c62828'],
    orientation: 'portrait',
    aspectRatio: '3:4',
    width: 1920,
    height: 2560,
    textures: [
      {
        name: 'cathedral_stained_glass_window.png',
        type: '2D Source File',
        resolution: '1920x2560',
        size: '4.1 MB',
        rawSize: 4299161
      }
    ],
    moodboards: []
  },
  {
    id: 'sim-2d-grunge',
    name: 'Distressed Concrete Grunge Surface',
    type: '2d',
    size: 3355443,
    isZipped: false,
    resolution: '3000x2000',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&h=600&q=80',
    tags: ['concrete', 'grunge', 'distressed', 'surface', 'texture', 'grey', 'urban'],
    categories: ['cat-megascans'],
    scannedPath: '/Local/Scanned2D/distressed_concrete_grunge.jpeg',
    dateAdded: new Date().toISOString(),
    description: 'A heavily distressed concrete wall texture with organic dark damp stains and scratches.',
    colors: ['#2b2b2b', '#636363', '#a8a8a8', '#dddddd', '#1a1a1a'],
    orientation: 'landscape',
    aspectRatio: '3:2',
    width: 3000,
    height: 2000,
    textures: [
      {
        name: 'distressed_concrete_grunge.jpeg',
        type: '2D Source File',
        resolution: '3000x2000',
        size: '3.2 MB',
        rawSize: 3355443
      }
    ],
    moodboards: []
  }
];

interface DirectoryScannerProps {
  libraryAssets: Asset[];
  evictedAssetPaths: string[];
  onImportAssets: (assets: Asset[]) => void;
}

export default function DirectoryScanner({ libraryAssets, evictedAssetPaths = [], onImportAssets }: DirectoryScannerProps) {
  const [scannerType, setScannerType] = useState<'3d' | '2d'>('3d');
  const [scanPath, setScanPath] = useState('/Users/creative/Downloads/Megascans');
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedAssets, setDetectedAssets] = useState<Asset[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [realScanError, setRealScanError] = useState<string | null>(null);
  const [usePythonBackend, setUsePythonBackend] = useState(false);
  const [browserFiles, setBrowserFiles] = useState<FileList | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check if Python FastAPI server is active
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'running') {
          setUsePythonBackend(true);
          console.log('Python backend connected successfully!');
        }
      })
      .catch(() => {
        setUsePythonBackend(false);
      });
  }, []);

  // Filter out assets that are already in the library or flagged as evicted
  const getPendingVirtual2DAssets = () => {
    return VIRTUAL_2D_ASSETS.filter(
      (va) => !libraryAssets.some((la) => la.id === va.id) && !evictedAssetPaths.includes(va.scannedPath)
    );
  };

  const handleSimulated2DScan = async () => {
    const logs = [
      `Initializing standalone image scanner...`,
      `Targeting directory: ${scanPath}`,
      `Searching for 2D creative assets (images, textures, paintings, transparent PNGs, alphas)...`,
    ];

    setScanLogs([...logs]);
    await delay(600);
    setScanProgress(15);

    const pending = getPendingVirtual2DAssets();

    if (pending.length === 0) {
      setScanLogs((prev) => [
        ...prev,
        `Scanning folders...`,
        `No new unimported standalone image assets found in "${scanPath}". All local 2D assets are already synchronized.`,
      ]);
      setScanProgress(100);
      setIsScanning(false);
      setScanComplete(true);
      return;
    }

    for (let i = 0; i < pending.length; i++) {
      const asset = pending[i];
      setScanProgress(20 + i * 16);
      
      const ext = asset.textures[0]?.name.split('.').pop() || 'png';
      setScanLogs((prev) => [
        ...prev,
        `Found standalone image: ${asset.textures[0]?.name}`,
        `  -> File format: ${ext.toUpperCase()}`,
        `  -> Resolution: ${asset.resolution} | Size: ${formatSize(asset.size)}`,
        `  -> Dominant colors: ${asset.colors?.join(', ')}`,
        `  -> Registered asset: "${asset.name}" (${asset.id})`,
      ]);

      setDetectedAssets((prev) => [...prev, asset]);
      await delay(700);
    }

    setScanProgress(90);
    setScanLogs((prev) => [
      ...prev,
      `Analyzing completed. Found ${pending.length} high-fidelity 2D image assets.`,
      `Finalizing registration metadata...`,
    ]);
    await delay(500);

    setScanProgress(100);
    setIsScanning(false);
    setScanComplete(true);
  };

  const executeReal2DFolderScan = async (files: FileList) => {
    setIsScanning(true);
    setScanComplete(false);
    setRealScanError(null);
    setScanLogs([`Starting local image library inspection...`, `Reading files from local directory...`]);

    const fileList = Array.from(files) as any[];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff'];
    const imageFiles = fileList.filter(f => {
      const lowerName = f.name.toLowerCase();
      const isImage = imageExtensions.some(ext => lowerName.endsWith(ext));
      const isHiddenOrTemp = lowerName.startsWith('.') || lowerName.startsWith('~$');
      const isCacheOrThumb = lowerName.includes('cache') || lowerName.includes('preview') || lowerName.includes('thumb');
      return isImage && !isHiddenOrTemp && !isCacheOrThumb;
    });

    if (imageFiles.length === 0) {
      setIsScanning(false);
      setRealScanError('No standalone images found in the selected folder. Ensure the folder has image files (.png, .jpg, .jpeg, .webp, etc.) directly or in subdirectories.');
      setScanLogs(prev => [...prev, `Scan finished. No matching image file extensions found.`]);
      return;
    }

    setScanLogs(prev => [...prev, `Found ${imageFiles.length} standalone images/textures. Resolving dimensions and colors...`]);

    const parsedAssets: Asset[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const percent = Math.round((i / imageFiles.length) * 100);
      setScanProgress(percent);

      const ext = file.name.split('.').pop() || '';
      const baseName = file.name.substring(0, file.name.length - ext.length - 1);
      const cleanName = baseName
        .replace(/[-_]+/g, ' ')
        .trim()
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
         .join(' ');

      const sizeStr = formatSize(file.size);

      let thumb = '';
      let width = 1920;
      let height = 1080;
      let dominantColors: string[] = ['#1e293b', '#334155', '#475569'];

      try {
        thumb = await compressImageFile(file);
        const dims = await new Promise<{ width: number; height: number; colors: string[] }>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 5;
            canvas.height = 5;
            const ctx = canvas.getContext('2d');
            const colors: string[] = [];
            if (ctx) {
               ctx.drawImage(img, 0, 0, 5, 5);
               const data = ctx.getImageData(0, 0, 5, 5).data;
               const hexSet = new Set<string>();
               for (let idx = 0; idx < data.length; idx += 4) {
                 const hex = "#" + ((1 << 24) + (data[idx] << 16) + (data[idx+1] << 8) + data[idx+2]).toString(16).slice(1);
                 hexSet.add(hex);
               }
               colors.push(...Array.from(hexSet).slice(0, 5));
            }
            resolve({ width: img.width, height: img.height, colors: colors.length > 0 ? colors : ['#1e293b', '#334155'] });
          };
          img.onerror = () => {
            resolve({ width: 1920, height: 1080, colors: ['#1e293b', '#334155'] });
          };
          img.src = URL.createObjectURL(file);
        });
        width = dims.width;
        height = dims.height;
        dominantColors = dims.colors;
      } catch (e) {
        console.error('Error resolving image details client-side:', e);
      }

      let orientation: 'landscape' | 'portrait' | 'square' = 'landscape';
      let aspectRatio = '16:9';
      if (width === height) {
        orientation = 'square';
        aspectRatio = '1:1';
      } else if (width > height) {
        orientation = 'landscape';
        const ratio = width / height;
        if (Math.abs(ratio - 1.777) < 0.1) aspectRatio = '16:9';
        else if (Math.abs(ratio - 1.333) < 0.1) aspectRatio = '4:3';
        else if (Math.abs(ratio - 1.5) < 0.1) aspectRatio = '3:2';
        else aspectRatio = `${width}:${height}`;
      } else {
        orientation = 'portrait';
        const ratio = height / width;
        if (Math.abs(ratio - 1.777) < 0.1) aspectRatio = '9:16';
        else if (Math.abs(ratio - 1.333) < 0.1) aspectRatio = '3:4';
        else if (Math.abs(ratio - 1.5) < 0.1) aspectRatio = '2:3';
        else aspectRatio = `${width}:${height}`;
      }

      const assetId = `2d-local-${Math.random().toString(36).substring(2, 8)}`;

      const item: Asset = {
        id: assetId,
        name: cleanName,
        type: '2d',
        size: file.size,
        isZipped: false,
        resolution: `${width}x${height}`,
        thumbnailUrl: thumb || 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=400&h=400&q=80',
        tags: [ext.toLowerCase(), 'standalone', 'local-import', ...cleanName.toLowerCase().split(' ')].filter(t => t.length > 1),
        categories: ['cat-megascans'],
        scannedPath: `/Local/Scanned2D/${file.name}`,
        dateAdded: new Date().toISOString(),
        description: `Local 2D image scanned from browser: ${file.name}. Format: ${ext.toUpperCase()}, size: ${sizeStr}.`,
        colors: dominantColors,
        orientation,
        aspectRatio,
        width,
        height,
        textures: [
          {
            name: file.name,
            type: '2D Source File',
            resolution: `${width}x${height}`,
            size: sizeStr,
            rawSize: file.size
          }
        ],
        moodboards: []
      };

      parsedAssets.push(item);

      if (i % 5 === 0 || i === imageFiles.length - 1) {
        setScanLogs(prev => [...prev, `Processed ${i + 1}/${imageFiles.length} images: ${cleanName} (${ext.toUpperCase()})`]);
      }
    }

    const filteredParsed = parsedAssets.filter(
      (pa) => !evictedAssetPaths.includes(pa.scannedPath)
    );

    setIsScanning(false);
    setScanProgress(100);
    if (filteredParsed.length === 0) {
      setRealScanError('No new 2D images found. All identified image files have been previously marked or processed.');
    } else {
      setDetectedAssets(filteredParsed);
      setScanComplete(true);
      setScanLogs(prev => [
        ...prev,
        `2D Scan completed successfully!`,
        `Discovered ${filteredParsed.length} standalone image assets ready for import.`,
      ]);
    }
  };

  // Filter out assets that are already in the library or flagged as evicted
  const getPendingVirtualAssets = () => {
    return VIRTUAL_DOWNLOADS_ASSETS.filter(
      (va) => !libraryAssets.some((la) => la.id === va.id) && !evictedAssetPaths.includes(va.scannedPath)
    );
  };

  const handleSimulatedScan = async () => {
    const logs = [
      `Initializing file system scanner...`,
      `Opening directory: ${scanPath}`,
      `Searching for Quixel signature patterns (*.json, *_Albedo, *_3d)...`,
    ];

    setScanLogs([...logs]);
    await delay(600);
    setScanProgress(15);

    const pending = getPendingVirtualAssets();

    if (pending.length === 0) {
      setScanLogs((prev) => [
        ...prev,
        `Scanning subfolders...`,
        `No new unimported Megascan assets found in "${scanPath}". All local assets are already synchronized.`,
      ]);
      setScanProgress(100);
      setIsScanning(false);
      setScanComplete(true);
      return;
    }

    // Progressively find assets
    for (let i = 0; i < pending.length; i++) {
      const asset = pending[i];
      setScanProgress(20 + i * 20);
      
      setScanLogs((prev) => [
        ...prev,
        `Found directory: ${asset.scannedPath.split('/').pop()}`,
        `  -> Matching signature: type="${asset.type}", resolution="${asset.resolution}"`,
        `  -> Found textures: [${asset.textures.map(t => t.type).join(', ')}]`,
        asset.meshStats 
          ? `  -> Found geometry: format="${asset.meshStats.format}", triangles=${asset.meshStats.triangles}`
          : `  -> Surface map files verified.`,
        `  -> Asset registered: "${asset.name}" (${asset.id})`,
      ]);

      setDetectedAssets((prev) => [...prev, asset]);
      await delay(800);
    }

    setScanProgress(90);
    setScanLogs((prev) => [
      ...prev,
      `Analyzing completed. Found ${pending.length} new Megascan assets.`,
      `Finalizing registration metadata...`,
    ]);
    await delay(500);

    setScanProgress(100);
    setIsScanning(false);
    setScanComplete(true);
  };

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanComplete(false);
    setDetectedAssets([]);
    setScanLogs([]);
    setScanProgress(0);
    setRealScanError(null);

    if (usePythonBackend) {
      try {
        setScanLogs([`[INFO] Directing scan to local Python API: http://127.0.0.1:8000/api/scan`, `[INFO] Targeting path: ${scanPath}`, `[INFO] Scanner mode: ${scannerType.toUpperCase()}`]);
        const response = await fetch('http://127.0.0.1:8000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: scanPath, scanner_type: scannerType })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to start backend scan.');
        }

        // Poll progress from Python background worker
        const pollInterval = setInterval(async () => {
          try {
            const progRes = await fetch('http://127.0.0.1:8000/api/scan/progress');
            if (!progRes.ok) return;
            const progData = await progRes.json();
            
            setScanProgress(progData.progress);
            if (progData.logs) {
              setScanLogs(progData.logs);
            }
            if (progData.error) {
              setRealScanError(progData.error);
              setIsScanning(false);
              clearInterval(pollInterval);
              return;
            }

            if (!progData.is_scanning) {
              clearInterval(pollInterval);
              setIsScanning(false);
              setScanComplete(true);
              
              // Load the newly scanned assets
              const assetsRes = await fetch('http://127.0.0.1:8000/api/assets');
              if (assetsRes.ok) {
                const assetsData = await assetsRes.json();
                const mappedAssets = assetsData.assets.map((a: any) => ({
                  ...a,
                  categories: mapCategoryPathToIds(a.categoryPaths || [])
                }));
                // Filter to new assets of the active type only
                const newOnly = mappedAssets.filter(
                  (ma: any) => (scannerType === '2d' ? ma.type === '2d' : ma.type !== '2d') &&
                               !libraryAssets.some((la) => la.id === ma.id) &&
                               !evictedAssetPaths.includes(ma.scannedPath)
                );
                setDetectedAssets(newOnly);
              }
            }
          } catch (pollErr: any) {
            console.error('Error polling progress:', pollErr);
          }
        }, 800);
      } catch (err: any) {
        setRealScanError(err.message || 'Error communicating with local Python backend.');
        setIsScanning(false);
      }
    } else {
      if (browserFiles && browserFiles.length > 0) {
        if (scannerType === '2d') {
          await executeReal2DFolderScan(browserFiles);
        } else {
          await executeRealFolderScan(browserFiles);
        }
      } else {
        if (scannerType === '2d') {
          await handleSimulated2DScan();
        } else {
          await handleSimulatedScan();
        }
      }
    }
  };

  const handleImportDetected = () => {
    if (detectedAssets.length > 0) {
      onImportAssets(detectedAssets);
      setDetectedAssets([]);
      setScanComplete(false);
      setScanLogs([]);
    }
  };

  const onBrowserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Extract root folder name
    const firstFile = files[0];
    if (firstFile) {
      const parts = firstFile.webkitRelativePath.split('/');
      const rootFolder = parts[0] || (scannerType === '2d' ? '2D_Assets' : 'Megascans');
      setScanPath(`/Users/user/Downloads/${rootFolder}`);
    }

    setBrowserFiles(files);
    setScanComplete(false);
    setRealScanError(null);
    setScanLogs([`Loaded directory successfully via browser file explorer.`, `Ready to scan local assets in directory.`]);
  };

  // HTML5 Webkit Directory Upload Parser
  const executeRealFolderScan = async (files: FileList) => {
    setIsScanning(true);
    setScanComplete(false);
    setRealScanError(null);
    setScanLogs([`Starting local folder inspection...`, `Reading files from local directory...`]);

    // Parse the files to see if we can find typical textures or folder names
    const fileList = Array.from(files) as any[];
    
    const dirMap: Record<string, File[]> = {};
    const jsonMap: Record<string, any> = {};

    // 1. Identify JSON roots
    for (const file of fileList) {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.json') && !lowerName.includes('package')) {
        const parts = file.webkitRelativePath.split('/');
        parts.pop(); // remove the json file name
        const dirPath = parts.join('/');
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data && (data.semanticTags || data.models || data.pack || data.uasset || data.billboards)) {
             jsonMap[dirPath] = data;
             dirMap[dirPath] = [];
          }
        } catch(e) {}
      }
    }

    // 2. Assign files to their roots
    fileList.forEach(file => {
      const path = file.webkitRelativePath;
      let assigned = false;
      let matchedRoot: string | null = null;
      
      // Find the longest matching root
      for (const root of Object.keys(dirMap)) {
         if (root === '' || path.startsWith(root + '/')) {
            if (matchedRoot === null || root.length >= matchedRoot.length) {
               matchedRoot = root;
            }
         }
      }
      
      if (matchedRoot !== null) {
         dirMap[matchedRoot].push(file);
         assigned = true;
      }
      
      // Fallback for files not in any Megascans JSON root
      if (!assigned) {
         const pathParts = path.split('/');
         if (pathParts.length > 1) {
            // Group by the top-level directory inside the selected folder
            // e.g. SelectedFolder/Asset/file.txt -> group by "Asset"
            const parentDir = pathParts[1] || pathParts[0]; 
            // wait, if path is "SelectedRoot/file.txt", pathParts.length is 2. pathParts[1] is "file.txt" which is wrong.
            // If length > 2, e.g. "SelectedRoot/AssetDir/file.txt", parent is "AssetDir" (pathParts[1]).
            // If they selected the asset dir directly, "AssetDir/file.txt", pathParts is ["AssetDir", "file.txt"], length 2, group by "AssetDir".
            const groupDir = pathParts.length > 2 ? pathParts[1] : pathParts[0];
            if (!dirMap[groupDir]) {
               dirMap[groupDir] = [];
            }
            dirMap[groupDir].push(file);
         }
      }
    });

    setScanLogs(prev => [...prev, `Found ${Object.keys(dirMap).length} parsed subdirectories. Analyzing structures...`]);

    const parsedAssets: Asset[] = [];

    // Loop through directories
    for (const [dirPath, dirFiles] of Object.entries(dirMap)) {
      const dirName = dirPath.split('/').pop() || dirPath;
      const textures: any[] = [];
      let isMegascan = false;
      let hasMesh = false;
      let meshFormat: any = 'FBX';
      let assetType: AssetType = '3d';
      let resolution: '1k' | '2k' | '4k' | '8k' = '2k';

      // Look up our parsed JSON data
      let metaData = jsonMap[dirPath];
      if (!metaData) {
        // Fallback: look for a JSON metadata file if we used fallback grouping
        const jsonFile = dirFiles.find(f => f.name.toLowerCase().endsWith('.json') && !f.name.toLowerCase().includes('package'));
        if (jsonFile) {
          try {
            const jsonText = await jsonFile.text();
            metaData = JSON.parse(jsonText);
          } catch (err) {
            console.error('Error parsing metadata JSON:', err);
          }
        }
      }

      if (metaData && (metaData.semanticTags || metaData.models || metaData.pack || metaData.uasset || metaData.billboards)) {
        isMegascan = true;
        setScanLogs(prev => [...prev, `Found metadata JSON for "${dirName}". Extracting Quixel schema properties...`]);
      }

      // Inspect files in this directory
      dirFiles.forEach(f => {
        const lowerName = f.name.toLowerCase();
        
        // Quixel textures usually end with suffixes like _Albedo, _Normal, _Roughness, _AO, _Displacement, _Opacity
        if (lowerName.includes('albedo') || lowerName.includes('diffuse')) {
          textures.push({ name: f.name, type: 'Albedo', resolution: '2k', size: formatSize(f.size), rawSize: f.size });
          isMegascan = true;
        } else if (lowerName.includes('normal')) {
          textures.push({ name: f.name, type: 'Normal', resolution: '2k', size: formatSize(f.size), rawSize: f.size });
          isMegascan = true;
        } else if (lowerName.includes('roughness') || lowerName.includes('specular')) {
          textures.push({ name: f.name, type: 'Roughness', resolution: '2k', size: formatSize(f.size), rawSize: f.size });
        } else if (lowerName.includes('displacement') || lowerName.includes('height')) {
          textures.push({ name: f.name, type: 'Displacement', resolution: '2k', size: formatSize(f.size), rawSize: f.size });
        } else if (lowerName.includes('ao') || lowerName.includes('ambientocclusion')) {
          textures.push({ name: f.name, type: 'AO', resolution: '2k', size: formatSize(f.size), rawSize: f.size });
        } else if (lowerName.includes('opacity') || lowerName.includes('alpha')) {
          textures.push({ name: f.name, type: 'Opacity', resolution: '2k', size: formatSize(f.size), rawSize: f.size });
        }

        if (lowerName.endsWith('.fbx')) {
          hasMesh = true;
          meshFormat = 'FBX';
        } else if (lowerName.endsWith('.obj')) {
          hasMesh = true;
          meshFormat = 'OBJ';
        }

        // Determine resolution from name
        if (lowerName.includes('1k')) resolution = '1k';
        else if (lowerName.includes('2k')) resolution = '2k';
        else if (lowerName.includes('4k')) resolution = '4k';
        else if (lowerName.includes('8k')) resolution = '8k';
      });

      // If we couldn't determine mesh from files but JSON says there are models, consider it having mesh
      if (metaData?.models?.length > 0 || metaData?.meshes?.length > 0) {
        hasMesh = true;
      }

      if (isMegascan) {

        // Try to figure out asset type from name or files or metadata
        const lowerDir = dirName.toLowerCase();
        const detectedAssetTypeString = metaData?.semanticTags?.asset_type?.toLowerCase() || '';
        if (detectedAssetTypeString.includes('plant') || lowerDir.includes('plant') || lowerDir.includes('grass') || lowerDir.includes('flower') || lowerDir.includes('tree')) {
          assetType = '3dplant';
        } else if (detectedAssetTypeString.includes('surface') || lowerDir.includes('surface') || lowerDir.includes('ground') || lowerDir.includes('soil') || lowerDir.includes('bark')) {
          assetType = 'surface';
        } else if (detectedAssetTypeString.includes('atlas') || lowerDir.includes('atlas')) {
          assetType = 'atlas';
        } else {
          assetType = hasMesh ? '3d' : 'surface';
        }

        // Generate clean display name from metadata or dir name
        let cleanName = metaData?.name || metaData?.semanticTags?.name;
        if (!cleanName) {
          cleanName = dirName
            .replace(/^(3d_rock_|3dplant_|surface_|atlas_|decal_)/i, '')
            .replace(/_[1-8]k.*$/i, '')
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        }

        const totalSize = dirFiles.reduce((sum, file) => sum + file.size, 0);

        // Pre-assigned fallback thumbnail matching asset type
        let thumb = 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=400&h=400&q=80';
        if (assetType === '3dplant') {
          thumb = 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&h=400&q=80';
        } else if (assetType === 'surface') {
          thumb = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&h=400&q=80';
        } else if (assetType === 'atlas') {
          thumb = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&h=400&q=80';
        }

        // Look for a local preview image file: prioritize "preview", then "render", then "thumb", then "icon"
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff'];
        
        const possiblePreviews = dirFiles.filter(f => {
          const lowerName = f.name.toLowerCase();
          return imageExtensions.some(ext => lowerName.endsWith(ext));
        });

        let previewFile = possiblePreviews.find(f => f.name.toLowerCase().includes('preview'));
        if (!previewFile) {
          previewFile = possiblePreviews.find(f => f.name.toLowerCase().includes('render'));
        }
        if (!previewFile) {
          previewFile = possiblePreviews.find(f => f.name.toLowerCase().includes('thumb'));
        }
        if (!previewFile) {
          previewFile = possiblePreviews.find(f => f.name.toLowerCase().includes('icon'));
        }

        // Fallback: If not found, look for ANY image file that does not contain texture keywords
        if (!previewFile) {
          previewFile = possiblePreviews.find(f => {
            const lowerName = f.name.toLowerCase();
            const isTexture = ['albedo', 'diffuse', 'normal', 'roughness', 'specular', 'displacement', 'height', 'ao', 'ambientocclusion', 'opacity', 'alpha', 'cavity'].some(keyword => lowerName.includes(keyword));
            return !isTexture;
          });
        }

        if (previewFile) {
          try {
            thumb = await compressImageFile(previewFile);
          } catch (e) {
            console.error('Error compressing local preview image:', e);
          }
        }

        // Generate ID
        const generatedId = metaData?.id || `local-${dirName.split('_').pop() || Math.random().toString(36).substring(2, 7)}`;

        // Extract metadata tags
        let extractedTags: string[] = [];
        if (metaData?.tags) {
          extractedTags = [...metaData.tags];
        } else if (metaData?.semanticTags?.contains) {
          extractedTags = [...metaData.semanticTags.contains];
        } else {
          extractedTags = dirName.split('_').filter(t => t.length > 2 && !['asset', '3d', '2k', '4k', '8k', '1k'].includes(t));
        }

        const categoryIds: string[] = ['cat-megascans'];
        
        // Helper to normalize names for comparison
        const normalize = (name: string) => name.toLowerCase().replace(/s$/, '').replace(/\s+/g, '-');

        // Recursive function to find category IDs
        const findCategoryIds = (obj: any, available: any[], parentId: string | null = null) => {
          for (const key in obj) {
            const normalizedKey = normalize(key);
            
            // Try to find a matching category
            const match = available.find(c => {
               const normalizedCName = normalize(c.name);
               return normalizedCName === normalizedKey || 
                      (parentId && normalize(parentId + '-' + c.name) === normalize(parentId + '-' + key));
            });

            if (match) {
              categoryIds.push(match.id);
              if (match.subcategories && Object.keys(obj[key]).length > 0) {
                findCategoryIds(obj[key], match.subcategories, match.id);
              }
            } else {
              // If no match found, continue searching in subcategories if possible
              if (available.length > 0) {
                 findCategoryIds(obj[key], available.flatMap(c => c.subcategories || []), parentId);
              }
            }
          }
        };

        if (metaData?.assetCategories) {
          findCategoryIds(metaData.assetCategories, MEGASCANS_SUBCATEGORIES);
        } else if (metaData?.categories && Array.isArray(metaData.categories)) {
          extractedTags = [...extractedTags, ...metaData.categories];
          
          // Basic mapping logic
          if (metaData.categories.includes('3dplant')) {
            categoryIds.push('sub-3d-plants');
            if (metaData.categories.includes('climber')) {
               categoryIds.push('sub-3d-plants-climber');
            }
          }
        }

        // Map resolution
        if (metaData?.semanticTags?.resolution) {
          const resNum = metaData.semanticTags.resolution;
          if (resNum === 8192 || resNum === '8192') resolution = '8k';
          else if (resNum === 4096 || resNum === '4096') resolution = '4k';
          else if (resNum === 2048 || resNum === '2048') resolution = '2k';
          else if (resNum === 1024 || resNum === '1024') resolution = '1k';
        } else if (metaData?.resolution) {
          const resStr = String(metaData.resolution).toLowerCase();
          if (resStr.includes('8k') || resStr.includes('8192')) resolution = '8k';
          else if (resStr.includes('4k') || resStr.includes('4096')) resolution = '4k';
          else if (resStr.includes('2k') || resStr.includes('2048')) resolution = '2k';
          else if (resStr.includes('1k') || resStr.includes('1024')) resolution = '1k';
        } else if (metaData?.maps && metaData.maps.length > 0) {
          const maxMap = metaData.maps[metaData.maps.length - 1];
          const resStr = String(maxMap.resolution || '').toLowerCase();
          if (resStr.includes('8k') || resStr.includes('8192')) resolution = '8k';
          else if (resStr.includes('4k') || resStr.includes('4096')) resolution = '4k';
          else if (resStr.includes('2k') || resStr.includes('2048')) resolution = '2k';
          else if (resStr.includes('1k') || resStr.includes('1024')) resolution = '1k';
        }

        // Extract description
        let desc = `Custom local Megascan asset parsed from local directory.`;
        if (metaData?.semanticTags?.name) {
          desc = `Megascans ${metaData.semanticTags.name}. Packed inside ${metaData.pack?.name || 'Local Library'}.`;
        }

        // Extract custom properties
        const dimensions: any = {};
        if (metaData?.meta) {
          const metaArray = Array.isArray(metaData.meta) ? metaData.meta : [];
          metaArray.forEach((item: any) => {
            if (item.key === 'length' || item.key === 'width' || item.key === 'height') {
              dimensions[item.key] = item.value;
            }
          });
        }

        const resSet = new Set<'1k'|'2k'|'4k'|'8k'>();
        
        let hasExplicitTextureResolutions = false;
        textures.forEach(t => {
           const ln = t.name.toLowerCase();
           if (ln.includes('8k')) { resSet.add('8k'); hasExplicitTextureResolutions = true; }
           else if (ln.includes('4k')) { resSet.add('4k'); hasExplicitTextureResolutions = true; }
           else if (ln.includes('2k')) { resSet.add('2k'); hasExplicitTextureResolutions = true; }
           else if (ln.includes('1k') || ln.includes('1024')) { resSet.add('1k'); hasExplicitTextureResolutions = true; }
        });

        if (!hasExplicitTextureResolutions) {
           resSet.add(resolution);
        }

        for (const res of Array.from(resSet)) {
           const resTextures = textures.filter(t => {
               const ln = t.name.toLowerCase();
               const is1k = ln.includes('1k') || ln.includes('1024');
               const is2k = ln.includes('2k') || ln.includes('2048');
               const is4k = ln.includes('4k') || ln.includes('4096');
               const is8k = ln.includes('8k') || ln.includes('8192');
               const hasRes = is1k || is2k || is4k || is8k;
               if (!hasRes) return true;
               if (res === '1k' && is1k) return true;
               if (res === '2k' && is2k) return true;
               if (res === '4k' && is4k) return true;
               if (res === '8k' && is8k) return true;
               return false;
           });

           const size = resTextures.reduce((acc, t) => acc + (t.rawSize || 0), 0) || totalSize;

           const parsedAssetItem: Asset = {
             id: `${generatedId}-${res}`,
             name: cleanName,
             type: assetType,
             size: size,
             isZipped: false,
             resolution: res,
             thumbnailUrl: thumb,
             tags: Array.from(new Set(extractedTags)),
             categories: categoryIds,
             scannedPath: `/Local/Scanned/${dirName}`,
             dateAdded: new Date().toISOString(),
             description: desc,
             meshStats: hasMesh ? {
               vertices: metaData?.meshes?.[0]?.tris || metaData?.models?.[0]?.tris || 15400,
               triangles: (metaData?.meshes?.[0]?.tris || metaData?.models?.[0]?.tris) ? (metaData?.meshes?.[0]?.tris || metaData?.models?.[0]?.tris) * 2 : 30800,
               format: meshFormat,
             } : undefined,
             textures: resTextures,
             packName: metaData?.pack?.name,
             country: metaData?.semanticTags?.country,
             region: metaData?.semanticTags?.region,
           };

           if (Object.keys(dimensions).length > 0) {
             parsedAssetItem.dimensions = dimensions;
           }

           parsedAssets.push(parsedAssetItem);
        }
      }
    }

    const filteredParsed = parsedAssets.filter(
      (pa) => !evictedAssetPaths.includes(pa.scannedPath)
    );

    setIsScanning(false);
    if (filteredParsed.length === 0) {
      setRealScanError('No new Megascan structures found in the folder. Ensure the folder has subdirectories with textures containing "Albedo" or "Normal" in their names.');
      setScanLogs(prev => [...prev, `Scan finished. No new or un-flagged Quixel signatures matched.`]);
    } else {
      setDetectedAssets(filteredParsed);
      setScanComplete(true);
      setScanLogs(prev => [
        ...prev,
        `Scan completed successfully!`,
        `Discovered ${filteredParsed.length} assets ready for your library.`,
      ]);
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const compressImageFile = (file: File, maxWidth = 300, maxHeight = 300, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve((event.target?.result as string) || '');
          }
        };
        img.onerror = () => {
          resolve((event.target?.result as string) || '');
        };
        img.src = (event.target?.result as string);
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  const pendingVirtual = scannerType === '2d' ? getPendingVirtual2DAssets() : getPendingVirtualAssets();

  return (
    <div className="bg-[#111111] border border-white/5 rounded p-4" id="directory-scanner-card">
      <div className="flex items-start justify-between mb-4" id="scanner-title-section">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/10 rounded text-blue-400 border border-blue-500/20">
            <FolderSearch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-sm text-white leading-none">Asset Auto-Importer</h2>
            <p className="text-gray-500 text-[11px] mt-0.5">Scan a directory to automatically find and index local 3D and 2D creative assets.</p>
          </div>
        </div>
         <div className="flex gap-2">
          {/* Hybrid Native/Web Folder Select */}
          <button
            type="button"
            onClick={async () => {
              const winTauri = (window as any).__TAURI__;
              if (winTauri && winTauri.dialog) {
                try {
                  const selected = await winTauri.dialog.open({
                    directory: true,
                    multiple: false,
                    title: scannerType === '2d' ? "Select 2D Assets Folder" : "Select Megascans Folder"
                  });
                  if (selected && typeof selected === 'string') {
                    setScanPath(selected);
                  }
                } catch (e: any) {
                  console.error('Tauri folder picker error:', e);
                }
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded text-xs font-semibold cursor-pointer transition-all animate-none"
            id="real-folder-picker"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Folder</span>
          </button>
          
          <input
            type="file"
            {...({
              webkitdirectory: "",
              directory: ""
            } as any)}
            multiple
            ref={fileInputRef}
            onChange={onBrowserFileChange}
            className="hidden"
            id="browser-folder-select-input"
          />
        </div>
      </div>

      {/* 3D vs 2D Segmented Tab Controls */}
      <div className="flex border-b border-white/5 mb-4" id="scanner-type-tabs">
        <button
          type="button"
          onClick={() => {
            setScannerType('3d');
            setScanPath('/Users/creative/Downloads/Megascans');
            setDetectedAssets([]);
            setScanComplete(false);
            setScanLogs([]);
            setRealScanError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            scannerType === '3d'
              ? 'border-blue-500 text-white bg-white/5 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
          id="scanner-mode-3d-tab"
        >
          <FolderSearch className="w-3.5 h-3.5 text-blue-400" />
          <span>3D MEGASANS SCANNER</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setScannerType('2d');
            setScanPath('/Users/creative/Downloads/2D_Assets');
            setDetectedAssets([]);
            setScanComplete(false);
            setScanLogs([]);
            setRealScanError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            scannerType === '2d'
              ? 'border-blue-500 text-white bg-white/5 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
          id="scanner-mode-2d-tab"
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>2D IMAGE SCANNER</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="scanner-main-layout">
        {/* Left Column: Path and Virtual Downloads representation */}
        <div className="lg:col-span-7 space-y-3" id="scanner-control-column">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 font-mono">
              Target Scan Path
            </label>
            <div className="flex gap-1.5 bg-[#161616] border border-white/5 rounded p-1 focus-within:border-blue-500/50 transition-colors">
              <input
                type="text"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="Enter folder path..."
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs font-mono text-white px-2.5"
                id="scan-path-input"
              />
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors disabled:opacity-50 cursor-pointer"
                id="start-scan-btn"
              >
                {isScanning ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current" />
                )}
                <span>Scan</span>
              </button>
            </div>
          </div>

          {/* Virtual Downloads Pending Box */}
          <div className="bg-black/35 border border-white/5 rounded p-3 space-y-2.5" id="virtual-downloads-box">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold font-mono uppercase text-gray-500">
                {scannerType === '2d' ? 'Virtual 2D Cache' : 'Virtual Download Cache'}
              </span>
              <span className="px-1.5 py-0.5 bg-blue-600/10 text-blue-400 border border-blue-500/10 text-[9px] font-mono rounded">
                {pendingVirtual.length} Unimported
              </span>
            </div>
            
            {pendingVirtual.length > 0 ? (
              <div className="divide-y divide-white/5 max-h-32 overflow-y-auto pr-1" id="pending-virtual-list">
                {pendingVirtual.map((asset) => (
                  <div key={asset.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#0F0F0F] border border-white/5 flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
                        <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover grayscale opacity-55" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-300 text-xs leading-none">{asset.name}</div>
                        <div className="font-mono text-[9px] text-gray-550 mt-0.5">{asset.scannedPath}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] px-1 py-0.5 bg-white/5 border border-white/5 text-gray-400 rounded shrink-0">
                      {asset.textures[0]?.name.split('.').pop()?.toUpperCase() || asset.type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[10px] text-gray-550 font-mono" id="no-pending-msg">
                All simulated downloads are imported.
              </div>
            )}
            
            {scannerType === '2d' ? (
              <div className="flex flex-col gap-1 text-[9px] text-gray-400 bg-[#161616]/40 p-2.5 rounded border border-white/5">
                <div className="flex items-center gap-1.5 font-semibold text-gray-300">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>2D Image Scanner Guide</span>
                </div>
                <p className="mt-1 text-gray-500">
                  Choose a directory containing standard creative image assets. The scanner will automatically scan and recursively parse standalone 2D images, extracting:
                </p>
                <ul className="list-disc pl-3.5 mt-1 space-y-1 text-[9px] text-gray-500 font-mono">
                  <li>Metadata details: <span className="text-gray-350 font-semibold">File size, dimensions, resolution, and format type (PNG, JPG, WebP)</span></li>
                  <li>Aesthetic details: <span className="text-gray-350 font-semibold">Aspect ratio, orientation, and a 5-color dominant palette</span></li>
                </ul>
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-[9px] text-gray-400 bg-[#161616]/40 p-2.5 rounded border border-white/5">
                <div className="flex items-center gap-1.5 font-semibold text-gray-300">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Megascans Folder Structure Guide</span>
                </div>
                <p className="mt-1 text-gray-500">
                  Choose the main/parent folder where your individual Megascan assets are stored. Inside that chosen directory, each subdirectory represents a single asset containing:
                </p>
                <ul className="list-disc pl-3.5 mt-1 space-y-1 text-[9px] text-gray-500 font-mono">
                  <li>A <span className="text-gray-350 font-semibold">JSON metadata file</span> (e.g., <code className="text-blue-300">asset_name.json</code>)</li>
                  <li>Loose texture layers (<span className="text-gray-350 font-semibold">_Albedo</span>, <span className="text-gray-350 font-semibold">_Normal</span>, etc.) and meshes (<span className="text-gray-350 font-semibold">.fbx/.obj</span>)</li>
                  <li>Previews/thumbnails (under <span className="text-gray-350 font-semibold">Preview/</span>, <span className="text-gray-350 font-semibold">Thumbs/</span>, or root)</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Console Log and Import Trigger */}
        <div className="lg:col-span-5 flex flex-col justify-between border border-white/5 bg-[#0F0F0F] rounded p-3 h-[250px]" id="scanner-terminal-column">
          <div className="space-y-1 flex-1 flex flex-col min-h-0">
            <span className="text-[9px] font-bold font-mono uppercase text-gray-500">Scan Activity Logs</span>
            <div 
              className="flex-1 overflow-y-auto bg-black/60 border border-white/5 p-2 rounded font-mono text-[10px] text-blue-400/90 leading-normal space-y-1 scrollbar-thin scrollbar-thumb-white/5"
              id="terminal-logs-screen"
            >
              {scanLogs.length === 0 && !realScanError && (
                <div className="text-gray-650 italic text-[10px]">Terminal idle. Click "Scan" or select a local folder.</div>
              )}
              {realScanError && (
                <div className="text-rose-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="text-[10px]">{realScanError}</span>
                </div>
              )}
              {scanLogs.map((log, index) => (
                <div key={index} className={log.startsWith(' ') ? 'text-gray-500 text-[9px]' : 'text-blue-400'}>
                  {log.startsWith('  ->') ? '  ' + log.substring(4) : log}
                </div>
              ))}
              {isScanning && (
                <div className="flex items-center gap-1 text-gray-500 italic animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />
                  <span>Parsing disk storage...</span>
                </div>
              )}
            </div>
          </div>

          {/* Import Action Box */}
          <AnimatePresence>
            {scanComplete && detectedAssets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between"
                id="import-action-bar"
              >
                <div className="text-[10px]">
                  <span className="text-blue-400 font-bold block leading-none">{detectedAssets.length} Identified</span>
                  <span className="text-gray-500">Ready to organize</span>
                </div>
                <button
                  onClick={handleImportDetected}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-md shadow-blue-500/10 transition-colors"
                  id="import-detected-btn"
                >
                  <FolderPlus className="w-3 h-3 stroke-[2]" />
                  <span>Import Assets</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
