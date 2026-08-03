#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install with: py -m pip install Pillow")
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "installer.config.json"
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)

@dataclass
class AssetResult:
    path: str
    category: str
    width: int
    height: int
    mode: str
    has_alpha: bool
    file_size: int
    status: str
    issues: list[str]

def load_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

def category_for(path: Path, config: dict[str, Any]) -> str:
    rel = path.relative_to(ROOT).as_posix()
    for category, rule in config["rules"].items():
        if rel.startswith(rule["pathPrefix"]):
            return category
    return "unknown"

def image_has_alpha(image: Image.Image) -> bool:
    if image.mode in ("RGBA", "LA"):
        alpha = image.getchannel("A")
        lo, hi = alpha.getextrema()
        return lo < 255
    if image.mode == "P" and "transparency" in image.info:
        return True
    return False

def validate(path: Path, config: dict[str, Any]) -> AssetResult:
    category = category_for(path, config)
    issues: list[str] = []
    try:
        with Image.open(path) as image:
            width, height = image.size
            mode = image.mode
            has_alpha = image_has_alpha(image)
    except Exception as exc:
        return AssetResult(
            path=path.relative_to(ROOT).as_posix(),
            category=category,
            width=0,
            height=0,
            mode="unknown",
            has_alpha=False,
            file_size=path.stat().st_size,
            status="invalid",
            issues=[f"decode_failed: {exc}"],
        )

    if category == "unknown":
        issues.append("unknown_category")
    else:
        rule = config["rules"][category]
        if rule.get("requiredAlpha") and not has_alpha:
            issues.append("alpha_required")
        if "minimumSize" in rule:
            mw, mh = rule["minimumSize"]
            if width < mw or height < mh:
                issues.append(f"too_small_min_{mw}x{mh}")
        if "allowedSizes" in rule and [width, height] not in rule["allowedSizes"]:
            issues.append("unexpected_icon_size")
        if "allowedFrameSizes" in rule:
            frame_sizes = rule["allowedFrameSizes"]
            valid_sheet = False
            for fw, fh in frame_sizes:
                if height == fh and width % fw == 0:
                    valid_sheet = True
                    break
                if width == fw and height == fh:
                    valid_sheet = True
                    break
            if not valid_sheet:
                issues.append("unexpected_sprite_dimensions")

    return AssetResult(
        path=path.relative_to(ROOT).as_posix(),
        category=category,
        width=width,
        height=height,
        mode=mode,
        has_alpha=has_alpha,
        file_size=path.stat().st_size,
        status="pass" if not issues else "warning",
        issues=issues,
    )

def build_index(results: list[AssetResult], config: dict[str, Any]) -> dict[str, Any]:
    assets: dict[str, Any] = {}
    for result in results:
        asset_id = result.path.replace("assets/game-art/", "").rsplit(".", 1)[0].replace("/", ".")
        assets[asset_id] = {
            "src": result.path.replace("assets/game-art/", ""),
            "category": result.category,
            "width": result.width,
            "height": result.height,
            "alpha": result.has_alpha,
            "status": result.status,
            "issues": result.issues,
        }
    return {
        "version": config["version"],
        "generatedBy": "Astral World Asset Installer v2.0",
        "assetCount": len(results),
        "assets": assets,
    }

def main() -> int:
    config = load_config()
    asset_root = ROOT / config["assetRoot"]
    extensions = {ext.lower() for ext in config["supportedExtensions"]}
    files = sorted(p for p in asset_root.rglob("*") if p.is_file() and p.suffix.lower() in extensions)
    results = [validate(path, config) for path in files]

    report = {
        "version": config["version"],
        "summary": {
            "total": len(results),
            "pass": sum(r.status == "pass" for r in results),
            "warning": sum(r.status == "warning" for r in results),
            "invalid": sum(r.status == "invalid" for r in results),
        },
        "assets": [asdict(r) for r in results],
    }
    (REPORTS / "asset-validation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    index = build_index(results, config)
    (ROOT / "assets" / "game-art" / "asset-index.generated.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    lines = [
        "# Astral World Asset Validation Report",
        "",
        f"- Total: {report['summary']['total']}",
        f"- Pass: {report['summary']['pass']}",
        f"- Warning: {report['summary']['warning']}",
        f"- Invalid: {report['summary']['invalid']}",
        "",
    ]
    for result in results:
        marker = "PASS" if result.status == "pass" else result.status.upper()
        issue_text = ", ".join(result.issues) if result.issues else "-"
        lines.append(
            f"- [{marker}] `{result.path}` {result.width}x{result.height} "
            f"alpha={result.has_alpha} issues={issue_text}"
        )
    (REPORTS / "asset-validation-report.md").write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps(report["summary"], ensure_ascii=False))
    return 1 if report["summary"]["invalid"] else 0

if __name__ == "__main__":
    raise SystemExit(main())
