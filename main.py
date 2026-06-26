import os
import sys
import json
import sqlite3
import shutil
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Megascan Studio Backend", version="1.0.0")

# Enable CORS so the React frontend running in Tauri can communicate with us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "library.db"
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

# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
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
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

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
    except Exception as e:
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

def scan_directory_worker(root_path: str):
    global scan_state
    scan_state["is_scanning"] = True
    scan_state["progress"] = 5
    scan_state["error"] = None
    scan_state["assets_found"] = 0
    scan_state["logs"] = [f"[{datetime.now().strftime('%H:%M:%S')}] Launching scanner for: {root_path}"]

    try:
        if not os.path.isdir(root_path):
            raise Exception(f"The path '{root_path}' does not exist or is not a directory.")

        scan_state["logs"].append("Sweeping and pinpointing unique assets (folders containing a .json metadata file)...")
        scan_state["progress"] = 15

        # 1. Gather all subfolders with a unique metadata JSON file
        asset_folders = []
        for root, dirs, files in os.walk(root_path):
            json_files = [f for f in files if f.lower().endswith(".json") and f.lower() != "package.json"]
            if json_files:
                # Use the first JSON file as the metadata indicator
                json_path = os.path.join(root, json_files[0])
                asset_folders.append((root, json_path))

        total_assets = len(asset_folders)
        scan_state["logs"].append(f"Pinpointed {total_assets} unique Megascan assets with JSON metadata.")
        
        if total_assets == 0:
            scan_state["progress"] = 100
            scan_state["is_scanning"] = False
            scan_state["logs"].append("Scan complete. No assets found.")
            return

        conn = get_db_connection()
        cursor = conn.cursor()

        # 2. Iterate and process each folder
        for index, (folder, json_path) in enumerate(asset_folders):
            folder_name = os.path.basename(folder)
            
            # Step 1: Auto-Organizer Sweep for loose textures
            moved = organize_loose_textures(folder)
            if moved:
                scan_state["logs"].append(f"[{folder_name}] Organized {len(moved)} loose 8K textures into Thumbs/8K/")

            # Step 2: Parse Quixel JSON metadata
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
            except Exception as e:
                scan_state["logs"].append(f"Warning: Failed to parse {json_path}. Skipping asset. Error: {str(e)}")
                continue

            asset_id = meta.get("id") or meta.get("assetId") or folder_name
            asset_name = meta.get("name") or folder_name.replace("_", " ").title()
            
            # Parse Categories
            category_paths = []
            if "assetCategories" in meta:
                category_paths = parse_categories_tree(meta["assetCategories"])
            elif "categories" in meta:
                # Fallback to simple list
                cats = meta["categories"]
                if isinstance(cats, list):
                    category_paths = [cats]
            
            if not category_paths:
                category_paths = [["3d" if "3d" in folder_name.lower() else "surface"]]

            # Parse Tags
            tags = meta.get("tags", [])
            if not isinstance(tags, list):
                tags = []

            # Asset Type mapping
            # '3d' | '3dplant' | 'surface' | 'decal' | 'atlas'
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

            # Step 3: Physical verification on disk for resolutions, preview image, and sizes
            # Preview Image
            preview_dir = os.path.join(folder, "Preview")
            thumbnail = ""
            if os.path.isdir(preview_dir):
                images = [f for f in os.listdir(preview_dir) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                if images:
                    thumbnail = os.path.join(preview_dir, images[0])
            if not thumbnail:
                # Look in root
                images = [f for f in os.listdir(folder) if f.lower().endswith((".png", ".jpg", ".jpeg", ".tga", ".webp"))]
                if images:
                    thumbnail = os.path.join(folder, images[0])

            # Resolutions verification
            thumbs_dir = os.path.join(folder, "Thumbs")
            available_resolutions = []
            if os.path.isdir(thumbs_dir):
                subdirs = [d.upper() for d in os.listdir(thumbs_dir) if os.path.isdir(os.path.join(thumbs_dir, d))]
                for res in ["8K", "4K", "2K", "1K"]:
                    if res in subdirs:
                        available_resolutions.append(res.lower())
            
            if not available_resolutions:
                # Search filename patterns
                found_res = set()
                for r, d, files in os.walk(folder):
                    for file in files:
                        f_low = file.lower()
                        if "8k" in f_low: found_res.add("8k")
                        elif "4k" in f_low: found_res.add("4k")
                        elif "2k" in f_low: found_res.add("2k")
                        elif "1k" in f_low: found_res.add("1k")
                if found_res:
                    available_resolutions = sorted(list(found_res), reverse=True)
                else:
                    available_resolutions = ["2k"]

            # Calculate byte sizes
            total_bytes = 0
            mesh_bytes = 0
            textures_list = []
            mesh_format = "FBX"

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
                        
                        # Identify mesh format and weight
                        if ext in ['.fbx', '.obj', '.uasset', '.max', '.ma', '.usd']:
                            mesh_bytes += sz
                            mesh_format = ext[1:].upper()
                        elif is_in_root or is_in_uasset:
                            if ext not in ['.png', '.exr', '.tga', '.jpg', '.jpeg', '.json', '.xml']:
                                mesh_bytes += sz

                        # Capture texture maps
                        if ext in ['.png', '.exr', '.tga', '.jpg', '.jpeg']:
                            # Determine resolution of texture
                            tex_res = "2k"
                            if "8k" in f_low: tex_res = "8k"
                            elif "4k" in f_low: tex_res = "4k"
                            elif "1k" in f_low: tex_res = "1k"
                            
                            # Determine map type
                            tex_type = "Albedo"
                            if "normal" in f_low: tex_type = "Normal"
                            elif "roughness" in f_low: tex_type = "Roughness"
                            elif "displacement" in f_low or "height" in f_low: tex_type = "Displacement"
                            elif "ao" in f_low or "ambientocclusion" in f_low: tex_type = "AO"
                            elif "opacity" in f_low or "alpha" in f_low: tex_type = "Opacity"
                            elif "cavity" in f_low: tex_type = "Cavity"
                            
                            textures_list.append({
                                "name": file,
                                "type": tex_type,
                                "resolution": tex_res,
                                "size": format_size(sz),
                                "rawSize": sz
                            })
                    except Exception:
                        pass

            # Create standard representation
            total_size_str = format_size(total_bytes)
            mesh_size_str = format_size(mesh_bytes) if mesh_bytes > 0 else "0 B"

            # Parse mesh stats
            mesh_stats = None
            if mesh_bytes > 0:
                mesh_stats = {
                    "vertices": meta.get("meshStats", {}).get("vertices", 4210),
                    "triangles": meta.get("meshStats", {}).get("triangles", 8200),
                    "format": mesh_format
                }

            # Insert or replace record in SQLite
            cursor.execute("""
                INSERT OR REPLACE INTO assets (
                    id, name, type, local_path, thumbnail, total_size, mesh_size,
                    category_paths, tags, available_resolutions, date_added, textures, mesh_stats, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                asset_id,
                asset_name,
                asset_type,
                folder,
                thumbnail,
                total_size_str,
                mesh_size_str,
                json.dumps(category_paths),
                json.dumps(tags),
                json.dumps(available_resolutions),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                json.dumps(textures_list),
                json.dumps(mesh_stats) if mesh_stats else None,
                meta.get("description", "")
            ))

            scan_state["assets_found"] += 1
            # Update progress dynamically (capped at 95% during traversal)
            progress_step = 15 + int((index + 1) / total_assets * 80)
            scan_state["progress"] = min(progress_step, 95)
            
            if index % 20 == 0 or index == total_assets - 1:
                scan_state["logs"].append(f"Processed {index + 1}/{total_assets} assets ({asset_name})")

        conn.commit()
        conn.close()

        scan_state["progress"] = 100
        scan_state["is_scanning"] = False
        scan_state["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Scan successfully completed! Mapped {scan_state['assets_found']} unique assets to local cache.")

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
        "database_connected": os.path.exists(DB_PATH),
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
        "logs": scan_state["logs"][-50:]  # Return the last 50 log messages
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
        # Deserialize JSON text strings back to Python lists/dicts
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

        # Build standard frontend Asset structure
        # Resolution uses first available
        resolution = available_resolutions[0] if available_resolutions else "2k"
        
        # Calculate raw total size in bytes (fallback)
        total_size_str = row["total_size"] or "0 B"
        raw_size = 0
        try:
            # simple parse back if needed
            val, unit = total_size_str.split()
            val_f = float(val)
            mul = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}.get(unit.upper(), 1)
            raw_size = int(val_f * mul)
        except Exception:
            raw_size = 0

        # Build asset payload compatible with React front-end types
        asset = {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "size": raw_size,
            "isZipped": bool(row["is_zipped"]),
            "resolution": resolution,
            "thumbnailUrl": row["thumbnail"] or "",
            "tags": tags,
            "categories": [], # Will be mapped dynamically to IDs on React side
            "categoryPaths": category_paths, # Retain raw multi-category paths for React mapping
            "scannedPath": row["local_path"],
            "dateAdded": row["date_added"],
            "textures": textures,
            "description": row["description"] or ""
        }
        if mesh_stats:
            asset["meshStats"] = mesh_stats
            
        assets.append(asset)

    return {"assets": assets}

if __name__ == "__main__":
    import uvicorn
    # Bind to standard local port
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
