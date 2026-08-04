"""Build validated CC0 derivatives without modifying third_party originals."""

from __future__ import annotations

import json
import math
from collections import deque
from pathlib import Path
import xml.etree.ElementTree as ET

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
THIRD_PARTY = ROOT / "third_party"
OUT = ROOT / "assets" / "game-art" / "cc0"
REPORTS = ROOT / "reports"

PACKS = {
    "kenney-roguelike-pack": {"author": "Kenney", "license": "CC0 1.0"},
    "tiny-creatures": {"author": "Clint Bellanger", "license": "CC0 1.0"},
    "kenney-rpg-base": {"author": "Kenney", "license": "CC0 1.0"},
    "kenney-roguelike-characters": {"author": "Kenney", "license": "CC0 1.0"},
}

CREATURES = {
    "monsters/star-slime.webp": ("tiny-creatures/tiny-creatures/Tiles/tile_0046.png", 192, "星芽史萊姆"),
    "monsters/moon-rabbit.webp": ("tiny-creatures/tiny-creatures/Tiles/tile_0177.png", 192, "月耳兔"),
    "monsters/star-beetle.webp": ("tiny-creatures/tiny-creatures/Tiles/tile_0140.png", 192, "星甲蟲"),
    "bosses/crowned-beast.webp": ("tiny-creatures/tiny-creatures/Tiles/tile_0169.png", 384, "王冠巨獸"),
    "pets/star-slime.webp": ("tiny-creatures/tiny-creatures/Tiles/tile_0059.png", 128, "星芽史萊姆寵物"),
}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def image_info(path: Path) -> dict:
    with Image.open(path) as image:
        alpha = "A" in image.getbands() or "transparency" in image.info
        return {"width": image.width, "height": image.height, "mode": image.mode, "alpha": alpha}


