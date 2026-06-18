#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]

P1_FILES = [
    "assets/block/kazan4.webp",
    "assets/block/buoffer1.webp",
    "assets/block/kazan_v5.webp",
    "assets/block/sud.webp",
    "assets/block/off_obm.webp",
    "assets/block/offer2.webp",
    "assets/block/offer3.webp",
]

P2_FILES = [f"assets/scenarios/zpp{i}.webp" for i in range(1, 10)]


def resize_to_width(src: Path, out: Path, target_width: int, quality: int = 80, method: int = 5) -> None:
    with Image.open(src) as img:
        src_w, src_h = img.size
        if src_w <= target_width:
            resized = img.copy()
        else:
            ratio = target_width / float(src_w)
            target_height = max(1, int(round(src_h * ratio)))
            resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        resized.save(
            out,
            format="WEBP",
            quality=quality,
            method=method,
            optimize=True,
        )


def out_name(src: Path, width: int) -> Path:
    return src.with_name(f"{src.stem}-{width}{src.suffix}")


def process() -> list[Path]:
    created: list[Path] = []

    for rel in P1_FILES:
        src = ROOT / rel
        out_1920 = out_name(src, 1920)
        out_2560 = out_name(src, 2560)
        resize_to_width(src, out_1920, 1920, quality=80, method=5)
        resize_to_width(src, out_2560, 2560, quality=80, method=5)
        created.extend([out_1920, out_2560])

    for rel in P2_FILES:
        src = ROOT / rel
        out_1600 = out_name(src, 1600)
        resize_to_width(src, out_1600, 1600, quality=80, method=5)
        created.append(out_1600)

    return created


if __name__ == "__main__":
    created_files = process()
    for item in created_files:
        print(item.relative_to(ROOT).as_posix())
