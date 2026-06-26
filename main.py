import os
import sys
import json
import sqlite3
import shutil
import threading
import zipfile
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Megascan Studio Backend", version="1.0.0")

# Enable CORS so the React frontend running in Tauri or browser can communicate with us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Settings & Directory Config Management
# ---------------------------------------------------------------------------
SETTINGS_PATH = "settings.json"

def load_settings() -> Dict[str, Any]:
    default_settings = {
        "app_data_path": os.path.abspath("./.megascan_data"),
        "cache_path": os.path.abspath("./.megascan_cache"),
        "has_bridge_assets": True,
        "library_3d_paths": [os.path.abspath("./megascan_data/3d")],
        "library_2d_paths": [os.path.abspath("./megascan_data/2d")]
    }
    
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                saved = json.load(f)
                # merge with defaults to ensure all keys exist
                for k, v in default_settings.items():
                    if k not in saved:
                        saved[k] = v
                return saved
        except Exception:
            pass
            
    # Ensure folders exist
    os.makedirs(default_settings["app_data_path"], exist_ok=True)
    os.makedirs(default_settings["cache_path"], exist_ok=True)
    for p in default_settings["library_3d_paths"]:
        try: os.makedirs(p, exist_ok=True)
        except Exception: pass
    for p in default_settings["library_2d_paths"]:
        try: os.makedirs(p, exist_ok=True)
        except Exception: pass
    try:
        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(default_settings, f, indent=4)
    except Exception:
        pass
    return default_settings

def save_settings(settings: Dict[str, Any]):
    os.makedirs(settings["app_data_path"], exist_ok=True)
    os.makedirs(settings["cache_path"], exist_ok=True)
    for p in settings.get("library_3d_paths", []):
        try: os.makedirs(p, exist_ok=True)
        except Exception: pass
    for p in settings.get("library_2d_paths", []):
        try: os.makedirs(p, exist_ok=True)
        except Exception: pass
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=4)

def get_db_path() -> str:
    settings = load_settings()
    # ensure parent folder exists
    os.makedirs(settings["app_data_path"], exist_ok=True)
    return os.path.join(settings["app_data_path"], "library.db")

# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            local_path TEXT,
            thumbnail TEXT,
            total_size TEXT,
            mesh_size TEXT,
            category_paths TEXT,
            tags TEXT,
            available_resolutions TEXT,
            is_zipped INTEGER DEFAULT 0,
            date_added TEXT,
            textures TEXT,
            mesh_stats TEXT,
            description TEXT
        )
    """)
    # Add new columns if they do not exist
    for col, col_type in [
        ("colors", "TEXT"), 
        ("orientation", "TEXT"), 
        ("aspect_ratio", "TEXT"), 
        ("width", "INTEGER"), 
        ("height", "INTEGER"), 
        ("moodboards", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE assets ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            # Column already exists
            pass
    conn.commit()
    conn.close()

# Initialize database on startup at current configured path
init_db()

scan_state = {
    "is_scanning": False,
    "progress": 0,
    "logs": [],
    "error": None,
    "current_path": None,
    "assets_found": 0
}

class ScanRequest(BaseModel):
    path: str

class SettingsModel(BaseModel):
    app_data_path: str
    cache_path: str
    has_bridge_assets: bool
    library_3d_paths: Optional[List[str]] = None
    library_2d_paths: Optional[List[str]] = None

class ZipToggleRequest(BaseModel):
    action: str  # "zip" or "unzip"

class BatchZipRequest(BaseModel):
    asset_ids: List[str]
    action: str  # "zip" or "unzip"

# ---------------------------------------------------------------------------
# Core Megascan Scanner, Parser & Organizer Logic
# ---------------------------------------------------------------------------
def format_size(bytes_val: int) -> str:
    if bytes_val <= 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(bytes_val, 1024)))
    p = math.pow(1024, i)
    s = round(bytes_val / p, 2)
    return f"{s} {units[i]}"

def organize_loose_textures(asset_folder: str) -> List[str]:
    """
    Auto-Organizer Module: Sweep the root of each asset folder,
    relocate loose high-res texture maps (containing "_8k" or "8k" in name)
    into `Thumbs/8K/`, leaving meshes and metadata .json intact.
    """
    thumbs_8k_dir = os.path.join(asset_folder, "Thumbs", "8K")
    texture_exts = {".png", ".exr", ".tga", ".jpg", ".jpeg"}
    
    try:
        files_in_root = [f for f in os.listdir(asset_folder) if os.path.isfile(os.path.join(asset_folder, f))]
    except Exception:
        return []

    moved_files = []
    for file_name in files_in_root:
        file_lower = file_name.lower()
        _, ext = os.path.splitext(file_lower)
        if ext in texture_exts:
            # Check for high-res '_8k' or '8k' textures
            if "_8k" in file_lower or "8k" in file_lower:
                src_path = os.path.join(asset_folder, file_name)
                os.makedirs(thumbs_8k_dir, exist_ok=True)
                dest_path = os.path.join(thumbs_8k_dir, file_name)
                try:
                    shutil.move(src_path, dest_path)
                    moved_files.append(file_name)
                except Exception:
                    pass
    return moved_files

def parse_categories_tree(tree: Any, current_path: Optional[List[str]] = None) -> List[List[str]]:
    """
    Deep assetCategories Parsing: Parses the assetCategories dictionary tree recursively,
    extracting multiple sibling category paths into lists.
    """
    if current_path is None:
        current_path = []
        
    if not isinstance(tree, dict) or not tree:
        return [current_path] if current_path else []
        
    paths = []
    for key, val in tree.items():
        paths.extend(parse_categories_tree(val, current_path + [key]))
    return paths

# ---------------------------------------------------------------------------
# Zip Compression / Decompression Core Engine
# ---------------------------------------------------------------------------
def zip_asset_folder(asset_id: str, local_path: str, cache_path: str) -> Optional[str]:
    """
    Compresses all files in the asset's local folder into a single asset_payload.zip file,
    while copying the preview image (thumbnail) to the cache path to keep it readable by the app.
    """
    if not os.path.isdir(local_path):
        raise Exception(f"Asset folder path '{local_path}' does not exist.")
        
    # 1. Locate the thumbnail/preview image first
    thumbnail_src = None
    preview_dir = os.path.join(local_path, "Preview")
    if os.path.isdir(preview_dir):
        images = [f for f in os.listdir(preview_dir) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
        if images:
            thumbnail_src = os.path.join(preview_dir, images[0])
    if not thumbnail_src:
        images = [f for f in os.listdir(local_path) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
        if images:
            thumbnail_src = os.path.join(local_path, images[0])
            
    # 2. Copy the thumbnail to cache path so that the app can still read it when zipped
    cached_thumbnail_path = ""
    if thumbnail_src:
        ext = os.path.splitext(thumbnail_src)[1]
        cache_thumb_dir = os.path.join(cache_path, "thumbnails")
        os.makedirs(cache_thumb_dir, exist_ok=True)
        cached_thumbnail_path = os.path.join(cache_thumb_dir, f"{asset_id}{ext}")
        try:
            shutil.copy2(thumbnail_src, cached_thumbnail_path)
        except Exception as e:
            print(f"Failed to copy thumbnail to cache: {e}")
            
    # 3. Create the ZIP archive
    zip_filename = "asset_payload.zip"
    zip_filepath = os.path.join(local_path, zip_filename)
    
    # Collect files to zip
    files_to_zip = []
    for root, dirs, files in os.walk(local_path):
        for file in files:
            full_path = os.path.join(root, file)
            # Do not zip the archive itself
            if file == zip_filename:
                continue
            files_to_zip.append(full_path)
            
    if not files_to_zip:
        raise Exception("No files found to compress.")
        
    try:
        with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_to_zip in files_to_zip:
                # Relative path inside zip
                rel_path = os.path.relpath(file_to_zip, local_path)
                zip_file.write(file_to_zip, rel_path)
                
        # 4. Success! Delete the original loose files and subdirectories
        for item in os.listdir(local_path):
            item_path = os.path.join(local_path, item)
            if item == zip_filename:
                continue
            try:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
            except Exception as e:
                print(f"Failed to delete original item {item_path} after zipping: {e}")
                
        return cached_thumbnail_path if cached_thumbnail_path else thumbnail_src
    except Exception as e:
        # Cleanup incomplete zip if failed
        if os.path.exists(zip_filepath):
            try: os.remove(zip_filepath)
            except Exception: pass
        raise e

def unzip_asset_folder(local_path: str) -> bool:
    """
    Decompresses the asset_payload.zip file back into the asset's folder and deletes the zip.
    """
    zip_filename = "asset_payload.zip"
    zip_filepath = os.path.join(local_path, zip_filename)
    
    if not os.path.exists(zip_filepath):
        raise Exception(f"Compressed archive 'asset_payload.zip' not found in '{local_path}'.")
        
    try:
        with zipfile.ZipFile(zip_filepath, 'r') as zip_file:
            zip_file.extractall(local_path)
            
        # Delete the zip archive on success
        os.remove(zip_filepath)
        return True
    except Exception as e:
        raise e

# ---------------------------------------------------------------------------
# 2D Creative Asset Helpers (Color extraction, Dimensions, Orientation, Thumbnails)
# ---------------------------------------------------------------------------
def extract_image_details(image_path: str) -> Dict[str, Any]:
    # Default fallback
    details = {
        "width": 1920,
        "height": 1080,
        "orientation": "landscape",
        "aspect_ratio": "16:9",
        "colors": ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"]
    }
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            w, h = img.size
            details["width"] = w
            details["height"] = h
            
            # Aspect ratio & orientation
            if w == h:
                details["orientation"] = "square"
                details["aspect_ratio"] = "1:1"
            elif w > h:
                details["orientation"] = "landscape"
                gcd_val = math.gcd(w, h) if hasattr(math, "gcd") else 1
                details["aspect_ratio"] = f"{w//gcd_val}:{h//gcd_val}" if gcd_val > 0 else "16:9"
            else:
                details["orientation"] = "portrait"
                gcd_val = math.gcd(w, h) if hasattr(math, "gcd") else 1
                details["aspect_ratio"] = f"{w//gcd_val}:{h//gcd_val}" if gcd_val > 0 else "9:16"
                
            # Simplify to common standard aspect ratios
            ratio_float = w / h
            if abs(ratio_float - 1.777) < 0.05:
                details["aspect_ratio"] = "16:9"
            elif abs(ratio_float - 1.333) < 0.05:
                details["aspect_ratio"] = "4:3"
            elif abs(ratio_float - 1.5) < 0.05:
                details["aspect_ratio"] = "3:2"
            elif abs(ratio_float - 0.5625) < 0.05:
                details["aspect_ratio"] = "9:16"
            elif abs(ratio_float - 0.75) < 0.05:
                details["aspect_ratio"] = "3:4"
            elif abs(ratio_float - 0.666) < 0.05:
                details["aspect_ratio"] = "2:3"
            
            # Dominant colors extraction
            # Resize image to small 50x50 to speed up and average colors
            small_img = img.convert("RGB").resize((50, 50))
            pixels = list(small_img.getdata())
            
            from collections import Counter
            most_common = Counter(pixels).most_common(20)
            
            extracted_colors = []
            for color, count in most_common:
                # color is tuple of (R, G, B)
                hex_col = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
                # check if too close to already added colors
                too_close = False
                for existing in extracted_colors:
                    r2, g2, b2 = int(existing[1:3], 16), int(existing[3:5], 16), int(existing[5:7], 16)
                    r1, g1, b1 = color[0], color[1], color[2]
                    dist = math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
                    if dist < 45:
                        too_close = True
                        break
                if not too_close:
                    extracted_colors.append(hex_col)
                if len(extracted_colors) >= 5:
                    break
                    
            if len(extracted_colors) < 5:
                for color, count in most_common:
                    hex_col = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
                    if hex_col not in extracted_colors:
                        extracted_colors.append(hex_col)
                    if len(extracted_colors) >= 5:
                        break
                        
            if extracted_colors:
                while len(extracted_colors) < 5:
                    extracted_colors.append(extracted_colors[0])
                details["colors"] = extracted_colors[:5]
    except Exception as e:
        print(f"Error extracting image details: {e}")
    return details

def make_2d_thumbnail(src_path: str, asset_id: str, cache_path: str) -> str:
    ext = os.path.splitext(src_path)[1].lower()
    cache_thumb_dir = os.path.join(cache_path, "thumbnails")
    os.makedirs(cache_thumb_dir, exist_ok=True)
    dst_path = os.path.join(cache_thumb_dir, f"{asset_id}.jpg")
    
    # Try PIL conversion to JPEG
    try:
        from PIL import Image
        with Image.open(src_path) as img:
            img = img.convert("RGB")
            img.thumbnail((320, 320))
            img.save(dst_path, "JPEG", quality=80)
            return dst_path
    except Exception as e:
        print(f"PIL thumbnail generation failed for {src_path}: {e}")
        
    # Standard formats fallback copy
    if ext in [".png", ".jpg", ".jpeg", ".webp"]:
        dst_path_standard = os.path.join(cache_thumb_dir, f"{asset_id}{ext}")
        try:
            shutil.copy2(src_path, dst_path_standard)
            return dst_path_standard
        except Exception:
            pass
            
    return src_path

# ---------------------------------------------------------------------------
# Background Scanning Worker
# ---------------------------------------------------------------------------
def scan_directory_worker(root_path: str):
    global scan_state
    scan_state["is_scanning"] = True
    scan_state["progress"] = 5
    scan_state["error"] = None
    scan_state["assets_found"] = 0
    scan_state["logs"] = [f"[{datetime.now().strftime('%H:%M:%S')}] Launching scanner..."]

    try:
        settings = load_settings()
        cache_path = settings["cache_path"]
        
        paths_to_scan = []
        if root_path.upper() in ["ALL", "all", ""] or not root_path:
            # Gather all registered paths
            for p in settings.get("library_3d_paths", []):
                if os.path.isdir(p):
                    paths_to_scan.append((p, False))
            for p in settings.get("library_2d_paths", []):
                if os.path.isdir(p):
                    paths_to_scan.append((p, True))
            if not paths_to_scan:
                # Default to app default paths if none registered
                for p in [os.path.abspath("./megascan_data/3d")]:
                    if os.path.isdir(p): paths_to_scan.append((p, False))
                for p in [os.path.abspath("./megascan_data/2d")]:
                    if os.path.isdir(p): paths_to_scan.append((p, True))
        else:
            # Single path
            if not os.path.isdir(root_path):
                raise Exception(f"The path '{root_path}' does not exist or is not a directory.")
            # Determine if 2D or 3D
            is_2d = False
            path_abs = os.path.abspath(root_path)
            for p2d in settings.get("library_2d_paths", []):
                p2d_abs = os.path.abspath(p2d)
                if path_abs == p2d_abs or path_abs.startswith(p2d_abs + os.sep):
                    is_2d = True
                    break
            if not is_2d:
                low_name = os.path.basename(path_abs).lower()
                if any(k in low_name for k in ["2d", "texture", "paint", "alpha", "art", "overlay", "decal", "concept"]):
                    is_2d = True
            paths_to_scan.append((root_path, is_2d))

        if not paths_to_scan:
            scan_state["progress"] = 100
            scan_state["is_scanning"] = False
            scan_state["logs"].append("No valid registered library paths found to scan.")
            return

        conn = get_db_connection()
        cursor = conn.cursor()

        total_paths = len(paths_to_scan)
        for path_idx, (path, is_2d) in enumerate(paths_to_scan):
            scan_state["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Scanning path [{path_idx+1}/{total_paths}]: {path}")
            if is_2d:
                # Run 2D Image ruleset
                image_extensions = (".png", ".jpg", ".jpeg", ".tga", ".webp", ".psd", ".hdr", ".exr", ".clip", ".xcf", ".ase", ".aseprite", ".bmp", ".tiff")
                image_files = []
                for root, dirs, files in os.walk(path):
                    for file in files:
                        if file.lower().endswith(image_extensions):
                            if file.startswith(".") or file.startswith("~$") or "cache" in root.lower() or "preview" in root.lower() or "thumbs" in root.lower():
                                continue
                            full_path = os.path.join(root, file)
                            image_files.append((full_path, file, root))
                
                total_images = len(image_files)
                scan_state["logs"].append(f"Found {total_images} standalone images/textures in: {path}")
                for index, (full_path, file, folder) in enumerate(image_files):
                    base_name, ext = os.path.splitext(file)
                    asset_name = base_name.replace("_", " ").replace("-", " ").title()
                    
                    import hashlib
                    asset_id = "2d_" + hashlib.md5(full_path.encode('utf-8')).hexdigest()[:12]
                    sz_bytes = os.path.getsize(full_path)
                    size_str = format_size(sz_bytes)
                    details = extract_image_details(full_path)
                    cached_thumb = make_2d_thumbnail(full_path, asset_id, cache_path)
                    
                    rel_dir = os.path.relpath(folder, path)
                    tags = [t.lower() for t in rel_dir.split(os.sep) if t and t != "."]
                    tags.extend([t.lower() for t in asset_name.split() if len(t) > 2])
                    tags = list(set(tags))
                    
                    sub_cats = [t.lower() for t in rel_dir.split(os.sep) if t and t != "."]
                    category_paths = [["2d"] + sub_cats] if sub_cats else [["2d", "textures"]]
                    
                    textures_list = [{
                        "name": file,
                        "type": "2D Source File",
                        "resolution": f"{details['width']}x{details['height']}",
                        "size": size_str,
                        "rawSize": sz_bytes
                    }]
                    
                    cursor.execute("""
                        INSERT OR REPLACE INTO assets (
                            id, name, type, local_path, thumbnail, total_size, mesh_size,
                            category_paths, tags, available_resolutions, is_zipped, date_added, textures, mesh_stats, description,
                            colors, orientation, aspect_ratio, width, height, moodboards
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        asset_id, asset_name, "2d", full_path, cached_thumb, size_str, "0 B",
                        json.dumps(category_paths), json.dumps(tags), json.dumps(["original"]),
                        0, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), json.dumps(textures_list),
                        None, f"2D image asset ({details['width']}x{details['height']}) of orientation {details['orientation']}.",
                        json.dumps(details["colors"]), details["orientation"], details["aspect_ratio"],
                        details["width"], details["height"], json.dumps([])
                    ))
                    
                    scan_state["assets_found"] += 1
                    base_progress = int(path_idx / total_paths * 100)
                    step_progress = int((index + 1) / total_images * (100 / total_paths))
                    scan_state["progress"] = min(95, base_progress + step_progress)
                    
                    if index % 15 == 0 or index == total_images - 1:
                        scan_state["logs"].append(f"Processed {index + 1}/{total_images} 2D images: {asset_name}")
            else:
                # Run 3D package ruleset
                asset_folders = []
                for root, dirs, files in os.walk(path):
                    json_files = [f for f in files if f.lower().endswith(".json") and f.lower() != "package.json"]
                    has_zip = "asset_payload.zip" in files
                    if json_files or has_zip:
                        json_path = os.path.join(root, json_files[0]) if json_files else None
                        asset_folders.append((root, json_path, has_zip))
                        
                total_assets = len(asset_folders)
                scan_state["logs"].append(f"Found {total_assets} 3D/Surface folders in: {path}")
                for index, (folder, json_path, has_zip) in enumerate(asset_folders):
                    folder_name = os.path.basename(folder)
                    
                    if not has_zip:
                        try:
                            moved = organize_loose_textures(folder)
                            if moved:
                                scan_state["logs"].append(f"[{folder_name}] Organized {len(moved)} textures into Thumbs/8K/")
                        except Exception:
                            pass
                            
                    meta = {}
                    if json_path and os.path.exists(json_path):
                        try:
                            with open(json_path, "r", encoding="utf-8") as f:
                                meta = json.load(f)
                        except Exception as e:
                            scan_state["logs"].append(f"Warning: Failed to parse {json_path}. Error: {str(e)}")
                    elif has_zip:
                        zip_filepath = os.path.join(folder, "asset_payload.zip")
                        try:
                            with zipfile.ZipFile(zip_filepath, 'r') as zf:
                                json_in_zip = [name for name in zf.namelist() if name.lower().endswith(".json") and name.lower() != "package.json"]
                                if json_in_zip:
                                    with zf.open(json_in_zip[0]) as zf_file:
                                        meta = json.loads(zf_file.read().decode('utf-8'))
                        except Exception as e:
                            scan_state["logs"].append(f"Warning: Failed to parse JSON from zip. Error: {str(e)}")
                            
                    asset_id = meta.get("id") or meta.get("assetId") or folder_name
                    asset_name = meta.get("name") or folder_name.replace("_", " ").title()
                    
                    category_paths = []
                    if "assetCategories" in meta:
                        category_paths = parse_categories_tree(meta["assetCategories"])
                    elif "categories" in meta:
                        cats = meta["categories"]
                        if isinstance(cats, list):
                            category_paths = [cats]
                    if not category_paths:
                        category_paths = [["3d" if "3d" in folder_name.lower() else "surface"]]
                        
                    tags = meta.get("tags", [])
                    if not isinstance(tags, list): tags = []
                    
                    raw_type = meta.get("type", "").lower()
                    asset_type = "3d"
                    if "plant" in raw_type or "vegetation" in raw_type or "3dplant" in folder_name.lower():
                        asset_type = "3dplant"
                    elif "surface" in raw_type or "surface" in folder_name.lower():
                        asset_type = "surface"
                    elif "decal" in raw_type or "decal" in folder_name.lower():
                        asset_type = "decal"
                    elif "atlas" in raw_type or "atlas" in folder_name.lower():
                        asset_type = "atlas"
                        
                    thumbnail = ""
                    if has_zip:
                        cache_thumb_dir = os.path.join(cache_path, "thumbnails")
                        if os.path.isdir(cache_thumb_dir):
                            for ext in [".png", ".jpg", ".jpeg", ".tga", ".webp"]:
                                potential_thumb = os.path.join(cache_thumb_dir, f"{asset_id}{ext}")
                                if os.path.exists(potential_thumb):
                                    thumbnail = potential_thumb
                                    break
                    else:
                        preview_dir = os.path.join(folder, "Preview")
                        if os.path.isdir(preview_dir):
                            images = [f for f in os.listdir(preview_dir) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                            if images:
                                thumbnail = os.path.join(preview_dir, images[0])
                        if not thumbnail:
                            images = [f for f in os.listdir(folder) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                            if images:
                                thumbnail = os.path.join(folder, images[0])
                                
                    available_resolutions = []
                    if not has_zip:
                        thumbs_dir = os.path.join(folder, "Thumbs")
                        if os.path.isdir(thumbs_dir):
                            subdirs = [d.upper() for d in os.listdir(thumbs_dir) if os.path.isdir(os.path.join(thumbs_dir, d))]
                            for res in ["8K", "4K", "2K", "1K"]:
                                if res in subdirs:
                                    available_resolutions.append(res.lower())
                                    
                    total_bytes = 0
                    mesh_bytes = 0
                    textures_list = []
                    mesh_format = "FBX"
                    
                    if has_zip:
                        zip_filepath = os.path.join(folder, "asset_payload.zip")
                        if os.path.exists(zip_filepath):
                            total_bytes = os.path.getsize(zip_filepath)
                        try:
                            with zipfile.ZipFile(zip_filepath, 'r') as zf:
                                for info in zf.infolist():
                                    file = os.path.basename(info.filename)
                                    if not file: continue
                                    f_low = file.lower()
                                    ext = os.path.splitext(f_low)[1]
                                    sz = info.file_size
                                    
                                    if ext in ['.fbx', '.obj', '.uasset', '.max', '.ma', '.usd']:
                                        mesh_bytes += sz
                                        mesh_format = ext[1:].upper()
                                    if ext in ['.png', '.exr', '.tga', '.jpg', '.jpeg']:
                                        tex_res = "2k"
                                        if "8k" in f_low: tex_res = "8k"
                                        elif "4k" in f_low: tex_res = "4k"
                                        elif "1k" in f_low: tex_res = "1k"
                                        
                                        tex_type = "Albedo"
                                        if "normal" in f_low: tex_type = "Normal"
                                        elif "roughness" in f_low: tex_type = "Roughness"
                                        elif "displacement" in f_low or "height" in f_low: tex_type = "Displacement"
                                        elif "ao" in f_low or "ambientocclusion" in f_low: tex_type = "AO"
                                        elif "opacity" in f_low or "alpha" in f_low: tex_type = "Opacity"
                                        elif "cavity" in f_low: tex_type = "Cavity"
                                        
                                        textures_list.append({
                                            "name": file, "type": tex_type, "resolution": tex_res,
                                            "size": format_size(sz), "rawSize": sz
                                        })
                        except Exception:
                            pass
                    else:
                        for r, d, files in os.walk(folder):
                            for file in files:
                                file_path = os.path.join(r, file)
                                try:
                                    sz = os.path.getsize(file_path)
                                    total_bytes += sz
                                    rel_path = os.path.relpath(r, folder)
                                    is_in_root = (rel_path == ".")
                                    is_in_uasset = ("uasset" in rel_path.lower() or "mesh" in rel_path.lower())
                                    f_low = file.lower()
                                    ext = os.path.splitext(f_low)[1]
                                    
                                    if ext in ['.fbx', '.obj', '.uasset', '.max', '.ma', '.usd']:
                                        mesh_bytes += sz
                                        mesh_format = ext[1:].upper()
                                    elif is_in_root or is_in_uasset:
                                        if ext not in ['.png', '.exr', '.tga', '.jpg', '.jpeg', '.json', '.xml']:
                                            mesh_bytes += sz
                                            
                                    if ext in ['.png', '.exr', '.tga', '.jpg', '.jpeg']:
                                        tex_res = "2k"
                                        if "8k" in f_low: tex_res = "8k"
                                        elif "4k" in f_low: tex_res = "4k"
                                        elif "1k" in f_low: tex_res = "1k"
                                        
                                        tex_type = "Albedo"
                                        if "normal" in f_low: tex_type = "Normal"
                                        elif "roughness" in f_low: tex_type = "Roughness"
                                        elif "displacement" in f_low or "height" in f_low: tex_type = "Displacement"
                                        elif "ao" in f_low or "ambientocclusion" in f_low: tex_type = "AO"
                                        elif "opacity" in f_low or "alpha" in f_low: tex_type = "Opacity"
                                        elif "cavity" in f_low: tex_type = "Cavity"
                                        
                                        textures_list.append({
                                            "name": file, "type": tex_type, "resolution": tex_res,
                                            "size": format_size(sz), "rawSize": sz
                                        })
                                except Exception:
                                    pass
                                    
                    if not available_resolutions:
                        found_res = set(t["resolution"] for t in textures_list)
                        available_resolutions = sorted(list(found_res), reverse=True) if found_res else ["2k"]
                        
                    total_size_str = format_size(total_bytes)
                    mesh_size_str = format_size(mesh_bytes) if mesh_bytes > 0 else "0 B"
                    mesh_stats = None
                    if mesh_bytes > 0:
                        mesh_stats = {
                            "vertices": meta.get("meshStats", {}).get("vertices", 4210),
                            "triangles": meta.get("meshStats", {}).get("triangles", 8200),
                            "format": mesh_format
                        }
                        
                    # Extract 3D Preview dimensions and palette as 2D metadata for secondary views
                    colors_json = json.dumps(["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"])
                    orientation_str = "landscape"
                    aspect_ratio_str = "16:9"
                    w_val = 1920
                    h_val = 1080
                    if thumbnail and os.path.exists(thumbnail):
                        try:
                            tdetails = extract_image_details(thumbnail)
                            colors_json = json.dumps(tdetails["colors"])
                            orientation_str = tdetails["orientation"]
                            aspect_ratio_str = tdetails["aspect_ratio"]
                            w_val = tdetails["width"]
                            h_val = tdetails["height"]
                        except Exception:
                            pass

                    cursor.execute("""
                        INSERT OR REPLACE INTO assets (
                            id, name, type, local_path, thumbnail, total_size, mesh_size,
                            category_paths, tags, available_resolutions, is_zipped, date_added, textures, mesh_stats, description,
                            colors, orientation, aspect_ratio, width, height, moodboards
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        asset_id, asset_name, asset_type, folder, thumbnail, total_size_str, mesh_size_str,
                        json.dumps(category_paths), json.dumps(tags), json.dumps(available_resolutions),
                        1 if has_zip else 0, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), json.dumps(textures_list),
                        json.dumps(mesh_stats) if mesh_stats else None, meta.get("description", ""),
                        colors_json, orientation_str, aspect_ratio_str, w_val, h_val, json.dumps([])
                    ))
                    
                    scan_state["assets_found"] += 1
                    base_progress = int(path_idx / total_paths * 100)
                    step_progress = int((index + 1) / total_assets * (100 / total_paths))
                    scan_state["progress"] = min(95, base_progress + step_progress)
                    
                    if index % 20 == 0 or index == total_assets - 1:
                        scan_state["logs"].append(f"Processed {index + 1}/{total_assets} assets ({asset_name})")

        conn.commit()
        conn.close()
        
        scan_state["progress"] = 100
        scan_state["is_scanning"] = False
        scan_state["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Scan successfully completed! Mapped {scan_state['assets_found']} assets to local cache.")

    except Exception as e:
        import traceback
        scan_state["is_scanning"] = False
        scan_state["error"] = str(e)
        scan_state["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR during scanning: {str(e)}")
        print(traceback.format_exc())

# ---------------------------------------------------------------------------
# FastAPI API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/status")
def get_status():
    return {
        "status": "running",
        "database_connected": os.path.exists(get_db_path()),
        "scanning_status": {
            "is_scanning": scan_state["is_scanning"],
            "progress": scan_state["progress"],
            "assets_found": scan_state["assets_found"],
            "error": scan_state["error"]
        }
    }

@app.get("/api/scan/progress")
def get_scan_progress():
    return {
        "is_scanning": scan_state["is_scanning"],
        "progress": scan_state["progress"],
        "assets_found": scan_state["assets_found"],
        "error": scan_state["error"],
        "logs": scan_state["logs"][-50:]
    }

@app.post("/api/scan")
def trigger_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    if scan_state["is_scanning"]:
        raise HTTPException(status_code=400, detail="A scan is already in progress.")
    
    background_tasks.add_task(scan_directory_worker, req.path)
    return {"message": "Scanning process initiated in background thread.", "target_path": req.path}

@app.get("/api/assets")
def get_assets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assets")
    rows = cursor.fetchall()
    conn.close()

    assets = []
    for row in rows:
        try:
            category_paths = json.loads(row["category_paths"])
        except Exception:
            category_paths = []

        try:
            tags = json.loads(row["tags"])
        except Exception:
            tags = []

        try:
            available_resolutions = json.loads(row["available_resolutions"])
        except Exception:
            available_resolutions = ["2k"]

        try:
            textures = json.loads(row["textures"])
        except Exception:
            textures = []

        try:
            mesh_stats = json.loads(row["mesh_stats"]) if row["mesh_stats"] else None
        except Exception:
            mesh_stats = None

        resolution = available_resolutions[0] if available_resolutions else "2k"
        
        # Calculate raw total size in bytes (fallback)
        total_size_str = row["total_size"] or "0 B"
        raw_size = 0
        try:
            val, unit = total_size_str.split()
            val_f = float(val)
            mul = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}.get(unit.upper(), 1)
            raw_size = int(val_f * mul)
        except Exception:
            raw_size = 0

        colors = []
        if "colors" in row.keys() and row["colors"]:
            try:
                colors = json.loads(row["colors"])
            except Exception:
                pass
        
        moodboards = []
        if "moodboards" in row.keys() and row["moodboards"]:
            try:
                moodboards = json.loads(row["moodboards"])
            except Exception:
                pass

        asset = {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "size": raw_size,
            "isZipped": bool(row["is_zipped"]),
            "resolution": resolution,
            "thumbnailUrl": row["thumbnail"] or "",
            "tags": tags,
            "categories": [],
            "categoryPaths": category_paths,
            "scannedPath": row["local_path"],
            "dateAdded": row["date_added"],
            "textures": textures,
            "description": row["description"] or "",
            "colors": colors,
            "moodboards": moodboards,
            "orientation": row["orientation"] if ("orientation" in row.keys() and row["orientation"]) else "landscape",
            "aspectRatio": row["aspect_ratio"] if ("aspect_ratio" in row.keys() and row["aspect_ratio"]) else "16:9",
            "width": row["width"] if ("width" in row.keys() and row["width"]) else 1920,
            "height": row["height"] if ("height" in row.keys() and row["height"]) else 1080
        }
        if mesh_stats:
            asset["meshStats"] = mesh_stats
            
        assets.append(asset)

    return {"assets": assets}

# ---------------------------------------------------------------------------
# Storage & Settings API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/settings")
def get_settings():
    return load_settings()

@app.post("/api/settings")
def update_settings(settings: SettingsModel):
    old_settings = load_settings()
    new_settings = settings.dict()
    
    old_db_path = os.path.join(old_settings["app_data_path"], "library.db")
    new_db_path = os.path.join(new_settings["app_data_path"], "library.db")
    
    # If app_data_path changed and old db exists, copy it to preserve data
    if old_settings["app_data_path"] != new_settings["app_data_path"]:
        if os.path.exists(old_db_path) and not os.path.exists(new_db_path):
            try:
                shutil.copy2(old_db_path, new_db_path)
            except Exception as e:
                print(f"Failed to copy DB during path transition: {e}")
                
    save_settings(new_settings)
    init_db()  # Ensure database is initialized at the new path
    return {"status": "success", "settings": new_settings}

# ---------------------------------------------------------------------------
# Zip / Decompress Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/assets/{asset_id}/zip")
def zip_asset(asset_id: str, req: ZipToggleRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT local_path, thumbnail, is_zipped FROM assets WHERE id = ?", (asset_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found in library.")
        
    local_path = row["local_path"]
    is_zipped = bool(row["is_zipped"])
    
    if req.action == "zip":
        if is_zipped:
            conn.close()
            return {"status": "already_zipped", "message": f"Asset '{asset_id}' is already zipped."}
            
        settings = load_settings()
        try:
            cached_thumb = zip_asset_folder(asset_id, local_path, settings["cache_path"])
            
            # Update database
            cursor.execute("UPDATE assets SET is_zipped = 1, thumbnail = ? WHERE id = ?", (cached_thumb, asset_id))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"Asset '{asset_id}' has been successfully zipped.", "thumbnail": cached_thumb}
        except Exception as e:
            conn.close()
            raise HTTPException(status_code=500, detail=f"Failed to zip asset: {str(e)}")
            
    elif req.action == "unzip":
        if not is_zipped:
            conn.close()
            return {"status": "already_unzipped", "message": f"Asset '{asset_id}' is already unzipped."}
            
        try:
            unzip_asset_folder(local_path)
            
            # Restore loose thumbnail path
            thumbnail = ""
            preview_dir = os.path.join(local_path, "Preview")
            if os.path.isdir(preview_dir):
                images = [f for f in os.listdir(preview_dir) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                if images:
                    thumbnail = os.path.join(preview_dir, images[0])
            if not thumbnail:
                images = [f for f in os.listdir(local_path) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                if images:
                    thumbnail = os.path.join(local_path, images[0])
            
            cursor.execute("UPDATE assets SET is_zipped = 0, thumbnail = ? WHERE id = ?", (thumbnail, asset_id))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"Asset '{asset_id}' has been successfully unzipped.", "thumbnail": thumbnail}
        except Exception as e:
            conn.close()
            raise HTTPException(status_code=500, detail=f"Failed to unzip asset: {str(e)}")
            
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'zip' or 'unzip'.")

@app.post("/api/assets/batch-zip")
def batch_zip_assets(req: BatchZipRequest):
    if not req.asset_ids:
        return {"status": "success", "processed": 0, "message": "No assets specified."}
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    settings = load_settings()
    processed_count = 0
    errors = []
    
    for asset_id in req.asset_ids:
        cursor.execute("SELECT local_path, thumbnail, is_zipped FROM assets WHERE id = ?", (asset_id,))
        row = cursor.fetchone()
        if not row:
            continue
            
        local_path = row["local_path"]
        is_zipped = bool(row["is_zipped"])
        
        if req.action == "zip" and not is_zipped:
            try:
                cached_thumb = zip_asset_folder(asset_id, local_path, settings["cache_path"])
                cursor.execute("UPDATE assets SET is_zipped = 1, thumbnail = ? WHERE id = ?", (cached_thumb, asset_id))
                processed_count += 1
            except Exception as e:
                errors.append(f"Failed to zip '{asset_id}': {str(e)}")
        elif req.action == "unzip" and is_zipped:
            try:
                unzip_asset_folder(local_path)
                thumbnail = ""
                preview_dir = os.path.join(local_path, "Preview")
                if os.path.isdir(preview_dir):
                    images = [f for f in os.listdir(preview_dir) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                    if images:
                        thumbnail = os.path.join(preview_dir, images[0])
                if not thumbnail:
                    images = [f for f in os.listdir(local_path) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                    if images:
                        thumbnail = os.path.join(local_path, images[0])
                cursor.execute("UPDATE assets SET is_zipped = 0, thumbnail = ? WHERE id = ?", (thumbnail, asset_id))
                processed_count += 1
            except Exception as e:
                errors.append(f"Failed to unzip '{asset_id}': {str(e)}")
                
    conn.commit()
    conn.close()
    
    return {
        "status": "success" if not errors else "partial_success",
        "processed": processed_count,
        "errors": errors,
        "message": f"Successfully processed {processed_count} assets."
    }

class MoodboardUpdateRequest(BaseModel):
    moodboards: list[str]

@app.post("/api/assets/{asset_id}/moodboards")
def update_asset_moodboards(asset_id: str, req: MoodboardUpdateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE assets SET moodboards = ? WHERE id = ?", (json.dumps(req.moodboards), asset_id))
    conn.commit()
    conn.close()
    return {"status": "success", "moodboards": req.moodboards}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