def remove_edge_connected_background(image: Image.Image) -> Image.Image:
    """Make only corner-colour pixels connected to an edge transparent."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    corners = [pixels[0, 0][:3], pixels[width - 1, 0][:3], pixels[0, height - 1][:3], pixels[width - 1, height - 1][:3]]
    background = max(set(corners), key=corners.count)
    queue = deque()
    visited = set()
    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or pixels[x, y][:3] != background:
            continue
        visited.add((x, y))
        pixels[x, y] = (*background, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                queue.append((nx, ny))
    return rgba


def closest_metadata(path: Path) -> dict:
    result = {"tileWidth": None, "tileHeight": None, "margin": None, "spacing": None,
              "columns": None, "rows": None, "metadata": None}
    candidates = []
    for parent in [path.parent, *path.parents]:
        if parent == ROOT.parent:
            break
        candidates.extend(parent.glob("*.tsx"))
        candidates.extend(parent.glob("spritesheetInfo.txt"))
        if candidates:
            break
    if not candidates:
        return result
    meta = candidates[0]
    result["metadata"] = rel(meta)
    if meta.suffix.lower() == ".tsx":
        try:
            node = ET.parse(meta).getroot()
            result.update({
                "tileWidth": int(node.get("tilewidth", 0)) or None,
                "tileHeight": int(node.get("tileheight", 0)) or None,
                "margin": int(node.get("margin", 0)),
                "spacing": int(node.get("spacing", 0)),
                "columns": int(node.get("columns", 0)) or None,
            })
        except (ET.ParseError, ValueError):
            pass
    return result


def scan_library() -> list[dict]:
    records = []
    suffixes = {".png", ".webp", ".tmx", ".tsx"}
    for path in sorted(THIRD_PARTY.rglob("*")):
        if not path.is_file() or (path.suffix.lower() not in suffixes and path.name != "spritesheetInfo.txt"):
            continue
        pack = path.relative_to(THIRD_PARTY).parts[0]
        record = {"pack": pack, "path": rel(path), "type": path.suffix.lower().lstrip(".") or "metadata"}
        if path.suffix.lower() in {".png", ".webp"}:
            try:
                record.update(image_info(path))
                record.update(closest_metadata(path))
                record["category"] = "source-image"
                name = path.name.lower()
                disallowed = any(word in name for word in ("preview", "sample", "example"))
                record["directIntegration"] = not disallowed and record["width"] <= 512 and record["height"] <= 512
                record["reason"] = "preview/sample source" if disallowed else (
                    "independent tile or bounded image" if record["directIntegration"] else "sheet requires metadata-driven extraction"
                )
            except OSError as error:
                record.update({"directIntegration": False, "reason": f"decode failed: {error}"})
        else:
            record.update({"directIntegration": False, "reason": "metadata source", "category": "metadata"})
        records.append(record)
    return records


def create_creatures(source_index: list[dict]) -> list[dict]:
    outputs = []
    for output_rel, (source_rel, size, label) in CREATURES.items():
        source = THIRD_PARTY / source_rel
        output = OUT / output_rel
        output.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as raw:
            image = remove_edge_connected_background(raw)
            scaled = image.resize((size, size), Image.Resampling.NEAREST)
            scaled.save(output, "WEBP", lossless=True, method=6)
        metadata = {
            "name": label,
            "source": rel(source),
            "pack": "tiny-creatures",
            "author": PACKS["tiny-creatures"]["author"],
            "license": PACKS["tiny-creatures"]["license"],
            "originalSize": [16, 16],
            "outputSize": [size, size],
            "scalingMethod": "edge-connected background removal, then nearest-neighbor",
            "artType": "static-art",
            "animation": False,
        }
        write_json(output.with_suffix(".json"), metadata)
        outputs.append({"output": rel(output), **metadata})
    return outputs


def paste_tile(canvas: Image.Image, tile: Path, x: int, y: int, layout: list, layer: str) -> None:
    with Image.open(tile) as raw:
        image = raw.convert("RGBA")
        canvas.alpha_composite(image, (x, y))
    layout.append({"source": rel(tile), "x": x, "y": y, "scale": 1, "layer": layer})


def create_background() -> dict:
    tiles = THIRD_PARTY / "kenney-rpg-base" / "PNG"
    canvas = Image.new("RGBA", (1920, 1088), (0, 0, 0, 0))
    layout: list[dict] = []
    grass = [tiles / "rpgTile003.png", tiles / "rpgTile004.png"]
    dirt = [tiles / "rpgTile008.png", tiles / "rpgTile009.png", tiles / "rpgTile026.png"]
    for row in range(17):
        for col in range(30):
            paste_tile(canvas, grass[(row * 7 + col * 3) % len(grass)], col * 64, row * 64, layout, "ground")

    # A broad, readable trail crosses behind the combatants without covering them.
    for row in range(8, 12):
        for col in range(2, 28):
            if row == 8:
                tile_index = 5 if col == 2 else (7 if col == 27 else 6)
            elif row == 11:
                tile_index = 41 if col == 2 else (43 if col == 27 else 42)
            else:
                tile_index = 8 + ((row + col) % 2)
            paste_tile(canvas, tiles / f"rpgTile{tile_index:03d}.png", col * 64, row * 64, layout, "path")

    # Tree bands frame the arena; all placements use independent transparent tiles.
    tree_pairs = [(175, 195), (177, 197), (179, 199)]
    positions = [(col * 64, (col % 3) * 28) for col in range(0, 30, 3)]
    positions += [(0, 300), (64, 360), (1792, 330), (1856, 280)]
    for index, (x, y) in enumerate(positions):
        top, bottom = tree_pairs[index % len(tree_pairs)]
        paste_tile(canvas, tiles / f"rpgTile{top:03d}.png", x, y, layout, "foliage")
        paste_tile(canvas, tiles / f"rpgTile{bottom:03d}.png", x, y + 64, layout, "foliage")
    for index, (x, y) in enumerate([(80, 210), (310, 260), (1490, 240), (1710, 190)]):
        bush = [155, 157, 159][index % 3]
        paste_tile(canvas, tiles / f"rpgTile{bush:03d}.png", x, y, layout, "foliage")

    # Small rocks/fences add foreground depth while leaving the central battle lane clear.
    props = [181, 182, 201, 202, 215, 216]
    for index, col in enumerate(range(0, 30, 3)):
        y = 1000 if index % 2 == 0 else 940
        paste_tile(canvas, tiles / f"rpgTile{props[index % len(props)]:03d}.png", col * 64, y, layout, "foreground")

    output = OUT / "backgrounds" / "region-01-field.webp"
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.crop((0, 0, 1920, 1080)).convert("RGB").save(output, "WEBP", quality=92, method=6)
    metadata = {
        "output": rel(output),
        "pack": "kenney-rpg-base",
        "author": PACKS["kenney-rpg-base"]["author"],
        "license": PACKS["kenney-rpg-base"]["license"],
        "size": [1920, 1080],
        "method": "native-size independent tile composition",
        "tiles": layout,
    }
    write_json(OUT / "backgrounds" / "region-01-field-layout.json", metadata)
    return metadata


def create_character_parts_index() -> dict:
    source = THIRD_PARTY / "kenney-roguelike-characters" / "Spritesheet" / "roguelikeChar_transparent.png"
    info = image_info(source)
    tile, margin, spacing = 16, 1, 1
    columns = math.floor((info["width"] - margin * 2 + spacing) / (tile + spacing))
    rows = math.floor((info["height"] - margin * 2 + spacing) / (tile + spacing))
    parts = []
    with Image.open(source) as raw:
        image = raw.convert("RGBA")
        for row in range(rows):
            for column in range(columns):
                x = margin + column * (tile + spacing)
                y = margin + row * (tile + spacing)
                frame = image.crop((x, y, x + tile, y + tile))
                if frame.getbbox() is None:
                    continue
                parts.append({"index": row * columns + column, "row": row, "column": column,
                              "sourceRect": [x, y, tile, tile]})
    result = {
        "source": rel(source), "pack": "kenney-roguelike-characters", "author": "Kenney",
        "license": "CC0 1.0", "tileSize": [tile, tile], "margin": margin, "spacing": spacing,
        "columns": columns, "rows": rows, "parts": parts,
        "note": "Paper-doll parts index only; no player animation is inferred.",
    }
    write_json(OUT / "character-parts" / "index.json", result)
    return result


def write_reports(records: list[dict], outputs: list[dict], background: dict, parts: dict) -> None:
    write_json(REPORTS / "cc0-library-scan.json", {"count": len(records), "records": records})
    counts = {}
    for record in records:
        counts[record["pack"]] = counts.get(record["pack"], 0) + 1
    lines = ["# CC0 Library Scan", "", f"Scanned metadata and image records: **{len(records)}**", "",
             "| Pack | Records | License |", "|---|---:|---|"]
    for pack in sorted(counts):
        lines.append(f"| {pack} | {counts[pack]} | {PACKS.get(pack, {}).get('license', 'See License.txt')} |")
    lines += ["", "Every image record in `cc0-library-scan.json` includes dimensions, alpha, nearby grid metadata, suitability and reason.",
              "Preview/sample images are never marked for direct integration."]
    (REPORTS / "cc0-library-scan.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    candidate_lines = ["# Tiny Creature Candidates", "", "All selected sources are independent 16×16 tiles and outputs are static art, not animation.", "",
                       "| Role | Source | Output | Decision |", "|---|---|---|---|"]
    for output in outputs:
        candidate_lines.append(f"| {output['name']} | `{output['source']}` | `{output['output']}` | selected; nearest-neighbor; static-art |")
    (REPORTS / "tiny-creature-candidates.md").write_text("\n".join(candidate_lines) + "\n", encoding="utf-8")

    sources = {
        "version": 1,
        "licensePolicy": "All derivatives remain attributable to their CC0 source package.",
        "assets": outputs + [{key: value for key, value in background.items() if key != "tiles"}],
        "characterParts": {key: value for key, value in parts.items() if key != "parts"},
        "uiCandidates": [],
        "uiDecision": "No semantic UI tile IDs were supplied; no UI elements were guessed from a sheet.",
    }
    write_json(OUT / "asset-sources.json", sources)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    records = scan_library()
    outputs = create_creatures(records)
    background = create_background()
    parts = create_character_parts_index()
    write_reports(records, outputs, background, parts)
    print(json.dumps({"scanned": len(records), "creatures": len(outputs), "background": background["output"],
                      "characterParts": len(parts["parts"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
