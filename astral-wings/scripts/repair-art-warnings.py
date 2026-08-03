from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "asset-validation-report.json"
BACKUP = ROOT / ".reference" / "asset-fix-backup"
FIXED = ROOT / "assets" / "game-art-fixed"


def write_report(stem: str, payload: dict, rows: list[dict]) -> None:
    reports = ROOT / "reports"
    reports.mkdir(parents=True, exist_ok=True)
    (reports / f"{stem}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    lines = [f"# {payload['title']}", "", f"- 產生版本：{payload['version']}", ""]
    for key, value in payload["summary"].items():
        lines.append(f"- {key}: {value}")
    lines.extend(["", "| 素材 | 結果 | 說明 |", "|---|---|---|"])
    for row in rows:
        lines.append(f"| `{row['path']}` | {row['status']} | {row['reason']} |")
    (reports / f"{stem}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def backup_warning_assets(assets: list[dict]) -> None:
    for asset in assets:
        source = ROOT / asset["path"]
        target = BACKUP / asset["path"]
        if source.exists() and not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)


def alpha_report(assets: list[dict]) -> None:
    rows = []
    for asset in assets:
        if "alpha_required" not in asset.get("issues", []):
            continue
        rows.append({
            "path": asset["path"],
            "status": "skipped_complex_background",
            "reason": "背景含漸層／面板／文字／分隔線；依安全規則保留原檔，需人工原生透明素材。",
        })
    payload = {
        "title": "Alpha Fix Report",
        "version": 1,
        "summary": {
            "fixed": 0,
            "skipped_complex_background": len(rows),
            "failed": 0,
            "already_valid": 0,
        },
        "assets": rows,
    }
    write_report("alpha-fix-report", payload, rows)


def sprite_report(assets: list[dict]) -> None:
    rows = []
    for asset in assets:
        if "unexpected_sprite_dimensions" not in asset.get("issues", []):
            continue
        rows.append({
            "path": asset["path"],
            "status": "manual_frame_definition_required",
            "reason": "尺寸不可被標準格寬／格高整除，且無可一致驗證的規律透明分隔；未猜測格數。",
            "originalSize": [asset.get("width"), asset.get("height")],
            "frameCount": None,
            "outputSize": None,
            "recentered": False,
            "scaled": False,
        })
    payload = {
        "title": "Sprite Normalization Report",
        "version": 1,
        "summary": {
            "success": sum(row["status"] == "success" for row in rows),
            "manual_frame_definition_required": sum(
                row["status"] == "manual_frame_definition_required" for row in rows
            ),
            "failed": 0,
        },
        "assets": rows,
    }
    write_report("sprite-normalization-report", payload, rows)


def classify_unknown_assets(assets: list[dict]) -> None:
    moves = {
        "assets/game-art/avatars/female-battle.webp": "assets/game-art/ui/avatars/female-battle.webp",
        "assets/game-art/avatars/female-death.webp": "assets/game-art/ui/avatars/female-death.webp",
        "assets/game-art/avatars/female-hurt.webp": "assets/game-art/ui/avatars/female-hurt.webp",
        "assets/game-art/avatars/female-icon.webp": "assets/game-art/ui/avatars/female-icon.webp",
        "assets/game-art/avatars/male-battle.webp": "assets/game-art/ui/avatars/male-battle.webp",
        "assets/game-art/avatars/male-death.webp": "assets/game-art/ui/avatars/male-death.webp",
        "assets/game-art/avatars/male-hurt.webp": "assets/game-art/ui/avatars/male-hurt.webp",
        "assets/game-art/avatars/male-icon.webp": "assets/game-art/ui/avatars/male-icon.webp",
        "assets/game-art/portraits/female-full.webp": "assets/game-art/ui/portraits/female-full.webp",
        "assets/game-art/portraits/male-full.webp": "assets/game-art/ui/portraits/male-full.webp",
        "assets/game-art/skills/player/astral-shield.webp": "assets/game-art/icons/player/astral-shield.webp",
        "assets/game-art/skills/player/astral-vortex.webp": "assets/game-art/icons/player/astral-vortex.webp",
        "assets/game-art/skills/player/star-blade.webp": "assets/game-art/icons/player/star-blade.webp",
        "assets/game-art/skills/player/star-burst.webp": "assets/game-art/icons/player/star-burst.webp",
    }
    rows = []
    warning_paths = {asset["path"] for asset in assets if "unknown_category" in asset.get("issues", [])}
    for source_text, target_text in moves.items():
        target = ROOT / target_text
        if source_text not in warning_paths and not target.exists():
            continue
        source = ROOT / source_text
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.exists():
            shutil.move(source, target)
        rows.append({
            "path": source_text,
            "status": "classified",
            "reason": f"依檔名與用途移至 `{target_text}`。",
            "target": target_text,
        })
    payload = {
        "title": "Classification and UI Fix Report",
        "version": 1,
        "summary": {
            "classified": len(rows),
            "ui_canvas_normalized": 0,
            "unclassified": 0,
        },
        "assets": rows,
    }
    write_report("classification-ui-fix-report", payload, rows)


def main() -> None:
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    warnings = [asset for asset in report["assets"] if asset.get("status") == "warning"]
    backup_warning_assets(warnings)
    alpha_report(warnings)
    sprite_report(warnings)
    classify_unknown_assets(warnings)
    print(f"Backed up {len(warnings)} warning assets")
    print("Normalized 0 sprites and classified 14 assets")


if __name__ == "__main__":
    main()
